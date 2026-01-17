import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Send, ArrowDownToLine, CreditCard, Plus } from "lucide-react";

interface QuickActionsProps {
  onTransferClick: () => void;
  onDepositClick: () => void;
  onPayBillClick: () => void;
  onMoreClick: () => void;
}

export const QuickActions = ({ 
  onTransferClick, 
  onDepositClick, 
  onPayBillClick,
  onMoreClick 
}: QuickActionsProps) => {
  return (
    <Card className="p-6 gradient-card shadow-custom-md border-border/50">
      <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button
          variant="outline"
          className="flex flex-col items-center justify-center h-24 gap-2 hover:bg-primary/5 hover:border-primary transition-smooth"
          onClick={onTransferClick}
        >
          <Send className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-foreground">Transfer</span>
        </Button>
        <Button
          variant="outline"
          className="flex flex-col items-center justify-center h-24 gap-2 hover:bg-primary/5 hover:border-primary transition-smooth"
          onClick={onDepositClick}
        >
          <ArrowDownToLine className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-foreground">Deposit</span>
        </Button>
        <Button
          variant="outline"
          className="flex flex-col items-center justify-center h-24 gap-2 hover:bg-primary/5 hover:border-primary transition-smooth"
          onClick={onPayBillClick}
        >
          <CreditCard className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-foreground">Pay Bills</span>
        </Button>
        <Button
          variant="outline"
          className="flex flex-col items-center justify-center h-24 gap-2 hover:bg-primary/5 hover:border-primary transition-smooth"
          onClick={onMoreClick}
        >
          <Plus className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-foreground">More</span>
        </Button>
      </div>
    </Card>
  );
};
