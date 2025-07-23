import { z } from "zod"; // maiking our own schema using zod library

export const accountSchema = z.object({ // defining the schema for account creation
  // z.object creates an object schema with the specified fields and their validation rules
  // Each field is defined with its type and validation rules
  // z.string() creates a string schema, and .min(1, "Message")
  // adds a validation rule that the string must have a minimum length of 1 character
  // The second argument is the error message to show if the validation fails
  // z.enum creates an enum schema with the specified values
  // z.boolean() creates a boolean schema, and .default(false) sets the default value
  // for the field to false if not provided
  name: z.string().min(1, "Name is required"),
  type: z.enum(["CURRENT", "SAVINGS"]),
  balance: z.string().min(1, "Initial balance is required"),
  isDefault: z.boolean().default(false),
});

export const transactionSchema = z
  .object({
    type: z.enum(["INCOME", "EXPENSE"]), // Transaction type can be either INCOME or EXPENSE
    amount: z.string().min(1, "Amount is required"), // Amount must be a non-empty string
    description: z.string().optional(), // Description is optional
    date: z.date({ required_error: "Date is required" }), // Date is required and must be a valid date object
    accountId: z.string().min(1, "Account is required"), // Account ID must be a non-empty string
    category: z.string().min(1, "Category is required"), // Category must be a non-empty string
    isRecurring: z.boolean().default(false),
    recurringInterval: z 
      .enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]) // Recurring interval can be DAILY, WEEKLY, MONTHLY, or YEARLY
      .optional(),
  })
  .superRefine((data, ctx) => { // Custom validation to ensure that if the transaction is recurring, a recurring interval must be provided
    if (data.isRecurring && !data.recurringInterval) {
      ctx.addIssue({ // If the transaction is recurring but no interval is provided, add a custom validation error
        code: z.ZodIssueCode.custom,
        message: "Recurring interval is required for recurring transactions",
        path: ["recurringInterval"],
      });
    }
  });
