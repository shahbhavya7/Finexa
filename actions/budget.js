"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getCurrentBudget(accountId) { // Fetch the current budget and expenses for the user
  try {
    const { userId } = await auth(); // Get the authenticated user ID
    if (!userId) throw new Error("Unauthorized"); // Ensure user is authenticated

    const user = await db.user.findUnique({ // Find the user by Clerk user ID
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const budget = await db.budget.findFirst({ // Get the user's budget , if it exists , findFirst is used to get the first budget record as 
    // there should be only one budget per user
      where: {
        userId: user.id,
      },
    });

    // Get current month's expenses
    const currentDate = new Date(); // Get the current date
    const startOfMonth = new Date( // Calculate the start of the current month
      currentDate.getFullYear(), // Get the current year
      currentDate.getMonth(), // Get the current month
      1 // Set the day to 1 to get the start of the month
    );
    const endOfMonth = new Date( // Calculate the end of the current month
      currentDate.getFullYear(),
      currentDate.getMonth() + 1, // Move to the next month
      0 // Set the day to 0 to get the last day of the current month
    );

    const expenses = await db.transaction.aggregate({ // Aggregate the expenses for the current month, aggregate is used to sum up the amounts
      where: { // Filter transactions by user ID, type (EXPENSE), and date range
        userId: user.id,
        type: "EXPENSE",
        date: { // Filter transactions by date range i.e. aggregate only those transactions that fall within the current month
          gte: startOfMonth,
          lte: endOfMonth,
        },
        accountId, // Filter transactions by account ID if provided
      },
      _sum: { // Sum the amount of the transactions, _sum is used to get the total amount of expenses
        amount: true, // Sum the amount field
      },
    });

    return { 
      budget: budget ? { ...budget, amount: budget.amount.toNumber() } : null, // if budget is there , whatever is there inside budget, from it we update
      // amount to be a number
      currentExpenses: expenses._sum.amount // If expenses are found, return the sum of the amounts after converting it to a number else return 0
        ? expenses._sum.amount.toNumber()
        : 0,
    };
  } catch (error) {
    console.error("Error fetching budget:", error);
    throw error;
  }
}

export async function updateBudget(amount) { // update the budget for the user
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    // Update or create budget
    const budget = await db.budget.upsert({ // Upsert is used to update the budget if it exists or create a new one if it doesn't
      where: {
        userId: user.id,
      },
      update: { // Update the budget amount if it exists to the new amount
        amount,
      },
      create: { // Create a new budget record if it doesn't exist with the user ID and amount
        userId: user.id,
        amount,
      },
    });

    revalidatePath("/dashboard"); // Revalidate the dashboard path to reflect the updated budget
    return {
      success: true,
      data: { ...budget, amount: budget.amount.toNumber() }, // Return the updated budget with amount as a number
    };
  } catch (error) {
    console.error("Error updating budget:", error);
    return { success: false, error: error.message };
  }
}
