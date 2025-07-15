"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";


const serializeDecimal = (obj) => {
  const serialized = { ...obj };
  if (obj.balance) {
    serialized.balance = obj.balance.toNumber();
  }
  if (obj.amount) {
    serialized.amount = obj.amount.toNumber();
  }
  return serialized;
};

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

export async function getAccountWithTransactions(accountId) { // Function to get account details along with its transactions
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const account = await db.account.findUnique({ // Fetch the account details from the database using Prisma client
    where: {
      id: accountId,
      userId: user.id,
    },
    include: { // Include related transactions and their count in descending order of date
      transactions: {
        orderBy: { date: "desc" },
      },
      _count: {
        select: { transactions: true },
      },
    },
  });

  if (!account) return null; // If account not found, return null

  return {
    ...serializeDecimal(account), // Serialize the account object to convert BigInt fields to regular numbers
    transactions: account.transactions.map(serializeDecimal), // Serialize each transaction in the account to convert BigInt fields to regular numbers
  };
}

export async function bulkDeleteTransactions(transactionIds) { // Function to delete multiple transactions and update account balances accordingly
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized"); // Check if the user is authenticated

    const user = await db.user.findUnique({ // Fetch the user from the database using Prisma client
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found"); // If user not found, throw an error

    // Get transactions to calculate balance changes
    const transactions = await db.transaction.findMany({ // Fetch transactions that match the provided transaction IDs and belong to the authenticated user
      where: {
        id: { in: transactionIds },
        userId: user.id,
      },
    });

    // Group transactions by account to update balances
    const accountBalanceChanges = transactions.reduce((acc, transaction) => { // Reduce the transactions to calculate the balance changes for each account
      const change = 
        transaction.type === "EXPENSE" // If the transaction type is "EXPENSE", just use the amount as is else if it's "INCOME", negate the amount
          ? transaction.amount
          : -transaction.amount;
      acc[transaction.accountId] = (acc[transaction.accountId] || 0) + change; // Accumulate the balance change for each account by adding the change 
      // amount to the existing balance change for that account
      return acc; // Return the accumulator object which now contains the total balance changes for each account
    }, {});

    // Delete transactions and update account balances in a transaction
    await db.$transaction(async (tx) => { // Use a transaction to ensure atomicity, meaning either all operations succeed or none do
      // Delete transactions
      await tx.transaction.deleteMany({ // Delete all transactions that match the provided transaction IDs and belong to the authenticated user
        where: {
          id: { in: transactionIds },
          userId: user.id,
        },
      });

      // Update account balances
      for (const [accountId, balanceChange] of Object.entries( // Iterate over each account and its corresponding balance change
        accountBalanceChanges // Object.entries converts the object into an array of [key, value] pairs, here key is accountId and value is balanceChange
      )) {
        await tx.account.update({
          where: { id: accountId }, // take out the accountId from the key
          data: { // Update the account's balance by incrementing it with the calculated balance change
            balance: {
              increment: balanceChange, // increament is a Prisma method to increment the balance by the specified amount
            },
          },
        });
      }
    });

    revalidatePath("/dashboard"); // Revalidate the dashboard path to update the UI with the new account balances
    revalidatePath("/account/[id]"); // Revalidate the account details page to reflect the changes made

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateDefaultAccount(accountId) { // Function to update the default account for a user 
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // First, unset any existing default account by setting their isDefault to false in the database
    await db.account.updateMany({
      where: {
        userId: user.id,
        isDefault: true,
      },
      data: { isDefault: false },
    });

    // Then set the new default account by updating the isDefault field to true for the specified account ID passed as an argument
    const account = await db.account.update({
      where: {
        id: accountId,
        userId: user.id,
      },
      data: { isDefault: true },
    });

    revalidatePath("/dashboard"); // Revalidate the dashboard path to update the UI with the new default account
    return { success: true, data: serializeTransaction(account) }; // Return success status and serialized account data
  } catch (error) {
    return { success: false, error: error.message };
  }
}
