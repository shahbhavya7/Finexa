import { getUserAccounts } from "@/actions/dashboard";
import { defaultCategories } from "@/data/categories";
import { AddTransactionForm } from "../_components/transaction-form";
import { getTransaction } from "@/actions/transaction";

export default async function AddTransactionPage({ searchParams }) { // searchParams is used to get the edit id if the user is editing an existing transaction
  // searchParams comes from the URL and allows us to fetch the transaction data if the user is editing an existing transaction
  const accounts = await getUserAccounts(); // Fetch user accounts
  const editId = searchParams?.edit;

  let initialData = null; // Initialize initialData to null, it will be used to prefill the form if the user is editing an existing transaction
  if (editId) { // If editId is present, fetch the transaction data to prefill the form
    const transaction = await getTransaction(editId);
    initialData = transaction;
  }

  return (
    <div className="max-w-3xl mx-auto px-5">
      <div className="flex justify-center md:justify-normal mb-8">
        <h1 className="text-6xl font-bold tracking-tight gradient-title bg-gradient-to-r from-cyan-700 via-cyan-600 to-cyan-500 
                 bg-clip-text text-transparent animate-gradient-slow leading-tight ">Add Transaction</h1>
      </div>
      <AddTransactionForm
        accounts={accounts}
        categories={defaultCategories}
        editMode={!!editId} // editMode is true if the user is editing an existing transaction ,true if editId is present
        initialData={initialData}
      />
    </div>
  );
}
