import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AccountCard } from "@/components/AccountCard";
import { TransactionItem } from "@/components/TransactionItem";
import { QuickActions } from "@/components/QuickActions";
import { TransferDialog } from "@/components/TransferDialog";
import { TransactionDetailsDialog } from "@/components/TransactionDetailsDialog";
import { TransactionFilter } from "@/components/TransactionFilter";
import { DepositDialog } from "@/components/DepositDialog";
import { PayBillDialog } from "@/components/PayBillDialog";
import { MoreActionsSheet } from "@/components/MoreActionsSheet";
import { BuyAirtimeDialog } from "@/components/BuyAirtimeDialog";
import { RequestMoneyDialog } from "@/components/RequestMoneyDialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Bell, User, Settings as SettingsIcon, LogOut, Loader2, ArrowRight } from "lucide-react";
import logo from "@/assets/logo.png";
import { toast } from "@/hooks/use-toast";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";
interface Account {
  id: string;
  account_name: string;
  account_number: string;
  balance: number;
  account_type: string;
  iban: string | null;
  swift_bic: string | null;
}

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

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [payBillDialogOpen, setPayBillDialogOpen] = useState(false);
  const [moreActionsOpen, setMoreActionsOpen] = useState(false);
  const [buyAirtimeDialogOpen, setBuyAirtimeDialogOpen] = useState(false);
  const [requestMoneyDialogOpen, setRequestMoneyDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactionDetailsOpen, setTransactionDetailsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          navigate("/auth");
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      } else {
        loadData();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from("accounts")
        .select("*")
        .order("created_at", { ascending: true });

      if (accountsError) throw accountsError;
      setAccounts(accountsData || []);

      // Load recent transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load account data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleTransferSuccess = () => {
    loadData();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "there";

  const filteredTransactions = activeFilter === "all" 
    ? transactions 
    : transactions.filter(t => t.status === activeFilter);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card shadow-custom-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Accuratecitiefinance" className="w-10 h-10 object-contain" />
              <h1 className="text-2xl font-bold text-foreground">Accuratecitiefinance</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="hover:bg-secondary">
                <Bell className="h-5 w-5 text-foreground" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="hover:bg-secondary"
                onClick={() => navigate("/settings")}
                title="Settings"
              >
                <SettingsIcon className="h-5 w-5 text-foreground" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="hover:bg-secondary"
                onClick={() => navigate("/profile")}
                title="Profile"
              >
                <User className="h-5 w-5 text-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-destructive/10 hover:text-destructive"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {userName}
          </h2>
          <p className="text-muted-foreground">
            Here's an overview of your finances
          </p>
        </div>

        {/* Account Cards */}
        {accounts.length === 0 ? (
          <Card className="p-8 mb-8 text-center">
            <p className="text-muted-foreground mb-4">
              No accounts found. Visit the backend to create your first account.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                accountName={account.account_name}
                accountType={`${account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1)} Account`}
                balance={parseFloat(account.balance.toString())}
                change={0}
                changeType="increase"
                iban={account.iban}
              />
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <QuickActions 
            onTransferClick={() => setTransferDialogOpen(true)}
            onDepositClick={() => setDepositDialogOpen(true)}
            onPayBillClick={() => setPayBillDialogOpen(true)}
            onMoreClick={() => setMoreActionsOpen(true)}
          />
        </div>

        {/* Recent Transactions */}
        <Card className="p-6 gradient-card shadow-custom-md border-border/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-xl font-semibold text-foreground">
              Recent Transactions
            </h3>
            <div className="flex items-center gap-3">
              <TransactionFilter
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/transactions")}
                className="text-primary hover:text-primary/80"
              >
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            {transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No transactions yet. Make your first transfer!
              </p>
            ) : (
              filteredTransactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No {activeFilter} transactions found.
                </p>
              ) : (
                filteredTransactions.map((transaction) => (
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
                ))
              )
            )}
          </div>
        </Card>
      </main>

      <TransferDialog
        open={transferDialogOpen}
        onOpenChange={setTransferDialogOpen}
        accounts={accounts}
        onSuccess={handleTransferSuccess}
      />

      <DepositDialog
        open={depositDialogOpen}
        onOpenChange={setDepositDialogOpen}
        accounts={accounts}
        onSuccess={handleTransferSuccess}
      />

      <PayBillDialog
        open={payBillDialogOpen}
        onOpenChange={setPayBillDialogOpen}
        accounts={accounts}
        onSuccess={handleTransferSuccess}
      />

      <MoreActionsSheet
        open={moreActionsOpen}
        onOpenChange={setMoreActionsOpen}
        onBuyAirtime={() => setBuyAirtimeDialogOpen(true)}
        onRequestMoney={() => setRequestMoneyDialogOpen(true)}
      />

      <BuyAirtimeDialog
        open={buyAirtimeDialogOpen}
        onOpenChange={setBuyAirtimeDialogOpen}
        accounts={accounts}
        onSuccess={handleTransferSuccess}
      />

      <RequestMoneyDialog
        open={requestMoneyDialogOpen}
        onOpenChange={setRequestMoneyDialogOpen}
        accounts={accounts}
      />

      <TransactionDetailsDialog
        open={transactionDetailsOpen}
        onOpenChange={setTransactionDetailsOpen}
        transaction={selectedTransaction}
      />
    </div>
  );
};

export default Index;