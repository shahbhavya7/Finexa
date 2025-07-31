"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DATE_RANGES = { // Define date ranges for filtering transactions 
  "7D": { label: "Last 7 Days", days: 7 },
  "1M": { label: "Last Month", days: 30 },
  "3M": { label: "Last 3 Months", days: 90 },
  "6M": { label: "Last 6 Months", days: 180 },
  ALL: { label: "All Time", days: null },
};

export function AccountChart({ transactions }) { // AccountChart component to display transaction data in a bar chart
  const [dateRange, setDateRange] = useState("1M"); // Default to last month

  const filteredData = useMemo(() => { // Memoize to avoid recalculating on every render
    const range = DATE_RANGES[dateRange]; // Get the selected date range i.e for example "1M" will give { label: "Last Month", days: 30 }
    const now = new Date(); // Current date
    const startDate = range.days // range.days is the number of days to look back , in startDate we calculate the start date based on the selected range
    // if range.days is present, we calculate the start date as current date minus the number of days in range else we set it to the oldest date possible
      ? startOfDay(subDays(now, range.days))
      : startOfDay(new Date(0));

    // Filter transactions within date range
    const filtered = transactions.filter( // Filter transactions based on the selected date range
      (t) => new Date(t.date) >= startDate && new Date(t.date) <= endOfDay(now) // if transaction date is greater than or equal to startDate and less than 
      // or equal to current date then include it in the filtered array else exclude it
    );

    // Group transactions by date
    const grouped = filtered.reduce((acc, transaction) => {  // Reduce transactions to group by date
      const date = format(new Date(transaction.date), "MMM dd"); // Format date to "MMM dd" format for grouping
      if (!acc[date]) { // if key for the date does not exist in accumulator, create it as an object with initial income and expense as 0
        acc[date] = { date, income: 0, expense: 0 };
      }
      if (transaction.type === "INCOME") { // If transaction type is INCOME, add to income else add to expense
        acc[date].income += transaction.amount;
      } else {
        acc[date].expense += transaction.amount;
      }
      return acc; // Return the accumulator for the next iteration
    }, {});

    // Convert to array and sort by date
    return Object.values(grouped).sort( // Convert grouped object i.e accumulator to an array and sort it by date
      (a, b) => new Date(a.date) - new Date(b.date)
    );
  }, [transactions, dateRange]); // only recalculate when transactions or dateRange changes else use cached value calculated in previous render

  // Calculate totals for the selected period
  const totals = useMemo(() => { // Calculate total income and expense for the filtered data
    return filteredData.reduce(  // Reduce filtered data to calculate total income and expense
      (acc, day) => ({ // For each day/date, add income and expense to the accumulator
        income: acc.income + day.income,
        expense: acc.expense + day.expense,
      }),
      { income: 0, expense: 0 } // Initial accumulator with income and expense set to 0 as initial values
    );
  }, [filteredData]); // Recalculate totals whenever filteredData changes

  return (
    <Card className="rounded-md border border-cyan-100 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
        <CardTitle className="text-base font-normal text-cyan-700">
          Transaction Overview
        </CardTitle>
        <Select defaultValue={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(DATE_RANGES).map(([key, { label }]) => ( // Map through date ranges and create SelectItems dynamically for each
            // key is the range identifier i.e. "7D", "1M", etc.
            // label is the display name for the range
            // object.entries returns an array of key-value pairs from the DATE_RANGES object
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="flex justify-around mb-6 text-sm">
          <div className="text-center">
            <p className="text-cyan-700">Total Income</p>
            <p className="text-lg font-bold text-green-500">
              ₹{totals.income.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-cyan-700">Total Expenses</p>
            <p className="text-lg font-bold text-red-500">
              ₹{totals.expense.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-cyan-700">Net</p>
            <p
              className={`text-lg font-bold ${ // if net income is positive, show green else show red
                totals.income - totals.expense >= 0
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              ₹{(totals.income - totals.expense).toFixed(2)}
            </p>
          </div>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={filteredData} // Use the filtered data based on the selected date range
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `₹${value}`} // Format Y-axis labels as currency
              />
              <Tooltip // Custom tooltip to format values on hover
                formatter={(value) => [`₹${value}`, undefined]} // Format tooltip values as value from the data
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Legend />
              <Bar
                dataKey="income"
                name="Income"
                fill="#22c55e"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="expense"
                name="Expense"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
