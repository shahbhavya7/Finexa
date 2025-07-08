"use server";

import aj from "@/lib/arcjet";
import { db } from "@/lib/prisma";
// import { request } from "@arcjet/next";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

const serializeTransaction = (obj) => { // as nextjs does not support BigInt, we need to serialize the transaction object before sending it to the client
  // Convert BigInt fields to regular numbers for JSON serialization, serialize means converting the object to a format that can be sent to the client
  const serialized = { ...obj }; // create a copy of the object to avoid mutating the original object
  // If the object has a balance or amount field, convert it to a number
  if (obj.balance) {
    serialized.balance = obj.balance.toNumber();
  }
  if (obj.amount) {
    serialized.amount = obj.amount.toNumber();
  }
  return serialized; // return the serialized object
};
 
export async function getUserAccounts() { // this server action is used to get the user accounts, it is called from the client side
  // Get the user ID from Clerk authentication
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized"); // Ensure the user is authenticated, if not show an error

  const user = await db.user.findUnique({ // Find the user in the database using the Clerk user ID
    where: { clerkUserId: userId },
  });

  if (!user) {  // If the user is not found, throw an error
    throw new Error("User not found");
  }

  try { // Fetch user accounts from the database using Prisma client
    const accounts = await db.account.findMany({
      where: { userId: user.id }, // Find accounts that belong to the user
      orderBy: { createdAt: "desc" }, // Order accounts by creation date in descending order
      include: { // Include related transactions count for each account
        _count: { // Count the number of transactions for each account
          select: { // Select the transactions count 
            transactions: true, // This will return the number of transactions associated with each account
          },
        },
      },
    });

    // Serialize accounts before sending to client
    const serializedAccounts = accounts.map(serializeTransaction); // Map through each account and serialize it using the serializeTransaction function

    return serializedAccounts; // Return the serialized accounts to the client
  } catch (error) {
    console.error(error.message);
  }
}

export async function createAccount(data) { // this server action is used to create a new account, data is passed from the client side , it has the account details
  try {
    const { userId } = await auth(); // Get the user ID from Clerk authentication
    if (!userId) throw new Error("Unauthorized"); // Ensure the user is authenticated , if not show an error 

    // Get request data for ArcJet
    // const req = await request();

    // // Check rate limit
    // const decision = await aj.protect(req, {
    //   userId,
    //   requested: 1, // Specify how many tokens to consume
    // });

    // if (decision.isDenied()) {
    //   if (decision.reason.isRateLimit()) {
    //     const { remaining, reset } = decision.reason;
    //     console.error({
    //       code: "RATE_LIMIT_EXCEEDED",
    //       details: {
    //         remaining,
    //         resetInSeconds: reset,
    //       },
    //     });

    //     throw new Error("Too many requests. Please try again later.");
    //   }

    //   throw new Error("Request blocked");
    // }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Convert balance to float before saving
    const balanceFloat = parseFloat(data.balance); // convert the balance to a float before saving it to the database as it is stored as a float in the database
    if (isNaN(balanceFloat)) { // if the balance is not a number, throw an error, showing that the balance amount is invalid
      throw new Error("Invalid balance amount");
    }

    // Check if this is the user's first account
    const existingAccounts = await db.account.findMany({ // find all the accounts of the user from the database using the user ID
      where: { userId: user.id },
    });

    // If it's the first account, make it default regardless of user input, existingAccounts will be empty if this is the first account
    // If not, use the user's preference
    const shouldBeDefault =
      existingAccounts.length === 0 ? true : data.isDefault;

    // shouldBeDeafult has default status of the account, if this is the first account, it will be true, otherwise it will be based on the user's preference
    // If this account should be default, unset other default accounts
    if (shouldBeDefault) {
      await db.account.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Create new account in the database using the Prisma client after checking the rate limit and user authentication
    // The account will have the user ID, balance, and other details from the data object
    const account = await db.account.create({
      data: {
        ...data,
        balance: balanceFloat,
        userId: user.id,
        isDefault: shouldBeDefault, // give the account a default status based on the user's preference or if it's the first account
      },
    });

    // Serialize the account before returning
    const serializedAccount = serializeTransaction(account); // serialize the account object to convert BigInt fields to regular numbers for JSON serialization

    revalidatePath("/dashboard"); // revalidate the dashboard path to update the UI with the new account. revalidate means refresh values o
    return { success: true, data: serializedAccount }; // return the success status and the serialized account data
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function getDashboardData() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Get all user transactions
  const transactions = await db.transaction.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
  });

  return transactions.map(serializeTransaction);
}
