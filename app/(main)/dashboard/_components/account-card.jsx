"use client";

import { ArrowUpRight, ArrowDownRight, CreditCard } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";
import useFetch from "@/hooks/use-fetch";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { updateDefaultAccount } from "@/actions/account";
import { toast } from "sonner";

export function AccountCard({ account }) {
  const { name, type, balance, id, isDefault } = account; // Destructure the account object to get the necessary fields

  const {
    loading: updateDefaultLoading, // loading state while updating the default account status
    fn: updateDefaultFn, // updated function with loading state,data and error handling for updating the default account status with param same as updateDefaultAccount function
    data: updatedAccount, // data returned after updating the default account status
    error,
  } = useFetch(updateDefaultAccount); 


  const handleDefaultChange = async (event) => { // if the user clicks on the switch to change the default account status,
    event.preventDefault(); // Prevent refreshing the page on switch click

    if (isDefault) { // if the account is already default, we need not allow toggling it off as there should always be at least one default account 
      toast.warning("You need atleast 1 default account");
      return; // Don't allow toggling off the default account
    }

    await updateDefaultFn(id); // Call the updateDefaultFn with the account ID to update the default status of the account
  };

  useEffect(() => {
    if (updatedAccount?.success) { // If the updatedAccount data is successfully returned after updating the default account status 
      // then show a success toast message
      toast.success("Default account updated successfully");
    }
  }, [updatedAccount]);

  useEffect(() => { // If there is an error while updating the default account status, show an error toast message
    if (error) {
      toast.error(error.message || "Failed to update default account");
    }
  }, [error]);

  return (
<Card className="border border-cyan-200 hover:shadow-cyan-300/40 hover:shadow-md transition-shadow cursor-pointer group relative">
  <Link href={`/account/${id}`}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-semibold text-cyan-800 capitalize group-hover:text-cyan-700 transition-colors">
        {name}
      </CardTitle>
      <Switch // Switch component to toggle default account status 
        checked={isDefault}
        onClick={handleDefaultChange}
        disabled={updateDefaultLoading}
      />
    </CardHeader>

    <CardContent>
      <div className="text-2xl font-bold text-cyan-900">
        ${parseFloat(balance).toFixed(2)}
      </div>
      <p className="text-sm text-cyan-500">
        {type.charAt(0) + type.slice(1).toLowerCase()} Account
      </p>
    </CardContent>

    <CardFooter className="flex justify-between text-sm text-cyan-600">
      <div className="flex items-center">
        <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
        Income
      </div>
      <div className="flex items-center">
        <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
        Expense
      </div>
    </CardFooter>
  </Link>
</Card>

  );
}
