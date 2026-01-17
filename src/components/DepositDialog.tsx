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
import { Loader2, ArrowDownToLine } from "lucide-react";

interface Account {
  id: string;
  account_name: string;
  account_number: string;
  balance: number;
  account_type: string;
}

interface DepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  onSuccess: () => void;
}

export const DepositDialog = ({
  open,
  onOpenChange,
  accounts,
  onSuccess,
}: DepositDialogProps) => {
  const [selectedAccount, setSelectedAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleDeposit = async () => {
    if (!selectedAccount || !amount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Update account balance
      const { error } = await supabase
        .from("accounts")
        .update({ 
          balance: accounts.find(a => a.id === selectedAccount)!.balance + depositAmount,
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedAccount);

      if (error) throw error;

      toast({
        title: "Deposit Successful",
        description: `$${depositAmount.toFixed(2)} has been deposited to your account`,
      });

      setSelectedAccount("");
      setAmount("");
      setReference("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Deposit error:", error);
      toast({
        title: "Deposit Failed",
        description: error.message || "An error occurred during deposit",
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
            <ArrowDownToLine className="h-5 w-5 text-primary" />
            Deposit Funds
          </DialogTitle>
          <DialogDescription>
            Add funds to your account
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="account">Select Account</Label>
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger>
                <SelectValue placeholder="Choose account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.account_name} ({account.account_type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

          <div className="space-y-2">
            <Label htmlFor="reference">Reference (Optional)</Label>
            <Input
              id="reference"
              placeholder="e.g., Salary, Gift"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleDeposit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Deposit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
