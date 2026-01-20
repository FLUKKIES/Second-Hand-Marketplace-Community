"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, CreditCard, Trash2, Edit2 } from "lucide-react";

// Mock Bank List
const bankAccountFormSchema = z.object({
  bankId: z.string().min(1, "Please select a bank"),
  accountName: z.string().min(1, "Account name is required"),
  accountNumber: z
    .string()
    .min(10, "Account number must be at least 10 digits")
    .regex(/^\d+$/, "Must only contain numbers"),
});

type BankAccountFormValues = z.infer<typeof bankAccountFormSchema>;

import { Bank, BankAccount } from "@/types";

export default function BankSettingsPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(
    null
  );

  // Confirmation States
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);

  const [addConfirmationOpen, setAddConfirmationOpen] = useState(false);
  const [pendingAddData, setPendingAddData] =
    useState<BankAccountFormValues | null>(null);

  const form = useForm<BankAccountFormValues>({
    resolver: zodResolver(bankAccountFormSchema),
    defaultValues: {
      bankId: "",
      accountName: "",
      accountNumber: "",
    },
  });

  const fetchBanks = async () => {
    try {
      const banks = await api.get<Bank[]>("/banks");
      setBanks(banks);
    } catch (error) {
      console.error("Failed to fetch banks", error);
    }
  };

  const fetchAccounts = async () => {
    try {
      const accounts = await api.get<BankAccount[]>("/bank-accounts/me");
      setAccounts(accounts);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch accounts", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (isDialogOpen && editingAccount) {
      form.reset({
        bankId: editingAccount.bankId.toString(), // Ensure string if types created mismatch (though updated to string already)
        accountName: editingAccount.accountName,
        accountNumber: editingAccount.accountNumber,
      });
    } else if (isDialogOpen && !editingAccount) {
      form.reset({
        bankId: "",
        accountName: "",
        accountNumber: "",
      });
    }
  }, [isDialogOpen, editingAccount, form]);

  const onSubmit = async (data: BankAccountFormValues) => {
    if (editingAccount) {
      toast.error(
        "Editing bank account is not supported. Please delete and add a new one."
      );
    } else {
      setPendingAddData(data);
      setAddConfirmationOpen(true);
    }
  };

  const confirmAdd = async () => {
    if (!pendingAddData) return;
    try {
      await api.post<BankAccount>("/bank-accounts", pendingAddData);
      fetchAccounts();
      toast.success("Bank account added");
      setAddConfirmationOpen(false);
      setIsDialogOpen(false);
      setPendingAddData(null);
      setEditingAccount(null);
    } catch (error) {
      toast.error("Failed to save bank account");
    }
  };

  const handleDeleteClick = (id: string) => {
    setAccountToDelete(id);
    setDeleteConfirmationOpen(true);
  };

  const confirmDelete = async () => {
    if (!accountToDelete) return;
    try {
      await api.delete(`/bank-accounts/${accountToDelete}`);
      setAccounts((prev) => prev.filter((a) => a.id !== accountToDelete));
      toast.success("Bank account deleted");
      setDeleteConfirmationOpen(false);
      setAccountToDelete(null);
    } catch (error) {
      toast.error("Failed to delete bank account");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Bank Accounts</CardTitle>
            <CardDescription>
              Manage bank accounts for receiving payouts.
            </CardDescription>
          </div>
          <Button
            onClick={() => {
              setEditingAccount(null);
              setIsDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-primary" />
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <CreditCard className="text-gray-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">
                No bank accounts found
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Add a bank account to receive payments from sales.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDialogOpen(true)}
              >
                Add Bank Account
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="border border-gray-200 rounded-xl p-4 hover:border-indigo-200 transition-colors bg-white relative group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                        {account.bank.code}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {account.bank.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          **** {account.accountNumber.slice(-4)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Edit removed as not supported by backend yet */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-red-600"
                        onClick={() => handleDeleteClick(account.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    Account Name:{" "}
                    <span className="font-medium text-gray-900">
                      {account.accountName}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Bank Account</DialogTitle>
            <DialogDescription>
              Enter your bank account details carefully.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="bankId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a bank" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {banks.map((bank) => (
                          <SelectItem key={bank.id} value={bank.id.toString()}>
                            {bank.name} ({bank.code})
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
                name="accountName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Number</FormLabel>
                    <FormControl>
                      <Input placeholder="1234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit">Save Account</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmationOpen}
        onOpenChange={setDeleteConfirmationOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Bank Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this bank account? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmationOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Confirmation Dialog */}
      <Dialog open={addConfirmationOpen} onOpenChange={setAddConfirmationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bank Account</DialogTitle>
            <DialogDescription>
              Please verify your details before saving. Incorrect details may
              cause payout delays.
            </DialogDescription>
          </DialogHeader>

          {pendingAddData && (
            <div className="py-2 space-y-2 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Bank:</span>
                <span className="col-span-2 font-medium">
                  {banks.find((b) => b.id.toString() === pendingAddData.bankId)
                    ?.name || pendingAddData.bankId}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Account Name:</span>
                <span className="col-span-2 font-medium">
                  {pendingAddData.accountName}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Account No:</span>
                <span className="col-span-2 font-medium">
                  {pendingAddData.accountNumber}
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddConfirmationOpen(false)}
            >
              Edit
            </Button>
            <Button onClick={confirmAdd}>Confirm Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
