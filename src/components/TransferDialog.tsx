import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const transferSchema = z.object({
  fromAccountId: z.string().min(1, "Please select an account"),
  toAccountNumber: z
    .string()
    .trim()
    .min(5, "Account number must be at least 5 characters")
    .max(20, "Account number must be less than 20 characters")
    .regex(/^[0-9]+$/, "Account number must contain only numbers"),
  toIban: z
    .string()
    .trim()
    .max(34, "IBAN must be less than 34 characters")
    .regex(/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/, "Invalid IBAN format")
    .optional()
    .or(z.literal("")),
  toSwiftBic: z
    .string()
    .trim()
    .max(11, "SWIFT/BIC must be 8-11 characters")
    .regex(/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/, "Invalid SWIFT/BIC format")
    .optional()
    .or(z.literal("")),
  toAccountName: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  amount: z
    .string()
    .transform((val) => parseFloat(val))
    .refine((val) => !isNaN(val) && val > 0, "Amount must be greater than 0")
    .refine((val) => val <= 1000000, "Amount cannot exceed $1,000,000"),
  description: z
    .string()
    .trim()
    .max(500, "Description must be less than 500 characters")
    .optional(),
});

type TransferFormValues = z.infer<typeof transferSchema>;

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Array<{ id: string; account_name: string; account_number: string; balance: number }>;
  onSuccess: () => void;
}

export const TransferDialog = ({ open, onOpenChange, accounts, onSuccess }: TransferDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      fromAccountId: "",
      toAccountNumber: "",
      toIban: "",
      toSwiftBic: "",
      toAccountName: "",
      amount: "" as any,
      description: "",
    },
  });

  const onSubmit = async (values: TransferFormValues) => {
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-transfer", {
        body: {
          fromAccountId: values.fromAccountId,
          toAccountNumber: values.toAccountNumber,
          toIban: values.toIban || null,
          toSwiftBic: values.toSwiftBic || null,
          toAccountName: values.toAccountName,
          amount: values.amount,
          description: values.description,
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || "Transfer failed");
      }

      toast({
        title: "Transfer Successful",
        description: `$${values.amount.toFixed(2)} transferred to ${values.toAccountName}`,
      });

      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Transfer error:", error);
      toast({
        title: "Transfer Failed",
        description: error.message || "An error occurred during the transfer",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Transfer Money</DialogTitle>
          <DialogDescription>
            Send money securely to another account. All transfers are logged and monitored.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fromAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>From Account</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.account_name} - ${account.balance.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="toAccountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To Account Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter recipient's account number"
                      {...field}
                      maxLength={20}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="toIban"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IBAN (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. DE89370400440532013000"
                        {...field}
                        maxLength={34}
                        className="uppercase"
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="toSwiftBic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SWIFT/BIC (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. COBADEFFXXX"
                        {...field}
                        maxLength={11}
                        className="uppercase"
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="toAccountName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter recipient's name"
                      {...field}
                      maxLength={100}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="1000000"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What's this transfer for?"
                      className="resize-none"
                      {...field}
                      maxLength={500}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Transfer"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};