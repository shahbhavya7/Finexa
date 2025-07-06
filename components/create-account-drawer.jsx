"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createAccount } from "@/actions/dashboard";
import { accountSchema } from "@/app/lib/schema";

export function CreateAccountDrawer({ children }) {
  const [open, setOpen] = useState(false);
  const { // useForm hook takes our schema and default values, and provides methods like register, handleSubmit, formState, setValue, watch, and reset
    // to manage the form state and validation according our schema
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({ // connects our schema to the form and handles validation according to the schema instead its own validation
    resolver: zodResolver(accountSchema),
    defaultValues: { // sets the default values for the form fields 
      name: "",
      type: "CURRENT",
      balance: "",
      isDefault: false, // default value for isDefault switch
    },
  });

  const { // pasing the createAccount server action to useFetch hook to handle the API call
    loading: createAccountLoading, // this will be true when the API call is in progress
    fn: createAccountFn, // this updated function will have the loading state and error handling built-in and will be used in the onSubmit function
    error, // this will contain any error that occurs during the API call
    data: newAccount, // this will contain the newly created account data if the API call is successful
  } = useFetch(createAccount);

  const onSubmit = async (data) => {
    await createAccountFn(data);
  };

  useEffect(() => {
    if (newAccount) { // if newAccount is returned from the API call, it means the account was created successfully
      toast.success("Account created successfully");
      reset(); // reset the form to its default values
      setOpen(false); // close the drawer
    }
  }, [newAccount, reset]); // observe newAccount and reset to trigger the effect when they change

  useEffect(() => { // if there is an error during the API call, show an error toast notification
    if (error) {
      toast.error(error.message || "Failed to create account");
    }
  }, [error]); // observe error to trigger the effect when it changes

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="text-cyan-700 text-lg font-bold">
            Create New Account
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Account Name */}
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="text-sm font-medium text-cyan-700"
              >
                Account Name
              </label>
              <Input
                id="name"
                placeholder="e.g., Main Checking"
                className="focus:ring-cyan-600 focus:border-cyan-600"
                {...register("name")} // register connects the input field to the form's state and validation
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Account Type */}
            <div className="space-y-2">
              <label
                htmlFor="type"
                className="text-sm font-medium text-cyan-700"
              >
                Account Type
              </label>
              <Select
                onValueChange={(value) => setValue("type", value)} // setValue updates the form state when the select value changes
                defaultValue={watch("type")} // watch allows us to get the current value of the field
              >
                <SelectTrigger
                  id="type"
                  className="focus:ring-cyan-600 focus:border-cyan-600"
                >
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CURRENT">Current</SelectItem>
                  <SelectItem value="SAVINGS">Savings</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-red-500">{errors.type.message}</p>
              )}
            </div>

            {/* Initial Balance */}
            <div className="space-y-2">
              <label
                htmlFor="balance"
                className="text-sm font-medium text-cyan-700"
              >
                Initial Balance
              </label>
              <Input
                id="balance"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="focus:ring-cyan-600 focus:border-cyan-600"
                {...register("balance")}
              />
              {errors.balance && (
                <p className="text-sm text-red-500">{errors.balance.message}</p>
              )}
            </div>

            {/* Set as Default Switch */}
            <div className="flex items-center justify-between rounded-lg border border-cyan-100 p-3 bg-cyan-50">
              <div className="space-y-0.5">
                <label
                  htmlFor="isDefault"
                  className="text-base font-medium text-cyan-700"
                >
                  Set as Default
                </label>
                <p className="text-sm text-cyan-500">
                  This account will be selected by default for transactions
                </p>
              </div>
              <Switch
                id="isDefault"
                checked={watch("isDefault")} // checked state is controlled by the form state via watch provided by useForm
                onCheckedChange={(checked) => setValue("isDefault", checked)}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <DrawerClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-cyan-600 text-cyan-600 hover:bg-cyan-900/10"
                >
                  Cancel
                </Button>
              </DrawerClose>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-cyan-700 via-cyan-600 to-cyan-500 text-white hover:brightness-105"
                disabled={createAccountLoading} // disable the button if the API call is in progress
              >
                {createAccountLoading ? ( // if the API call is in progress, show a loading spinner and disable the button
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </div>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
