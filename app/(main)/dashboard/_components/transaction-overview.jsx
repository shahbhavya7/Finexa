"use client";

import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { format } from "date-fns";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEEAD",
  "#D4A5A5",
  "#9FA8DA",
];

export function DashboardOverview({ accounts, transactions }) {
  const [selectedAccountId, setSelectedAccountId] = useState( // State to hold the selected account ID, initially set to the default account or first account
    accounts.find((a) => a.isDefault)?.id || accounts[0]?.id // find the default account or use the first account if no default is set
  );

  // Filter transactions for selected account
  const accountTransactions = transactions.filter( // Filter transactions based on the selected account ID
    (t) => t.accountId === selectedAccountId // Get transactions for the selected account
  );

  // Get recent transactions (last 5)
  const recentTransactions = accountTransactions
    .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort transactions by date in descending order
    .slice(0, 5);

  // Calculate expense breakdown for current month
  const currentDate = new Date(); // Get current date to filter transactions for the current month
  const currentMonthExpenses = accountTransactions.filter((t) => { // Filter transactions to get only expenses for the current month for pie chart
    const transactionDate = new Date(t.date); // Convert transaction date string to Date object
    return ( // return true if the transaction is an expense and falls within the current month
      t.type === "EXPENSE" && // Only consider expenses
      transactionDate.getMonth() === currentDate.getMonth() && // Check if the month of the transaction matches the current month
      transactionDate.getFullYear() === currentDate.getFullYear() // Check if the year of the transaction matches the current year
    );
  });

  // Group expenses by category, we got all expenses for the current month in currentMonthExpenses now we need to group them by category
  // from currentMonthExpenses object we will create an object where keys are categories and values are total amounts for that category
  // this object is stored in expensesByCategory in accumulator pattern
  // accumulator is an object that will hold the total amounts for each category
  const expensesByCategory = currentMonthExpenses.reduce((acc, transaction) => { // Reduce the filtered expenses to group them by category
    const category = transaction.category; // Get the category of the transaction
    if (!acc[category]) { // If the category doesn't exist in the accumulator, initialize it
      acc[category] = 0; 
    }
    acc[category] += transaction.amount; // Add the transaction amount to the corresponding category
    return acc; // Return the accumulator for the next iteration, acc is an object where keys are categories and values are total amounts
  }, {});

  // Format data for pie chart, upper expensesByCategory is an object where keys are categories and values are total amounts
  // we need to convert this object into an array of objects where each object has a name and value property
  // this is done to match the data structure expected by the recharts Pie
  const pieChartData = Object.entries(expensesByCategory).map( // Convert the expensesByCategory object into an array of objects for the pie chart
    // redefine the structure of each object in the array
    ([category, amount]) => ({ // Each object will have a name and value property corresponding to the category and total amount
      name: category, // Category name
      value: amount, // Total amount for that category
    })
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Recent Transactions Card */}
      <Card className="border border-cyan-200 hover:shadow-cyan-300/40 hover:shadow-md transition-shadow cursor-pointer group relative">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-base font-semibold text-cyan-800">
            Recent Transactions
          </CardTitle>
          <Select
            value={selectedAccountId}
            onValueChange={setSelectedAccountId}
          >
            <SelectTrigger className="w-[150px] h-8 rounded-lg border-none text-sm bg-white/90 dark:bg-gray-800/80 shadow-sm focus:ring-2 focus:ring-cyan-400">
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-900 border border-cyan-100 dark:border-cyan-800 rounded-lg shadow-lg">
              {accounts.map((account) => (
                <SelectItem
                  key={account.id}
                  value={account.id}
                  className="hover:bg-cyan-50 dark:hover:bg-cyan-900/40"
                >
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>

        <CardContent className="px-4 py-5">
          <div className="space-y-4">
            {recentTransactions.length === 0 ? (
              <p className="text-center text-cyan-500 py-4">
                No recent transactions
              </p>
            ) : ( // If there are recent transactions, map through them to display
              recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3 last:border-none"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-cyan-900  leading-none">
                      {transaction.description || "Untitled Transaction"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(transaction.date), "PP")}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "flex items-center px-3 py-1 rounded-md text-sm font-semibold",
                      transaction.type === "EXPENSE"
                        ? "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                    )}
                  >
                    {transaction.type === "EXPENSE" ? (
                      <ArrowDownRight className="mr-1 h-4 w-4" />
                    ) : (
                      <ArrowUpRight className="mr-1 h-4 w-4" />
                    )}
                    ₹{transaction.amount.toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Expense Breakdown Card */}
      <Card className="border border-cyan-200 hover:shadow-cyan-300/40 hover:shadow-md transition-shadow cursor-pointer group relative">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-cyan-800">
            Monthly Expense Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-5">
          {pieChartData.length === 0 ? ( // If no expenses, show message
            <p className="text-center text-cyan-500 py-8">
              No expenses this month
            </p>
          ) : ( // If there are expenses, render the pie chart
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie // pie is a component from recharts that renders a pie chart
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ₹${value.toFixed(2)}`}
                  >
                    {pieChartData.map((entry, index) => ( // Map through pie chart data array which is array of obj to create cells, each cell represents a 
                    // category index is used to assign a color from the COLORS array to each category, entry is the data for that category 
                    // index is used to cycle through the COLORS array
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `₹${value.toFixed(2)}`}
                    contentStyle={{
                      backgroundColor: "#23D5D5", // Teal-600 from Tailwind
                      border: "none",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      color: "white",
                      fontWeight: "500",
                      boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)",
                    }}
                  />

                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
