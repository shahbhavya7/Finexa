import { inngest } from "./client";
import { db } from "@/lib/prisma";
import EmailTemplate from "@/emails/template";
import { sendEmail } from "@/actions/send-email";
//import { GoogleGenerativeAI } from "@google/generative-ai";

//1. Recurring Transaction Processing with Throttling
export const processRecurringTransaction = inngest.createFunction(
  {
    id: "process-recurring-transaction",
    name: "Process Recurring Transaction",
    throttle: { // Throttle settings to limit the number of events processed
      limit: 10, // Process 10 transactions
      period: "1m", // per minute 
      key: "event.data.userId", // Throttle per user
    },
  },
  { event: "transaction.recurring.process" },
  async ({ event, step }) => {
    // Validate event data
    if (!event?.data?.transactionId || !event?.data?.userId) { // Check if required data is present in the event
      console.error("Invalid event data:", event);
      return { error: "Missing required event data" };
    }

    await step.run("process-transaction", async () => { // Run the step to process the transaction
      const transaction = await db.transaction.findUnique({ // Fetch the transaction by ID and user ID
        where: {
          id: event.data.transactionId,
          userId: event.data.userId,
        },
        include: { // Include account details to update balance
          account: true,
        },
      });

      if (!transaction || !isTransactionDue(transaction)) return; // If transaction not found or not due, exit early

      // Create new transaction and update account balance in a transaction
      await db.$transaction(async (tx) => { // Use Prisma transaction to ensure atomicity
        // Create new transaction
        await tx.transaction.create({ // Create a new transaction based on the recurring transaction
          data: {
            type: transaction.type, // Type of transaction (EXPENSE/INCOME)
            amount: transaction.amount, // Amount of the transaction
            description: `${transaction.description} (Recurring)`, // Description with "Recurring" suffix
            date: new Date(),
            category: transaction.category,
            userId: transaction.userId,
            accountId: transaction.accountId,
            isRecurring: false,
          },
        });

        // Update account balance
        const balanceChange =
          transaction.type === "EXPENSE" // If the transaction is an expense, subtract the amount from the balance else add it
            ? -transaction.amount.toNumber()
            : transaction.amount.toNumber();

        await tx.account.update({ // Update the account balance
          // Find the account by ID and update its balance
          where: { id: transaction.accountId },
          data: { balance: { increment: balanceChange } },
        });

        // Update last processed date and next recurring date
        await tx.transaction.update({ // update the transaction with the last processed date and next recurring date for the next cycle
          where: { id: transaction.id },
          data: {
            lastProcessed: new Date(),
            nextRecurringDate: calculateNextRecurringDate(
              new Date(),
              transaction.recurringInterval
            ),
          },
        });
      });
    });
  }
);

// Trigger recurring transactions with batching
export const triggerRecurringTransactions = inngest.createFunction(
  {
    id: "trigger-recurring-transactions", // Unique ID,
    name: "Trigger Recurring Transactions",
  },
  { cron: "0 0 * * *" }, // Daily at midnight
  async ({ step }) => {
    const recurringTransactions = await step.run( // Fetch all recurring transactions that are due, step.run is used to run a step in the ingest workflow
      "fetch-recurring-transactions",
      async () => {
        return await db.transaction.findMany({ // Fetch transactions that are recurring and due
          where: {
            isRecurring: true,
            status: "COMPLETED", // Only process completed transactions
            OR: [ // Check if last processed date is null or next recurring date is due
              { lastProcessed: null },
              {
                nextRecurringDate: {
                  lte: new Date(), // Check if next recurring date is less than or equal to current date
                },
              },
            ],
          },
        });
      }
    );

    // Send event for each recurring transaction in batches
    if (recurringTransactions.length > 0) { // If there are any recurring transactions to process
      const events = recurringTransactions.map((transaction) => ({ // Create an event for each transaction
        name: "transaction.recurring.process",
        data: { // Data to be sent with the event
          transactionId: transaction.id,
          userId: transaction.userId,
        },
      }));

      // Send events directly using inngest.send()
      await inngest.send(events); // Send the events to the Inngest service for processing i.e. this will trigger the processRecurringTransaction function
    }

    return { triggered: recurringTransactions.length }; // Return the number of transactions triggered
  }
);

// 2. Monthly Report Generation
async function generateFinancialInsights(stats, month) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Analyze this financial data and provide 3 concise, actionable insights.
    Focus on spending patterns and practical advice.
    Keep it friendly and conversational.

    Financial Data for ${month}:
    - Total Income: $${stats.totalIncome}
    - Total Expenses: $${stats.totalExpenses}
    - Net Income: $${stats.totalIncome - stats.totalExpenses}
    - Expense Categories: ${Object.entries(stats.byCategory)
      .map(([category, amount]) => `${category}: $${amount}`)
      .join(", ")}

    Format the response as a JSON array of strings, like this:
    ["insight 1", "insight 2", "insight 3"]
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Error generating insights:", error);
    return [
      "Your highest expense category this month might need attention.",
      "Consider setting up a budget for better financial management.",
      "Track your recurring expenses to identify potential savings.",
    ];
  }
}

export const generateMonthlyReports = inngest.createFunction(
  {
    id: "generate-monthly-reports",
    name: "Generate Monthly Reports",
  },
  { cron: "0 0 1 * *" }, // First day of each month
  async ({ step }) => {
    const users = await step.run("fetch-users", async () => { // Fetch all users with their accounts
      return await db.user.findMany({
        include: { accounts: true },
      });
    });

    for (const user of users) { // Iterate through each user to generate reports
      await step.run(`generate-report-${user.id}`, async () => { // Run a step for each user to generate their report
        const lastMonth = new Date(); // Get the last month date
        lastMonth.setMonth(lastMonth.getMonth() - 1); // Set it to the previous month as the report is for the last month

        const stats = await getMonthlyStats(user.id, lastMonth); // Fetch monthly stats for the user by calling getMonthlyStats function in object
        const monthName = lastMonth.toLocaleString("default", { // Get the month name
          month: "long",
        });

        // Generate AI insights
        const insights = await generateFinancialInsights(stats, monthName);

        await sendEmail({
          to: user.email,
          subject: `Your Monthly Financial Report - ${monthName}`,
          react: EmailTemplate({
            userName: user.name,
            type: "monthly-report",
            data: {
              stats,
              month: monthName,
              insights,
            },
          }),
        });
      });
    }

    return { processed: users.length };
  }
);

// 3. Budget Alerts with Event Batching
export const checkBudgetAlerts = inngest.createFunction(
  { name: "Check Budget Alerts" },
  { cron: "0 */6 * * *" }, // Every 6 hours
  async ({ step }) => {
    const budgets = await step.run("fetch-budgets", async () => {
      return await db.budget.findMany({ // Fetch all budgets with user and default account
        include: {
          user: {
            include: {
              accounts: {
                where: {
                  isDefault: true, // Only include default accounts
                },
              },
            },
          },
        },
      });
    });

    for (const budget of budgets) { // Iterate through each budget
      const defaultAccount = budget.user.accounts[0]; // Get the default account for the user
      if (!defaultAccount) continue; // Skip if no default account exists

      await step.run(`check-budget-${budget.id}`, async () => { // Check if budget alert should be sent
        const startDate = new Date();
        startDate.setDate(1); // Start of current month

        // Calculate total expenses for the default account only
        const expenses = await db.transaction.aggregate({
          where: {
            userId: budget.userId,
            accountId: defaultAccount.id, // Only consider default account
            type: "EXPENSE",
            date: {
              gte: startDate,
            },
          },
          _sum: {
            amount: true,
          },
        });

        const totalExpenses = expenses._sum.amount?.toNumber() || 0; // Total expenses for the month
        const budgetAmount = budget.amount; // Budget amount for the user
        const percentageUsed = (totalExpenses / budgetAmount) * 100; // Calculate percentage of budget used

        // Check if we should send an alert
        if ( // Check if percentage used exceeds threshold and if last alert was sent in a new month 
          percentageUsed >= 80 && // Default threshold of 80%
          (!budget.lastAlertSent || // Check if last alert sent is not in the current month
            isNewMonth(new Date(budget.lastAlertSent), new Date()))
        ) {
          await sendEmail({ // Send budget alert email
            to: budget.user.email, // Send email to user's email
            subject: `Budget Alert for ${defaultAccount.name}`, // Subject of the email
            react: EmailTemplate({ // React component for the email template
              userName: budget.user.name,
              type: "budget-alert",
              data: { // Data to be passed to the email template
                percentageUsed,
                budgetAmount: parseInt(budgetAmount).toFixed(1),
                totalExpenses: parseInt(totalExpenses).toFixed(1),
                accountName: defaultAccount.name,
              },
            }),
          });

          // Update last alert sent
          await db.budget.update({ // Update the budget record with the last alert sent date
            where: { id: budget.id }, // Find the budget by ID
            data: { lastAlertSent: new Date() }, // Set last alert sent to current date
          });
        }
      });
    }
  }
);

function isNewMonth(lastAlertDate, currentDate) {
  return (
    lastAlertDate.getMonth() !== currentDate.getMonth() ||
    lastAlertDate.getFullYear() !== currentDate.getFullYear()
  );
}

// Utility functions
function isTransactionDue(transaction) {
  // If no lastProcessed date, transaction is due
  if (!transaction.lastProcessed) return true;

  const today = new Date(); 
  const nextDue = new Date(transaction.nextRecurringDate); // Calculate next due date based on the transaction's nextRecurringDate

  // Compare with nextDue date
  return nextDue <= today; // If next due date is today or in the past, transaction is due return true
}

function calculateNextRecurringDate(date, interval) {
  const next = new Date(date);
  switch (interval) {
    case "DAILY":
      next.setDate(next.getDate() + 1);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
    case "YEARLY":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

async function getMonthlyStats(userId, month) { // Fetch monthly transaction stats for the user
  const startDate = new Date(month.getFullYear(), month.getMonth(), 1); // Start of the month
  const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0); // End of the month

  const transactions = await db.transaction.findMany({ // Fetch transactions for the user within the specified date range
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  return transactions.reduce( // Reduce transactions to calculate total expenses, income, and by category, reduce means to iterate through each transaction 
  // and accumulate the stats i.e. total expenses, total income, and expenses by category
    (stats, t) => { // For each transaction, update the stats
      const amount = t.amount.toNumber();
      if (t.type === "EXPENSE") { // If transaction is an expense, update total expenses and by category
        stats.totalExpenses += amount; // Increment total expenses
        stats.byCategory[t.category] = // Increment the category amount
          (stats.byCategory[t.category] || 0) + amount; // If category doesn't exist, initialize it to 0 and then add the amount
      } else { // If transaction is income, update total income
        stats.totalIncome += amount;
      }
      return stats; // Return the updated stats object
    },
    { // Initialize stats object with default values 
      totalExpenses: 0,
      totalIncome: 0,
      byCategory: {},
      transactionCount: transactions.length,
    }
  );
}
