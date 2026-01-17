import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface AccountCardProps {
  accountName: string;
  accountType: string;
  balance: number;
  currency?: string;
  change?: number;
  changeType?: "increase" | "decrease";
  iban?: string | null;
}

export const AccountCard = ({
  accountName,
  accountType,
  balance,
  currency = "USD",
  change,
  changeType = "increase",
  iban,
}: AccountCardProps) => {
  return (
    <Card className="p-6 gradient-card shadow-custom-md hover:shadow-custom-lg transition-smooth border-border/50">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{accountType}</p>
            <h3 className="text-lg font-semibold text-foreground mt-1">{accountName}</h3>
          </div>
          {change && (
            <div
              className={`flex items-center gap-1 text-sm font-medium ${
                changeType === "increase" ? "text-success" : "text-destructive"
              }`}
            >
              {changeType === "increase" ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              {Math.abs(change)}%
            </div>
          )}
        </div>
        
        <div className="mt-2">
          <p className="text-3xl font-bold text-foreground">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: currency,
            }).format(balance)}
          </p>
        </div>
        
        {iban && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">IBAN</p>
            <p className="text-sm font-mono text-foreground/80">{iban}</p>
          </div>
        )}
      </div>
    </Card>
  );
};
