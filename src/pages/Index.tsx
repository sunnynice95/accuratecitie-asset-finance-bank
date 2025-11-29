import { AccountCard } from "@/components/AccountCard";
import { TransactionItem } from "@/components/TransactionItem";
import { QuickActions } from "@/components/QuickActions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, User, Settings, TrendingUp } from "lucide-react";

const Index = () => {
  const transactions = [
    {
      merchant: "Amazon",
      category: "Shopping",
      amount: -127.49,
      date: "Today, 2:30 PM",
      type: "debit" as const,
    },
    {
      merchant: "Salary Deposit",
      category: "Income",
      amount: 3500.0,
      date: "Today, 9:00 AM",
      type: "credit" as const,
    },
    {
      merchant: "Starbucks",
      category: "Food & Drink",
      amount: -6.75,
      date: "Yesterday, 8:15 AM",
      type: "debit" as const,
    },
    {
      merchant: "Netflix",
      category: "Entertainment",
      amount: -15.99,
      date: "Nov 25, 2025",
      type: "debit" as const,
    },
    {
      merchant: "Uber",
      category: "Transportation",
      amount: -22.50,
      date: "Nov 24, 2025",
      type: "debit" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card shadow-custom-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Unfounded</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="hover:bg-secondary">
                <Bell className="h-5 w-5 text-foreground" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-secondary">
                <Settings className="h-5 w-5 text-foreground" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-secondary">
                <User className="h-5 w-5 text-foreground" />
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
            Welcome back, Alex
          </h2>
          <p className="text-muted-foreground">
            Here's an overview of your finances
          </p>
        </div>

        {/* Account Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <AccountCard
            accountName="Main Checking"
            accountType="Checking Account"
            balance={12547.82}
            change={2.5}
            changeType="increase"
          />
          <AccountCard
            accountName="Savings"
            accountType="Savings Account"
            balance={48239.15}
            change={5.2}
            changeType="increase"
          />
          <AccountCard
            accountName="Investment"
            accountType="Investment Account"
            balance={94782.40}
            change={-1.3}
            changeType="decrease"
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <QuickActions />
        </div>

        {/* Recent Transactions */}
        <Card className="p-6 gradient-card shadow-custom-md border-border/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-foreground">
              Recent Transactions
            </h3>
            <Button variant="ghost" className="text-primary hover:text-primary/80">
              View All
            </Button>
          </div>
          <div className="space-y-2">
            {transactions.map((transaction, index) => (
              <TransactionItem key={index} {...transaction} />
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Index;
