import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TransactionItem } from "@/components/TransactionItem";
import { TransactionFilter } from "@/components/TransactionFilter";
import { TransactionDetailsDialog } from "@/components/TransactionDetailsDialog";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";

interface Transaction {
  id: string;
  from_account_id: string;
  to_account_name: string;
  to_account_number: string;
  amount: number;
  status: string;
  created_at: string;
  description: string | null;
  completed_at: string | null;
}

type FilterStatus = "all" | "completed" | "failed";

const ITEMS_PER_PAGE = 10;

const Transactions = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactionDetailsOpen, setTransactionDetailsOpen] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (!session) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (session) {
      loadTransactions();
    }
  }, [session, activeFilter, currentPage]);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      // Build query
      let query = supabase
        .from("transactions")
        .select("*", { count: "exact" });

      // Apply filter
      if (activeFilter !== "all") {
        query = query.eq("status", activeFilter);
      }

      // Get total count first
      const { count } = await query;
      setTotalCount(count || 0);

      // Then get paginated data
      let dataQuery = supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

      if (activeFilter !== "all") {
        dataQuery = dataQuery.eq("status", activeFilter);
      }

      const { data, error } = await dataQuery;

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      console.error("Error loading transactions:", error);
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handleFilterChange = (filter: FilterStatus) => {
    setActiveFilter(filter);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card shadow-custom-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="hover:bg-secondary"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Transaction History</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-6 gradient-card shadow-custom-md border-border/50">
          {/* Filter and Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-1">
                All Transactions
              </h2>
              <p className="text-sm text-muted-foreground">
                {totalCount} transaction{totalCount !== 1 ? "s" : ""} found
              </p>
            </div>
            <TransactionFilter
              activeFilter={activeFilter}
              onFilterChange={handleFilterChange}
            />
          </div>

          {/* Transactions List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              No {activeFilter !== "all" ? activeFilter : ""} transactions found.
            </p>
          ) : (
            <div className="space-y-2">
              {transactions.map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  merchant={transaction.to_account_name}
                  category={transaction.description || "Transfer"}
                  amount={-parseFloat(transaction.amount.toString())}
                  date={new Date(transaction.created_at).toLocaleString()}
                  type="debit"
                  status={transaction.status}
                  onClick={() => {
                    setSelectedTransaction(transaction);
                    setTransactionDetailsOpen(true);
                  }}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </main>

      <TransactionDetailsDialog
        open={transactionDetailsOpen}
        onOpenChange={setTransactionDetailsOpen}
        transaction={selectedTransaction}
      />
    </div>
  );
};

export default Transactions;
