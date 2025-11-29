import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface TransactionItemProps {
  merchant: string;
  category: string;
  amount: number;
  date: string;
  type: "credit" | "debit";
}

export const TransactionItem = ({
  merchant,
  category,
  amount,
  date,
  type,
}: TransactionItemProps) => {
  return (
    <div className="flex items-center justify-between py-4 border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-smooth px-4 -mx-4 rounded-lg">
      <div className="flex items-center gap-4">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            type === "credit" ? "bg-success/10" : "bg-primary/10"
          }`}
        >
          {type === "credit" ? (
            <ArrowDownRight className="h-5 w-5 text-success" />
          ) : (
            <ArrowUpRight className="h-5 w-5 text-primary" />
          )}
        </div>
        <div>
          <p className="font-semibold text-foreground">{merchant}</p>
          <p className="text-sm text-muted-foreground">{category}</p>
        </div>
      </div>
      <div className="text-right">
        <p
          className={`font-bold ${
            type === "credit" ? "text-success" : "text-foreground"
          }`}
        >
          {type === "credit" ? "+" : "-"}${Math.abs(amount).toFixed(2)}
        </p>
        <p className="text-sm text-muted-foreground">{date}</p>
      </div>
    </div>
  );
};
