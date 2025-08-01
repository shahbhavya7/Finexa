"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai";
import aj from "@/lib/arcjet";
import { request } from "@arcjet/next";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const serializeAmount = (obj) => ({
  ...obj,
  amount: obj.amount.toNumber(),
});

// Create Transaction
export async function createTransaction(data) {
  try {
    const { userId } = await auth(); // Ensure user is authenticated
    if (!userId) throw new Error("Unauthorized");

    // Get request data for ArcJet
  //   const req = await request();

  //  // Check rate limit
  //   const decision = await aj.protect(req, {
  //     userId,
  //     requested: 1, // Specify how many tokens to consume per request, one request consumes one token and we have set the refill rate to 10 tokens per hour
  //   });

  //   if (decision.isDenied()) { // If the request is denied, handle rate limiting
  //     if (decision.reason.isRateLimit()) {
  //       const { remaining, reset } = decision.reason;
  //       console.error({
  //         code: "RATE_LIMIT_EXCEEDED",
  //         details: {
  //           remaining,
  //           resetInSeconds: reset,
  //         },
  //       });

  //       throw new Error("Too many requests. Please try again later."); // Inform user about rate limit
  //     }

  //     throw new Error("Request blocked"); // If the request is blocked for any other reason
  //   }

    const user = await db.user.findUnique({ // Ensure user exists
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found"); // Ensure user exists
    }

    const account = await db.account.findUnique({
      where: { // Ensure account exists
        id: data.accountId,
        userId: user.id,
      },
    });

    if (!account) {
      throw new Error("Account not found"); // Ensure account exists
    }

    // Calculate new balance based on transaction type
    const balanceChange = data.type === "EXPENSE" ? -data.amount : data.amount; // if expense, subtract amount; if income, add amount
    const newBalance = account.balance.toNumber() + balanceChange; // calculate new balance by adding or subtracting the amount

    // Create transaction and update account balance
    const transaction = await db.$transaction(async (tx) => { // Use prisma transaction to ensure atomicity
      const newTransaction = await tx.transaction.create({ // create new transaction
        data: { // create transaction with provided data
          ...data,
          userId: user.id, // associate transaction with user
          nextRecurringDate:  // calculate next recurring date to set if transaction is recurring , only if transaction is recurring
            data.isRecurring && data.recurringInterval // if transaction is recurring
              ? calculateNextRecurringDate(data.date, data.recurringInterval) // calculate next date based on interval
              : null,
        },
      });

      await tx.account.update({ // update account balance
        // update account balance based on transaction type
        where: { id: data.accountId },
        data: { balance: newBalance },
      });

      return newTransaction; // return created transaction which returns the transaction object
    });

    revalidatePath("/dashboard"); // revalidate dashboard path to reflect new transaction
    revalidatePath(`/account/${transaction.accountId}`); // revalidate account path to reflect new balance

    return { success: true, data: serializeAmount(transaction) }; // return success response with serialized transaction data
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function getTransaction(id) { // Get Transaction by ID
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ // Ensure user exists
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const transaction = await db.transaction.findUnique({ // Find transaction by ID and user ID
    where: {
      id,
      userId: user.id,
    },
  });

  if (!transaction) throw new Error("Transaction not found");

  return serializeAmount(transaction); // Return serialized transaction data
}

export async function updateTransaction(id, data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    // Get original transaction to calculate balance change
    const originalTransaction = await db.transaction.findUnique({ // Find original transaction by ID and user ID
      where: { 
        id,
        userId: user.id,
      },
      include: {
        account: true,
      },
    });

    if (!originalTransaction) throw new Error("Transaction not found"); // Ensure original transaction exists

    // Calculate balance changes
    const oldBalanceChange = 
      originalTransaction.type === "EXPENSE" // If the original transaction was an expense, subtract its amount from the balance else add it
        ? -originalTransaction.amount.toNumber()
        : originalTransaction.amount.toNumber();
 
    const newBalanceChange = // Calculate new balance change based on updated transaction type
      data.type === "EXPENSE" ? -data.amount : data.amount; // If the updated transaction is an expense, subtract its amount from the balance else add it

    const netBalanceChange = newBalanceChange - oldBalanceChange; // Calculate net balance change by subtracting old balance change from new balance change

    // Update transaction and account balance in a transaction
    const transaction = await db.$transaction(async (tx) => { // Use prisma transaction to ensure atomicity
      const updated = await tx.transaction.update({ // Update transaction with new data
        where: {
          id,
          userId: user.id,
        },
        data: { 
          ...data, // Update transaction with provided updated data on frontend which includes the new amount, type, date, etc.
          nextRecurringDate: // calculate next recurring date to set if transaction is recurring , only if transaction is recurring
            data.isRecurring && data.recurringInterval // if transaction is recurring
              ? calculateNextRecurringDate(data.date, data.recurringInterval)
              : null,
        },
      });

      // Update account balance
      await tx.account.update({ // Update account balance based on net balance change
        where: { id: data.accountId },
        data: {
          balance: { // Update account balance by incrementing it with the net balance change
            increment: netBalanceChange,
          },
        },
      });

      return updated; // Return updated transaction
    });

    revalidatePath("/dashboard"); // Revalidate dashboard path to reflect updated transaction
    revalidatePath(`/account/${data.accountId}`); // Revalidate account path to reflect updated balance

    return { success: true, data: serializeAmount(transaction) }; // Return success response with serialized updated transaction data
  } catch (error) {
    throw new Error(error.message);
  }
}

// Get User Transactions by Query
// This function retrieves transactions for the authenticated user based on the provided query parameters.
export async function getUserTransactions(query = {}) { 
  try {
    const { userId } = await auth(); // Ensure user is authenticated
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({ 
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const transactions = await db.transaction.findMany({ // Retrieve transactions for the user based on the query
      // Use the provided query to filter transactions
      where: {
        userId: user.id, // Ensure transactions belong to the authenticated user
        ...query, // Apply any additional filters from the query
      },
      include: {  
        account: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    return { success: true, data: transactions }; // Return the retrieved transactions
  } catch (error) {
    throw new Error(error.message);
  }
}

// Scan Receipt
export async function scanReceipt(file) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Convert File to ArrayBuffer as required by Gemini
    const arrayBuffer = await file.arrayBuffer(); 
    // Convert ArrayBuffer to Base64 as Gemini expects base64 encoded data
    const base64String = Buffer.from(arrayBuffer).toString("base64");

    const prompt = `
      Analyze this receipt image and extract the following information in JSON format:
      - Total amount (just the number)
      - Date (in ISO format)
      - Description or items purchased (brief summary)
      - Merchant/store name
      - Suggested category (one of: housing,transportation,groceries,utilities,entertainment,food,shopping,healthcare,education,personal,travel,insurance,gifts,bills,other-expense )
      
      Only respond with valid JSON in this exact format:
      {
        "amount": number,
        "date": "ISO date string",
        "description": "string",
        "merchantName": "string",
        "category": "string"
      }

      If its not a recipt, return an empty object
    `;

    const result = await model.generateContent([ // Use inline data to pass the base64 encoded image
      {
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      },
      prompt, // Pass the prompt to Gemini
    ]);

    const response = await result.response; // Get the response from Gemini
    const text = response.text(); // Extract the text from the response
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim(); // Clean the text to remove any code block formatting

    try {
      const data = JSON.parse(cleanedText); // Parse the cleaned text as JSON
      return { // Return the parsed data
        amount: parseFloat(data.amount),
        date: new Date(data.date),
        description: data.description,
        category: data.category,
        merchantName: data.merchantName,
      };
    } catch (parseError) {
      console.error("Error parsing JSON response:", parseError);
      throw new Error("Invalid response format from Gemini");
    }
  } catch (error) {
    console.error("Error scanning receipt:", error);
    throw new Error("Failed to scan receipt");
  }
}

// Helper function to calculate next recurring date
function calculateNextRecurringDate(startDate, interval) {
  const date = new Date(startDate);

  switch (interval) { 
    case "DAILY": // For daily recurrence, add one day for each occurrence
      date.setDate(date.getDate() + 1);
      break;
    case "WEEKLY":
      date.setDate(date.getDate() + 7); // For weekly recurrence, add 7 days
      break;
    case "MONTHLY":
      date.setMonth(date.getMonth() + 1); // For monthly recurrence, add one month
      break;
    case "YEARLY":
      date.setFullYear(date.getFullYear() + 1); // For yearly recurrence, add one year
      break;
  }

  return date;
}
