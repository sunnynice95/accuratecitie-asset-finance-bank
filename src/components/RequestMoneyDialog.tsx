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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Loader2, Receipt, Copy, Check } from "lucide-react";

interface Account {
  id: string;
  account_name: string;
  account_number: string;
  balance: number;
  account_type: string;
  iban?: string | null;
}

interface RequestMoneyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
}

export const RequestMoneyDialog = ({
  open,
  onOpenChange,
  accounts,
}: RequestMoneyDialogProps) => {
  const [selectedAccount, setSelectedAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);

  const selectedAccountData = accounts.find(a => a.id === selectedAccount);

  const generatePaymentLink = () => {
    if (!selectedAccount || !amount) return "";
    const account = accounts.find(a => a.id === selectedAccount);
    if (!account) return "";
    return `Pay $${amount} to ${account.account_name} (${account.account_number})${note ? ` - ${note}` : ""}`;
  };

  const handleCopy = async () => {
    const text = generatePaymentLink();
    if (!text) {
      toast({
        title: "Error",
        description: "Please fill in account and amount first",
        variant: "destructive",
      });
      return;
    }

    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Payment request copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Request Money
          </DialogTitle>
          <DialogDescription>
            Generate a payment request to share
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="toAccount">Receive To</Label>
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

          {selectedAccountData && (
            <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
              <p><span className="text-muted-foreground">Account:</span> {selectedAccountData.account_number}</p>
              {selectedAccountData.iban && (
                <p><span className="text-muted-foreground">IBAN:</span> {selectedAccountData.iban}</p>
              )}
            </div>
          )}

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
            <Label htmlFor="note">Note (Optional)</Label>
            <Textarea
              id="note"
              placeholder="What's this for?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </div>

          {selectedAccount && amount && (
            <div className="p-4 bg-secondary rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Payment Request Preview:</p>
              <p className="text-sm font-medium">{generatePaymentLink()}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleCopy} disabled={!selectedAccount || !amount}>
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy Request
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
