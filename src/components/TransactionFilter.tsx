import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, ListFilter } from "lucide-react";

type FilterStatus = "all" | "completed" | "failed";

interface TransactionFilterProps {
  activeFilter: FilterStatus;
  onFilterChange: (filter: FilterStatus) => void;
}

export const TransactionFilter = ({
  activeFilter,
  onFilterChange,
}: TransactionFilterProps) => {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant={activeFilter === "all" ? "default" : "outline"}
        size="sm"
        onClick={() => onFilterChange("all")}
        className="flex items-center gap-1.5"
      >
        <ListFilter className="h-4 w-4" />
        All
      </Button>
      <Button
        variant={activeFilter === "completed" ? "default" : "outline"}
        size="sm"
        onClick={() => onFilterChange("completed")}
        className="flex items-center gap-1.5"
      >
        <CheckCircle2 className="h-4 w-4" />
        Completed
      </Button>
      <Button
        variant={activeFilter === "failed" ? "destructive" : "outline"}
        size="sm"
        onClick={() => onFilterChange("failed")}
        className="flex items-center gap-1.5"
      >
        <XCircle className="h-4 w-4" />
        Failed
      </Button>
    </div>
  );
};
