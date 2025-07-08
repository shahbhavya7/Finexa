import { Suspense } from "react";
import { getUserAccounts } from "@/actions/dashboard";
//import { getDashboardData } from "@/actions/dashboard";
//import { getCurrentBudget } from "@/actions/budget";
import { AccountCard } from "./_components/account-card";
import { CreateAccountDrawer } from "@/components/create-account-drawer";
//import { BudgetProgress } from "./_components/budget-progress";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
//import { DashboardOverview } from "./_components/transaction-overview";

export default async function DashboardPage() {
  const accounts = await getUserAccounts(); // Fetch user accounts using the server action, here hooks not used as this is a server component, hooks are only
  // used in client components , in server side we dont use as we can directly call the server action and get the data
  // const [accounts, transactions] = await Promise.all([
  //   getUserAccounts(),
  //   getDashboardData(),
  // ]);

  //const defaultAccount = accounts?.find((account) => account.isDefault);

  // Get budget for default account
  // let budgetData = null;
  // if (defaultAccount) {
  //   budgetData = await getCurrentBudget(defaultAccount.id);
  // }

  return (
    <div className="space-y-8">
      {/* Budget Progress */}
      {/* <BudgetProgress
        initialBudget={budgetData?.budget}
        currentExpenses={budgetData?.currentExpenses || 0}
      /> */}

      {/* Dashboard Overview */}
      {/* <DashboardOverview
        accounts={accounts}
        transactions={transactions || []}
      /> */}

      {/* Accounts Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CreateAccountDrawer>
          <Card className="border border-cyan-200 hover:shadow-cyan-300/40 hover:shadow-md transition-shadow cursor-pointer bg-white">
            <CardContent className="flex flex-col items-center justify-center h-full pt-5 text-cyan-600">
              <Plus className="h-10 w-10 mb-2" />
              <p className="text-sm font-medium">Add New Account</p>
            </CardContent>
          </Card>
        </CreateAccountDrawer>

        {accounts.length > 0 && // If there are accounts, map through them and display each account card
          accounts?.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
      </div>
    </div>
  );
}
