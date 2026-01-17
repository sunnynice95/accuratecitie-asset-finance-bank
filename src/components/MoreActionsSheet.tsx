import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Smartphone, 
  Receipt, 
  PiggyBank, 
  Gift,
  QrCode,
  HelpCircle,
  Shield
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface MoreActionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBuyAirtime: () => void;
  onRequestMoney: () => void;
}

const moreActions = [
  { 
    id: "airtime", 
    name: "Buy Airtime", 
    description: "Top up your mobile phone",
    icon: Smartphone,
    action: "airtime"
  },
  { 
    id: "request", 
    name: "Request Money", 
    description: "Request payment from others",
    icon: Receipt,
    action: "request"
  },
  { 
    id: "savings", 
    name: "Savings Goals", 
    description: "Set and track savings goals",
    icon: PiggyBank,
    action: "coming-soon"
  },
  { 
    id: "statements", 
    name: "Statements", 
    description: "View and download statements",
    icon: FileText,
    action: "coming-soon"
  },
  { 
    id: "rewards", 
    name: "Rewards", 
    description: "View your rewards and points",
    icon: Gift,
    action: "coming-soon"
  },
  { 
    id: "qr", 
    name: "QR Payments", 
    description: "Pay or receive via QR code",
    icon: QrCode,
    action: "coming-soon"
  },
  { 
    id: "security", 
    name: "Security Center", 
    description: "Manage security settings",
    icon: Shield,
    action: "coming-soon"
  },
  { 
    id: "help", 
    name: "Help & Support", 
    description: "Get assistance",
    icon: HelpCircle,
    action: "coming-soon"
  },
];

export const MoreActionsSheet = ({
  open,
  onOpenChange,
  onBuyAirtime,
  onRequestMoney,
}: MoreActionsSheetProps) => {
  const handleAction = (action: string) => {
    switch (action) {
      case "airtime":
        onOpenChange(false);
        onBuyAirtime();
        break;
      case "request":
        onOpenChange(false);
        onRequestMoney();
        break;
      case "coming-soon":
        toast({
          title: "Coming Soon",
          description: "This feature will be available soon!",
        });
        break;
      default:
        break;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh]">
        <SheetHeader className="mb-6">
          <SheetTitle>More Actions</SheetTitle>
          <SheetDescription>
            Explore all available banking services
          </SheetDescription>
        </SheetHeader>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {moreActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                variant="outline"
                className="flex flex-col items-center justify-center h-28 gap-2 hover:bg-primary/5 hover:border-primary transition-smooth"
                onClick={() => handleAction(action.action)}
              >
                <Icon className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium text-foreground">{action.name}</span>
                <span className="text-xs text-muted-foreground text-center line-clamp-1">
                  {action.description}
                </span>
              </Button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
};
