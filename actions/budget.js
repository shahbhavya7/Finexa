"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getCurrentBudget(accountId) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const budget = await db.budget.findFirst({
      where: {
        userId: user.id,
      },
    });

    // ✅ FIX: Make sure we include ALL transactions this month (local timezone)
    const currentDate = new Date();
    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1,
      0,
      0,
      0 // 1st day, midnight
    );
    const endOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0,
      23,
      59,
      59 // Last day, 23:59:59
    );

    const expenses = await db.transaction.aggregate({
      where: {
        userId: user.id,
        type: "EXPENSE",
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        ...(accountId && { accountId }), // only filter if accountId is provided
      },
      _sum: {
        amount: true,
      },
    });

    const totalExpenses = expenses._sum.amount || 0;
    const percentageUsed =
      budget.amount > 0 ? (totalExpenses / budget.amount) * 100 : 0;

    return {
      budget: budget ? { ...budget, amount: budget.amount.toNumber() } : null, // if budget is there , whatever is there inside budget, from it we update
      // amount to be a number
      currentExpenses: expenses._sum.amount // If expenses are found, return the sum of the amounts after converting it to a number else return 0
        ? expenses._sum.amount.toNumber()
        : 0,
    };
  } catch (error) {
    console.error("Error fetching current budget:", error);
    throw error;
  }
}

export async function updateBudget(amount) {
  // update the budget for the user
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    // Update or create budget
    const budget = await db.budget.upsert({
      // Upsert is used to update the budget if it exists or create a new one if it doesn't
      where: {
        userId: user.id,
      },
      update: {
        // Update the budget amount if it exists to the new amount
        amount,
      },
      create: {
        // Create a new budget record if it doesn't exist with the user ID and amount
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
