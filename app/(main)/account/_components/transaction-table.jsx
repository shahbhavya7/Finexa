"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Trash,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { categoryColors } from "@/data/categories";
import { bulkDeleteTransactions } from "@/actions/account";
import useFetch from "@/hooks/use-fetch";
import { BarLoader } from "react-spinners";
import { useRouter } from "next/navigation";

const ITEMS_PER_PAGE = 10;

const RECURRING_INTERVALS = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

export function TransactionTable({ transactions }) {
  const [selectedIds, setSelectedIds] = useState([]); // Track selected transaction IDs i.e for bulk actions
  const [sortConfig, setSortConfig] = useState({
    field: "date",
    direction: "desc",
  }); // Default sort by date descending , this can be changed by clicking on the table headers
  const [searchTerm, setSearchTerm] = useState(""); // Search term for filtering transactions
  const [typeFilter, setTypeFilter] = useState(""); // Filter for transaction type (INCOME/EXPENSE)
  const [recurringFilter, setRecurringFilter] = useState(""); // Filter for recurring transactions (recurring/non-recurring)
  const [currentPage, setCurrentPage] = useState(1); // Current page for pagination i.e to show 10 transactions per page, initially set to first page
  const router = useRouter(); // Navigation router for actions like edit or delete

  //- Memoized filtered and sorted transactions
  const filteredAndSortedTransactions = useMemo(() => {
    // useMemo is a React hook that remembers (memoizes) the result of a calculation so that it's not recalculated unnecessarily.
    // Only re-do this filtering + sorting if something important has changed (like the filters or the transaction list).
    let result = [...transactions]; // Make a copy of the original transactions list.

    // Apply search filter
    if (searchTerm) {
      // If a search term is typed (like "food"), keep only those transactions whose description includes that term (case-insensitive).
      const searchLower = searchTerm.toLowerCase();
      result = result.filter((transaction) =>
        transaction.description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply type filter
    if (typeFilter) {
      // If you chose to show only "income" or "expense", this keeps only those transactions.
      result = result.filter((transaction) => transaction.type === typeFilter);
    }

    // Apply recurring filter
    if (recurringFilter) {
      // If you want to see only recurring transactions (like rent, salary) or only non-recurring, this keeps only those.
      result = result.filter((transaction) => {
        if (recurringFilter === "recurring") return transaction.isRecurring;
        return !transaction.isRecurring;
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      // this sorts the final list based on: date → newest or oldest first , amount → smallest to biggest (or reverse), category → alphabetically
      // (like "Bills" before "Food") It also uses sortConfig.direction to decide whether to sort in ascending or descending order.
      let comparison = 0; // Start with no comparison

      switch (sortConfig.field) {
        case "date":
          comparison = new Date(a.date) - new Date(b.date); // new Date converts the date string to a date object for comparison
          break;
        case "amount":
          comparison = a.amount - b.amount; // Compares amounts directly, so it sorts from smallest to largest
          break;
        case "category":
          comparison = a.category.localeCompare(b.category); // Compares categories alphabetically, so "Bills" comes before "Food"
          break;
        default:
          comparison = 0;
      }

      return sortConfig.direction === "asc" ? comparison : -comparison; // If direction is "asc", return the comparison as is; if "desc", reverse it
    });

    return result;
  }, [transactions, searchTerm, typeFilter, recurringFilter, sortConfig]); // useMemo will re-run this filtering and sorting logic only when any of these dependencies change.
  // React re-renders a lot. useMemo ensures this filtering + sorting logic is only run when needed — that is, only when one of these changes
  // We store the result in a variable (filteredAndSortedTransactions) because we want to use that filtered and sorted list later in our component

  //- Pagination calculations
  const totalPages = Math.ceil(
    // filteredAndSortedTransactions.length: Total number of items after filtering and sorting,
    // ITEMS_PER_PAGE: How many items you want to show per page (e.g., 10), Math.ceil(...): Makes sure we round up, so even if there's a partial page, it still counts.
    // If there are 22 transactions and you show 10 per page: Math.ceil(22 / 10) = 3 pages
    filteredAndSortedTransactions.length / ITEMS_PER_PAGE
  );
  const paginatedTransactions = useMemo(() => {
    //- This useMemo slices the big list of filtered transactions to show just the ones for the current page.
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE; // currentPage is the page number the user is on. then figure out where to start cutting the list.
    return filteredAndSortedTransactions.slice(
      // .slice(startIndex, startIndex + ITEMS_PER_PAGE): get only the portion that should be shown on this page
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );
  }, [filteredAndSortedTransactions, currentPage]); // useMemo will re-run this slicing logic only when filteredAndSortedTransactions or currentPage changes.

  const handleSort = (field) => {
    //- This function handles sorting when a table header is clicked.
    setSortConfig((current) => ({
      // setSortConfig updates the sorting configuration from the current state which means it will toggle the sorting direction
      field, // field is the column we want to sort by (like "date", "amount", or "category")
      // current.direction is the current sorting direction (either "asc" or "desc")
      direction:
        current.field === field && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleSelect = (id) => {
    //- This function handles selecting or deselecting a transaction when the checkbox is clicked.
    setSelectedIds(
      (
        current // current is the current list of selected transaction IDs
      ) =>
        current.includes(id) // If the ID is already selected, remove it from the list else add it
          ? current.filter((item) => item !== id) // filter out the ID from the current list
          : [...current, id] // otherwise, add the ID to the list
    );
  };

  const handleSelectAll = () => {
    //- This function toggles selecting all transactions on the current page.
    setSelectedIds(
      (
        current //
      ) =>
        current.length === paginatedTransactions.length // If all transactions on the current page are already selected, deselect them all
          ? []
          : paginatedTransactions.map((t) => t.id) // Otherwise, select all transactions on the current page by mapping through them and getting their IDs
    );
  };

  const {
    loading: deleteLoading,
    fn: deleteFn,
    data: deleted,
  } = useFetch(bulkDeleteTransactions);

  const handleBulkDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedIds.length} transactions?`
      )
    )
      return;

    deleteFn(selectedIds);
  };

  useEffect(() => {
    if (deleted && !deleteLoading) {
      toast.error("Transactions deleted successfully");
    }
  }, [deleted, deleteLoading]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setTypeFilter("");
    setRecurringFilter("");
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    setSelectedIds([]); // Clear selections on page change
  };

  return (
    <div className="space-y-6 px-5">
      {/* Loading Bar which shows when transactions are being deleted */}
      {deleteLoading && ( // If deleteLoading is true, it means transactions are being deleted, so show a loading bar
        <BarLoader className="mt-4" width={"100%"} color="#06b6d4" />
      )}

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-cyan-500" />
          <Input
            placeholder="Search transactions..."
            value={searchTerm} // This is the search input where users can type to filter transactions, value will be controlled by searchTerm state
            onChange={(e) => {
              // onChange updates the searchTerm state when the user types
              setSearchTerm(e.target.value); // e.target.value is the current value of the input field
              setCurrentPage(1); // Reset to first page when search term changes
            }}
            className="pl-8 border-cyan-500 focus-visible:ring-cyan-500"
          />
        </div>

        <div className="flex gap-2">
          <Select //- This is a dropdown for filtering by transaction type (INCOME/EXPENSE)
            value={typeFilter} // value is controlled by typeFilter state , it consists of two options: "INCOME" and "EXPENSE"
            onValueChange={(value) => {
              // onValueChange updates the typeFilter state when the user selects a type
              setTypeFilter(value); // value is the selected type (either "INCOME" or "EXPENSE")
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[130px] border-cyan-500">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INCOME">Income</SelectItem>
              <SelectItem value="EXPENSE">Expense</SelectItem>
            </SelectContent>
          </Select>

          <Select //- This is a dropdown for filtering by recurring transactions
            value={recurringFilter} // value is controlled by recurringFilter state , it consists of two options: "recurring" and "non-recurring"
            onValueChange={(value) => {
              setRecurringFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[130px] border-cyan-500">
              <SelectValue placeholder="All Transactions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recurring">Recurring Only</SelectItem>
              <SelectItem value="non-recurring">Non-recurring Only</SelectItem>
            </SelectContent>
          </Select>

          {selectedIds.length > 0 && ( // If there are selected transactions, show the bulk delete button
            // This button will delete all selected transactions when clicked
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete} // Calls handleBulkDelete function which will delete the selected transactions
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete Selected ({selectedIds.length})
            </Button>
          )}

          {(searchTerm || typeFilter || recurringFilter) && ( // If any filter is applied, show the clear filters button
            <Button
              variant="outline"
              size="icon"
              onClick={handleClearFilters} // Calls handleClearFilters function which will reset all filters and search term
              title="Clear filters"
              className="border-cyan-500 text-cyan-600 hover:bg-cyan-50"
            >
              <X className="h-4 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Table Styling */}
      <div className="rounded-md border border-cyan-100 shadow-sm">
        <Table>
          <TableHeader className="bg-cyan-50 text-cyan-700">
            {/* Same logic, no changes */}
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={ // This checkbox will select or deselect all transactions on the current page
                    selectedIds.length === paginatedTransactions.length &&
                    paginatedTransactions.length > 0
                  }
                  onCheckedChange={handleSelectAll} // Calls handleSelectAll function which will select or deselect all transactions on the current page
                />
              </TableHead>
              <TableHead
                className="cursor-pointer" // This makes the header clickable to sort by date
                onClick={() => handleSort("date")} // Calls handleSort function which will sort the transactions by date
              >
                <div className="flex items-center">
                  Date
                  {sortConfig.field === "date" &&
                    (sortConfig.direction === "asc" ? ( // If the current sort field is date and the direction is ascending, show an up arrow icon, else show a down arrow icon
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("category")} // Calls handleSort function which will sort the transactions by category
              >
                <div className="flex items-center">
                  Category
                  {sortConfig.field === "category" &&
                    (sortConfig.direction === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer text-right"
                onClick={() => handleSort("amount")} // Calls handleSort function which will sort the transactions by amount
              >
                <div className="flex items-center justify-end">
                  Amount
                  {sortConfig.field === "amount" &&
                    (sortConfig.direction === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead>Recurring</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedTransactions.length === 0 ? ( // If no transactions, show message else map through transactions
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-cyan-400 italic py-6"
                >
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              paginatedTransactions.map(
                (
                  transaction // paginatedTransactions is the list of transactions for the current page where we map through each transaction
                ) => (
                  <TableRow key={transaction.id}>
                    {" "}
                    {/* Each transaction has a unique ID */}
                    {/* Existing logic, but refined colors */}
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(transaction.id)} // If the transaction ID is in selectedIds state, this checkbox will be checked
                        onCheckedChange={() => handleSelect(transaction.id)} // When the checkbox is clicked, it calls handleSelect with the transaction ID
                        className="accent-cyan-600"
                      />
                    </TableCell>
                    <TableCell>
                      {format(new Date(transaction.date), "PP")}{" "}
                      {/* PP formats the date nicely, like "Jan 1, 2023" */}
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell className="capitalize">
                      {" "}
                      {/* capitalize makes the first letter of each word uppercase */}
                      <span
                        style={{
                          background: categoryColors[transaction.category], // categoryColors is an object that maps categories to colors, derived from the transaction.category
                        }}
                        className="px-2 py-1 rounded text-white text-sm"
                      >
                        {transaction.category}
                      </span>
                    </TableCell>
                    <TableCell
                      className={cn(
                        // This cn function combines multiple class names into one string, useful for conditional styling, if the transaction type is "EXPENSE",
                        // it will have a red color, else green
                        "text-right font-semibold",
                        transaction.type === "EXPENSE"
                          ? "text-red-500"
                          : "text-green-500"
                      )}
                    >
                      {transaction.type === "EXPENSE" ? "-" : "+"}₹
                      {transaction.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {transaction.isRecurring ? ( // If the transaction is recurring, show the recurring badge with the interval and next date
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge className="gap-1 bg-cyan-100 text-cyan-700 hover:bg-cyan-200">
                                <RefreshCw className="h-3 w-3" />
                                {
                                  RECURRING_INTERVALS[ // this shows the recurring interval like "Daily", "Weekly", etc.
                                    transaction.recurringInterval
                                  ]
                                }
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-sm text-cyan-700">
                                <div className="font-medium">Next Date:</div>
                                <div>
                                  {format(
                                    new Date(transaction.nextRecurringDate),
                                    "PPP"
                                  )}
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        // If the transaction is not recurring, show a badge indicating it's a one-time transaction
                        // This badge has a clock icon and says "One-time"
                        <Badge
                          variant="outline"
                          className="gap-1 text-cyan-600 border-cyan-200"
                        >
                          <Clock className="h-3 w-3" />
                          One-time
                        </Badge>
                      )}
                    </TableCell>
                    {/* Now we add the actions column with edit and delete options */}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4 text-cyan-700" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(
                                // This navigates to the edit page for the transaction
                                `/transaction/create?edit=${transaction.id}`
                              )
                            }
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => deleteFn([transaction.id])} // This calls the delete function with the transaction ID
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              )
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && ( // If there are multiple pages, show pagination controls
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage - 1)} // onClick decrements the current page by 1 and updates the state
            disabled={currentPage === 1} // Disable if on the first page
            className="border-cyan-500 text-cyan-600"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-cyan-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage + 1)} // onClick increments the current page by 1 and updates the state
            disabled={currentPage === totalPages} // Disable if on the last page
            className="border-cyan-500 text-cyan-600"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
