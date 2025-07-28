"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CreateAccountDrawer } from "@/components/create-account-drawer";
import { cn } from "@/lib/utils";
import { createTransaction, updateTransaction } from "@/actions/transaction";
import { transactionSchema } from "@/app/lib/schema";
import { ReceiptScanner } from "./recipt-scanner";

export function AddTransactionForm({
  accounts,
  categories,
  editMode = false, // editMode is true if the user is editing an existing transaction, many things will change based on this
  initialData = null,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit"); // Get the edit ID from search parameters if available

  const { // getting form methods from react-hook-form based on zod schema
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
    reset,
  } = useForm({
    resolver: zodResolver(transactionSchema), // connecting form validation with zod schema
    defaultValues:
      editMode && initialData // If in edit mode, set default values from initialData, otherwise set default values for a new transaction
        ? {
            type: initialData.type,
            amount: initialData.amount.toString(),
            description: initialData.description,
            accountId: initialData.accountId,
            category: initialData.category,
            date: new Date(initialData.date),
            isRecurring: initialData.isRecurring,
            ...(initialData.recurringInterval && {
              recurringInterval: initialData.recurringInterval,
            }),
          }
        : {
            type: "EXPENSE",
            amount: "",
            description: "",
            accountId: accounts.find((ac) => ac.isDefault)?.id,
            date: new Date(),
            isRecurring: false,
          },
  });

  const {
    loading: transactionLoading,
    fn: transactionFn,
    data: transactionResult,
  } = useFetch(editMode ? updateTransaction : createTransaction); // if editMode is true, use updateTransaction, otherwise use createTransaction in useFetch hook

  const onSubmit = (data) => { // Function to handle form submission
    const formData = { // Prepare form data for transaction creation or update
      ...data, // Spread the data from the form
      amount: parseFloat(data.amount), // Convert amount to a number
    };

    if (editMode) { // If in edit mode, pass the editId and formData to the transaction function
      transactionFn(editId, formData);
    } else { // If not in edit mode, just pass the formData to the transaction function
      transactionFn(formData);
    }
  };

  const handleScanComplete = (scannedData) => { // this handles the scanned data from the ReceiptScanner component
    if (scannedData) { // If scanned data is available, set the form values with the scanned data
      setValue("amount", scannedData.amount.toString()); // Set the amount from scanned data to string for input compatibility
      setValue("date", new Date(scannedData.date)); // Set the date from scanned data
      if (scannedData.description) { // If description is available in scanned data, set it
        setValue("description", scannedData.description);
      }
      if (scannedData.category) { // If category is available in scanned data, set it
        setValue("category", scannedData.category);
      }
      toast.success("Receipt scanned successfully");
    }
  };

  useEffect(() => { // Effect to handle the result of transaction creation or update
    if (transactionResult?.success && !transactionLoading) { // If transaction is successful and not loading, show success toast and reset form
      toast.success(
        editMode
          ? "Transaction updated successfully"
          : "Transaction created successfully"
      );
      reset();
      router.push(`/account/${transactionResult.data.accountId}`); // Redirect to the account page after successful transaction creation or update
    }
  }, [transactionResult, transactionLoading, editMode]); // watch for changes in transactionResult, transactionLoading, and editMode

  const type = watch("type"); // Watch the type which is either EXPENSE or INCOME
  const isRecurring = watch("isRecurring"); // Watch the isRecurring state to conditionally render recurring options
  const date = watch("date"); // Watch the date to display the selected date in the calendar

  const filteredCategories = categories.filter( // Filter categories based on the selected type, if type is EXPENSE, show only expense categories, if INCOME, show only income categories
    (category) => category.type === type
  );

  return (
    <div className="bg-cyan-50 rounded-xl p-6 shadow-md w-full">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Receipt Scanner - Only show in create mode */}
        {!editMode && <ReceiptScanner onScanComplete={handleScanComplete} />}

        {/* Type */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-cyan-700">Type</label>
          <Select
            onValueChange={(value) => setValue("type", value)}
            defaultValue={type}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EXPENSE">Expense</SelectItem>
              <SelectItem value="INCOME">Income</SelectItem>
            </SelectContent>
          </Select>
          {errors.type && (
            <p className="text-sm text-red-500">{errors.type.message}</p>
          )}
        </div>

        {/* Amount and Account */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-cyan-700">Amount</label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register("amount")}
            />
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-cyan-700">Account</label>
            <Select
              onValueChange={(value) => setValue("accountId", value)} // Set the accountId when an account is selected
              defaultValue={getValues("accountId")} // Set the default value to the current accountId
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => ( // Map through accounts and create a SelectItem for each account
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} (₹{parseFloat(account.balance).toFixed(2)}) {/* Display account name and balance */}
                  </SelectItem>
                ))}
                {/* Create Account option to open the CreateAccountDrawer */}
                <CreateAccountDrawer>
                  <Button
                    variant="ghost"
                    className="relative flex w-full cursor-default select-none items-center justify-start rounded-sm py-1.5 pl-8 pr-2 text-sm text-cyan-800 hover:bg-cyan-50 text-left"
                  >
                    Create Account
                  </Button>
                </CreateAccountDrawer>
              </SelectContent>
            </Select>
            {errors.accountId && ( // Show error message if accountId is invalid
              <p className="text-sm text-red-500">{errors.accountId.message}</p>
            )}
          </div>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-cyan-700">Category</label>
          <Select
            onValueChange={(value) => setValue("category", value)} // Set the category when a category is selected
            defaultValue={getValues("category")} // Set the default value to the current category
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {filteredCategories.map((category) => ( // Map through filtered categories and create a SelectItem for each category
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && ( // Show error message if category is invalid
            <p className="text-sm text-red-500">{errors.category.message}</p>
          )}
        </div>

        {/* Date */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-cyan-700">Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button // Trigger the calendar popover
                variant="outline"
                className={cn(
                  "w-full justify-between rounded-md border border-cyan-300 bg-white text-cyan-700 shadow-sm  focus:outline-none focus:ring-2 focus:ring-cyan-500",
                  !date && "text-cyan-400"
                )}
              >
                {/* If date is selected, format it, otherwise show a placeholder with and show pick a date */}
                {date ? format(date, "PPP") : <span>Pick a date</span>} 
                <CalendarIcon className="ml-2 h-4 w-4 text-cyan-500" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 border-cyan-200"
              align="start"
            >
              <Calendar
                mode="single"
                selected={date}
                onSelect={(date) => setValue("date", date)}
                disabled={(date) =>
                  date > new Date() || date < new Date("1900-01-01")
                }
                initialFocus
                className="rounded-md border border-cyan-200"
              />
            </PopoverContent>
          </Popover>
          {errors.date && (
            <p className="text-sm text-red-500">{errors.date.message}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-cyan-700">
            Description
          </label>
          <Input placeholder="Enter description" {...register("description")} /> {/* ...register connects the input to react-hook-form schema */}
          {/* Show error message if description is invalid */}
          {errors.description && (
            <p className="text-sm text-red-500">{errors.description.message}</p>
          )}
        </div>

        {/* Recurring Toggle */}
        {/* Recurring Toggle */}
        <div className="flex flex-row items-center justify-between rounded-xl border border-cyan-400 bg-gradient-to-r from-cyan-50 to-white p-4 shadow-md">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-cyan-700">
              Recurring Transaction
            </p>
            <p className="text-sm text-cyan-600">
              Set up a recurring schedule for this transaction
            </p>
          </div>
          <Switch
            checked={isRecurring} // Check if the transaction is recurring
            onCheckedChange={(checked) => setValue("isRecurring", checked)} // Set the isRecurring state based on the switch toggle
          />
        </div>

        {/* Recurring Interval */}
        {isRecurring && ( // If the transaction is recurring, show the recurring interval selection
          <div className="flex flex-row items-center justify-between rounded-xl border border-cyan-400 bg-gradient-to-r from-cyan-50 to-white p-4 shadow-md">
            <label className="text-sm font-medium text-cyan-700">
              Recurring Interval
            </label>
            <Select
              onValueChange={(value) => setValue("recurringInterval", value)}
              defaultValue={getValues("recurringInterval")}
            >
              <SelectTrigger className="border border-cyan-300 text-cyan-700">
                <SelectValue placeholder="Select interval" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DAILY">Daily</SelectItem>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
                <SelectItem value="YEARLY">Yearly</SelectItem>
              </SelectContent>
            </Select>
            {errors.recurringInterval && (
              <p className="text-sm text-red-500">
                {errors.recurringInterval.message}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col md:flex-row gap-4 pt-2">
          <Button // Cancel button to go back to the previous page
            type="button"
            variant="outline"
            className="w-full md:w-auto border-cyan-600 text-cyan-600 hover:bg-cyan-900/10 transition"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="w-full md:w-auto bg-gradient-to-r from-cyan-700 via-cyan-600 to-cyan-500 text-white hover:brightness-105 shadow-sm transition"
            disabled={transactionLoading} // Disable button while transaction is loading to prevent multiple submissions
          >
            {transactionLoading ? ( // Show loading spinner and text while transaction is being processed
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {editMode ? "Updating..." : "Creating..."}
              </>
            ) : editMode ? ( // If in edit mode, show "Update Transaction", otherwise show "Create Transaction"
              "Update Transaction"
            ) : (
              "Create Transaction"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
