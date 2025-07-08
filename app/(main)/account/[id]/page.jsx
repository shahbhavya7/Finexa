import { Suspense } from "react";
import { getAccountWithTransactions } from "@/actions/account";
import { BarLoader } from "react-spinners";
import { TransactionTable } from "../_components/transaction-table";
import NotFound from '../../../not-found';
//import { AccountChart } from "../_components/account-chart";

export default async function AccountPage({ params }) {
  const accountData = await getAccountWithTransactions(params.id);

  if (!accountData) {
    return <NotFound />; // Return a NotFound component if account data is not found
  }

  const { transactions, ...account } = accountData;

  return (
<div className="space-y-8 px-5">
  <div className="flex gap-4 flex-col sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-700 via-cyan-500 to-cyan-400 bg-clip-text text-transparent capitalize">
        {account.name}
      </h1>
      <p className="text-cyan-600 text-sm sm:text-base mt-1">
        {account.type.charAt(0) + account.type.slice(1).toLowerCase()} Account
      </p>
    </div>

    <div className="text-right pb-2">
      <div className="text-xl sm:text-2xl font-bold text-cyan-900">
        ${parseFloat(account.balance).toFixed(2)}
      </div>
      <p className="text-sm text-cyan-500">
        {account._count.transactions} Transactions
      </p>
    </div>
  </div>



      {/* Chart Section */}
      {/* <Suspense
        fallback={<BarLoader className="mt-4" width={"100%"} color="#9333ea" />}
      >
        <AccountChart transactions={transactions} />
      </Suspense> */}

      {/* Transactions Table */}
      <Suspense
        fallback={<BarLoader className="mt-4" width={"100%"} color="#9333ea" />}
      >
        <TransactionTable transactions={transactions} />
      </Suspense>
    </div>
  );
}
