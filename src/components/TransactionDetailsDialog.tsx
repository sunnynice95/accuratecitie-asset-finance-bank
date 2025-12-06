import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowUpRight, ArrowDownRight, Calendar, Hash, FileText, AlertCircle, CheckCircle2 } from "lucide-react";

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

interface TransactionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
}

export const TransactionDetailsDialog = ({
  open,
  onOpenChange,
  transaction,
}: TransactionDetailsDialogProps) => {
  if (!transaction) return null;

  const isCompleted = transaction.status === "completed";
  const isFailed = transaction.status === "failed";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isFailed ? "bg-destructive/10" : "bg-primary/10"
              }`}
            >
              <ArrowUpRight className={`h-5 w-5 ${isFailed ? "text-destructive" : "text-primary"}`} />
            </div>
            Transaction Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge
              variant={isFailed ? "destructive" : isCompleted ? "default" : "secondary"}
              className="flex items-center gap-1"
            >
              {isFailed ? (
                <AlertCircle className="h-3 w-3" />
              ) : (
                <CheckCircle2 className="h-3 w-3" />
              )}
              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
            </Badge>
          </div>

          <Separator />

          {/* Amount */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Amount</span>
            <span className={`font-bold text-lg ${isFailed ? "text-destructive" : "text-foreground"}`}>
              -${Math.abs(transaction.amount).toFixed(2)}
            </span>
          </div>

          {/* Recipient */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Recipient</span>
            <span className="font-medium text-foreground">{transaction.to_account_name}</span>
          </div>

          {/* Account Number */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Hash className="h-3 w-3" />
              Account Number
            </span>
            <span className="font-mono text-sm text-foreground">{transaction.to_account_number}</span>
          </div>

          <Separator />

          {/* Description */}
          {transaction.description && (
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Description
              </span>
              <p className="text-foreground">{transaction.description}</p>
            </div>
          )}

          {/* Date Created */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Created
            </span>
            <span className="text-sm text-foreground">
              {new Date(transaction.created_at).toLocaleString()}
            </span>
          </div>

          {/* Date Completed */}
          {transaction.completed_at && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Completed
              </span>
              <span className="text-sm text-foreground">
                {new Date(transaction.completed_at).toLocaleString()}
              </span>
            </div>
          )}

          {/* Transaction ID */}
          <div className="pt-2">
            <span className="text-xs text-muted-foreground">Transaction ID</span>
            <p className="font-mono text-xs text-muted-foreground/70 break-all">
              {transaction.id}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
