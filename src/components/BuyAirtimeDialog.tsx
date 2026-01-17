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
import { Loader2, Smartphone } from "lucide-react";

interface Account {
  id: string;
  account_name: string;
  account_number: string;
  balance: number;
  account_type: string;
}

interface BuyAirtimeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  onSuccess: () => void;
}

const airtimeAmounts = [5, 10, 20, 50, 100];

export const BuyAirtimeDialog = ({
  open,
  onOpenChange,
  accounts,
  onSuccess,
}: BuyAirtimeDialogProps) => {
  const [selectedAccount, setSelectedAccount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleBuyAirtime = async () => {
    if (!selectedAccount || !phoneNumber || !amount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const airtimeAmount = parseFloat(amount);
    if (isNaN(airtimeAmount) || airtimeAmount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    const account = accounts.find(a => a.id === selectedAccount);
    if (!account || account.balance < airtimeAmount) {
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
          balance: account.balance - airtimeAmount,
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
          to_account_number: phoneNumber,
          to_account_name: `Airtime - ${phoneNumber}`,
          amount: airtimeAmount,
          description: "Airtime Purchase",
          status: "completed",
          completed_at: new Date().toISOString(),
        });

      if (txError) throw txError;

      toast({
        title: "Airtime Purchase Successful",
        description: `$${airtimeAmount.toFixed(2)} airtime sent to ${phoneNumber}`,
      });

      setSelectedAccount("");
      setPhoneNumber("");
      setAmount("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Airtime purchase error:", error);
      toast({
        title: "Purchase Failed",
        description: error.message || "An error occurred during purchase",
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
            <Smartphone className="h-5 w-5 text-primary" />
            Buy Airtime
          </DialogTitle>
          <DialogDescription>
            Top up your mobile phone balance
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              placeholder="+1 234 567 8900"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Quick Amount</Label>
            <div className="grid grid-cols-5 gap-2">
              {airtimeAmounts.map((amt) => (
                <Button
                  key={amt}
                  type="button"
                  variant={amount === amt.toString() ? "default" : "outline"}
                  onClick={() => setAmount(amt.toString())}
                >
                  ${amt}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customAmount">Or Enter Amount (USD)</Label>
            <Input
              id="customAmount"
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
          <Button onClick={handleBuyAirtime} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Buy Airtime
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
