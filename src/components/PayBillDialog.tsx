import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, CreditCard, Zap, Wifi, Droplets, Home, Phone } from "lucide-react";

interface Account {
  id: string;
  account_name: string;
  account_number: string;
  balance: number;
  account_type: string;
}

interface PayBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  onSuccess: () => void;
}

const billCategories = [
  { id: "electricity", name: "Electricity", icon: Zap },
  { id: "internet", name: "Internet", icon: Wifi },
  { id: "water", name: "Water", icon: Droplets },
  { id: "rent", name: "Rent", icon: Home },
  { id: "phone", name: "Phone", icon: Phone },
];

export const PayBillDialog = ({
  open,
  onOpenChange,
  accounts,
  onSuccess,
}: PayBillDialogProps) => {
  const [selectedAccount, setSelectedAccount] = useState("");
  const [billCategory, setBillCategory] = useState("");
  const [billerName, setBillerName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePayBill = async () => {
    if (!selectedAccount || !billCategory || !billerName || !accountNumber || !amount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    const account = accounts.find(a => a.id === selectedAccount);
    if (!account || account.balance < paymentAmount) {
      toast({
        title: "Error",
        description: "Insufficient funds",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      // Deduct from account
      const { error: updateError } = await supabase
        .from("accounts")
        .update({ 
          balance: account.balance - paymentAmount,
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedAccount);

      if (updateError) throw updateError;

      // Record transaction
      const { error: txError } = await supabase
        .from("transactions")
        .insert({
          user_id: userData.user.id,
          from_account_id: selectedAccount,
          to_account_number: accountNumber,
          to_account_name: `${billerName} (${billCategory.charAt(0).toUpperCase() + billCategory.slice(1)})`,
          amount: paymentAmount,
          description: `Bill Payment - ${billCategory.charAt(0).toUpperCase() + billCategory.slice(1)}`,
          status: "completed",
          completed_at: new Date().toISOString(),
        });

      if (txError) throw txError;

      toast({
        title: "Bill Payment Successful",
        description: `$${paymentAmount.toFixed(2)} paid to ${billerName}`,
      });

      setSelectedAccount("");
      setBillCategory("");
      setBillerName("");
      setAccountNumber("");
      setAmount("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Bill payment error:", error);
      toast({
        title: "Payment Failed",
        description: error.message || "An error occurred during payment",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Pay Bills
          </DialogTitle>
          <DialogDescription>
            Pay your utility bills and services
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Bill Category</Label>
            <div className="grid grid-cols-5 gap-2">
              {billCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <Button
                    key={category.id}
                    type="button"
                    variant={billCategory === category.id ? "default" : "outline"}
                    className="flex flex-col items-center justify-center h-16 p-2"
                    onClick={() => setBillCategory(category.id)}
                  >
                    <Icon className="h-5 w-5 mb-1" />
                    <span className="text-xs">{category.name}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fromAccount">Pay From</Label>
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger>
                <SelectValue placeholder="Choose account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.account_name} - ${account.balance.toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="billerName">Biller Name</Label>
            <Input
              id="billerName"
              placeholder="e.g., City Power Company"
              value={billerName}
              onChange={(e) => setBillerName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountNumber">Account/Reference Number</Label>
            <Input
              id="accountNumber"
              placeholder="e.g., 123456789"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USD)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handlePayBill} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Pay Bill
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
