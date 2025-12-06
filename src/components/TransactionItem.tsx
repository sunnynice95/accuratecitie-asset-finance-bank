import { ArrowUpRight, ArrowDownRight, AlertCircle } from "lucide-react";

interface TransactionItemProps {
  merchant: string;
  category: string;
  amount: number;
  date: string;
  type: "credit" | "debit";
  status?: string;
  onClick?: () => void;
}

export const TransactionItem = ({
  merchant,
  category,
  amount,
  date,
  type,
  status = "completed",
  onClick,
}: TransactionItemProps) => {
  const isFailed = status === "failed";

  return (
    <div 
      className={`flex items-center justify-between py-4 border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-smooth px-4 -mx-4 rounded-lg cursor-pointer ${
        isFailed ? "bg-destructive/5" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isFailed ? "bg-destructive/10" : type === "credit" ? "bg-success/10" : "bg-primary/10"
          }`}
        >
          {isFailed ? (
            <AlertCircle className="h-5 w-5 text-destructive" />
          ) : type === "credit" ? (
            <ArrowDownRight className="h-5 w-5 text-success" />
          ) : (
            <ArrowUpRight className="h-5 w-5 text-primary" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-foreground">{merchant}</p>
            {isFailed && (
              <span className="text-xs font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                Failed
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{category}</p>
        </div>
      </div>
      <div className="text-right">
        <p
          className={`font-bold ${
            isFailed ? "text-destructive line-through" : type === "credit" ? "text-success" : "text-foreground"
          }`}
        >
          {type === "credit" ? "+" : "-"}${Math.abs(amount).toFixed(2)}
        </p>
        <p className="text-sm text-muted-foreground">{date}</p>
      </div>
    </div>
  );
};
