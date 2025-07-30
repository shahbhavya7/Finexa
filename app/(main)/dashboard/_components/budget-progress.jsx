"use client";

import { useState, useEffect } from "react";
import { Pencil, Check, X } from "lucide-react";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateBudget } from "@/actions/budget";

export function BudgetProgress({ initialBudget, currentExpenses }) {
  const [isEditing, setIsEditing] = useState(false); // State to track if the budget is being edited , by default it is false
  const [newBudget, setNewBudget] = useState(
    // State to hold the new budget amount being edited, initially set to the current/previous budget amount
    initialBudget?.amount?.toString() || ""
  );

  const {
    // Custom hook to handle fetching and updating budget
    loading: isLoading, // Loading state to indicate if the update is in progress
    fn: updateBudgetFn,
    data: updatedBudget, // Data returned after updating the budget
    error,
  } = useFetch(updateBudget); // customizing the updateBudget function to handle budget updates with error handling and loading state

  const percentUsed = initialBudget // Calculate the percentage of the budget used
    ? (currentExpenses / initialBudget.amount) * 100 // If initial budget exists, calculate percentage of expenses used else default to 0
    : 0;

  const handleUpdateBudget = async () => {
    // Function to handle updating the budget
    const amount = parseFloat(newBudget); // Parse the new budget amount to a float

    if (isNaN(amount) || amount <= 0) {
      // Validate the amount, it should be a number and greater than 0
      toast.error("Please enter a valid amount");
      return;
    }

    await updateBudgetFn(amount); // Call the updateBudget function with the new amount
  };

  const handleCancel = () => {
    // Function to handle canceling the edit
    setNewBudget(initialBudget?.amount?.toString() || ""); // Reset the new budget to the initial budget amount
    setIsEditing(false); // Set editing state to false to exit edit mode
  };

  useEffect(() => {
    // track the updated budget and show success message
    if (updatedBudget?.success) {
      // If the budget update is successful, reset the editing state and show success message
      setIsEditing(false);
      toast.success("Budget updated successfully");
    }
  }, [updatedBudget]);

  useEffect(() => {
    // track any errors during budget update and show error message
    if (error) {
      toast.error(error.message || "Failed to update budget");
    }
  }, [error]);

  return (
    <Card className="bg-white shadow-sm rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex-1">
          <CardTitle className="text-sm font-medium text-cyan-700">
            Monthly Budget (Default Account)
          </CardTitle>

          <div className="flex items-center gap-2 mt-1">
            {isEditing ? ( // If in editing mode, show input field and buttons to save or cancel
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={newBudget} // Controlled input for new budget amount
                  onChange={(e) => setNewBudget(e.target.value)} // Update new budget state on change
                  className="w-32"
                  placeholder="Enter amount"
                  autoFocus
                  disabled={isLoading}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleUpdateBudget} // Call function to update budget if save button is clicked
                  disabled={isLoading} // Disable button if loading is in progress
                >
                  <Check className="h-4 w-4 text-green-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCancel} // Call function to cancel editing if cancel button is clicked
                  disabled={isLoading} // Disable button if loading is in progress
                >
                  <X className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ) : (
              // If not in editing mode, show budget details and edit button
              <>
                <CardDescription className="text-cyan-600">
                  {initialBudget // If initial budget exists, display the current budget and expenses else show a message indicating no budget is set
                    ? `₹${currentExpenses.toFixed(
                        // Format current expenses to 2 decimal places
                        2
                      )} of ₹${initialBudget.amount.toFixed(2)} spent`
                    : "No budget set"}
                </CardDescription>
                <Button // Button to enter edit mode
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(true)} // Set editing state to true to enter edit mode
                  className="h-6 w-6 text-cyan-600 hover:text-cyan-800"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {initialBudget && ( // If initial budget exists, display the progress bar showing percentage of budget used
          <div className="space-y-2">
            <Progress
              value={percentUsed}
              fillColor={
                percentUsed >= 90
                  ? "bg-red-500"
                  : percentUsed >= 75
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }
            />

            <p className="text-xs text-cyan-700 text-right">
              {percentUsed.toFixed(1)}% used{" "}
              {/* Display the percentage of budget used, formatted to 1 decimal place */}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
