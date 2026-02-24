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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Pencil, Building2 } from "lucide-react";

// Bank Account Types
interface BankAccount {
  id: string;
  bankId: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
  bank: {
    id: string;
    name: string;
    code: string;
    logoUrl?: string;
  };
}

const bankAccountSchema = z.object({
  bankId: z.string().min(1, "Bank is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  accountName: z.string().min(1, "Account name is required"),
  isDefault: z.boolean(),
});

type BankAccountFormValues = z.infer<typeof bankAccountSchema>;

export default function BankSettingsPage() {
  const { user } = useAuth();

  // Bank Account State
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [isBankLoading, setIsBankLoading] = useState(false);
  const [availableBanks, setAvailableBanks] = useState<any[]>([]);

  // Bank Account Form
  const bankForm = useForm<BankAccountFormValues>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      bankId: "",
      accountNumber: "",
      accountName: "",
      isDefault: false,
    },
  });

  useEffect(() => {
    if (user) {
      fetchBankAccounts();
      fetchBanks();
    }
  }, [user]);

  const fetchBankAccounts = async () => {
    try {
      const data = await api.get<BankAccount[]>("/bank-accounts/me");
      setBankAccounts(data);
    } catch (error) {
      console.error("Failed to fetch bank accounts", error);
    }
  };

  const fetchBanks = async () => {
    try {
      const data = await api.get<any[]>("/banks");
      setAvailableBanks(data);
    } catch (error) {
      console.error("Failed to fetch banks", error);
    }
  };

  const onBankSubmit = async (data: BankAccountFormValues) => {
    setIsBankLoading(true);
    try {
      if (editingAccount) {
        await api.patch(`/bank-accounts/${editingAccount.id}`, data);
        toast.success("Bank account updated");
      } else {
        await api.post("/bank-accounts", data);
        toast.success("Bank account added");
      }
      setIsBankModalOpen(false);
      fetchBankAccounts();
    } catch (error) {
      console.error("Failed to save bank account", error);
      toast.error("Failed to save bank account");
    } finally {
      setIsBankLoading(false);
      setEditingAccount(null);
      bankForm.reset();
    }
  };

  const handleDeleteBankAccount = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bank account?")) return;
    try {
      await api.delete(`/bank-accounts/${id}`);
      toast.success("Bank account deleted");
      fetchBankAccounts();
    } catch (error) {
      console.error("Failed to delete bank account", error);
      toast.error("Failed to delete bank account");
    }
  };

  const openBankModal = (account?: BankAccount) => {
    if (account) {
      setEditingAccount(account);
      bankForm.reset({
        bankId: account.bankId,
        accountNumber: account.accountNumber,
        accountName: account.accountName,
        isDefault: account.isDefault,
      });
    } else {
      setEditingAccount(null);
      bankForm.reset({
        bankId: "",
        accountNumber: "",
        accountName: "",
        isDefault: false,
      });
    }
    setIsBankModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1.5">
            <CardTitle>Bank Accounts</CardTitle>
            <CardDescription>Manage your bank accounts for receiving payments.</CardDescription>
          </div>
          <Dialog open={isBankModalOpen} onOpenChange={setIsBankModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openBankModal()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingAccount ? "Edit Bank Account" : "Add Bank Account"}</DialogTitle>
                <DialogDescription>
                  Enter your bank account details below.
                </DialogDescription>
              </DialogHeader>
              <Form {...bankForm}>
                <form onSubmit={bankForm.handleSubmit(onBankSubmit)} className="space-y-4">
                  <FormField
                    control={bankForm.control}
                    name="bankId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...field}
                          >
                            <option value="">Select a bank</option>
                            {availableBanks.map(bank => (
                              <option key={bank.id} value={bank.id}>{bank.name}</option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={bankForm.control}
                    name="accountName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Account Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={bankForm.control}
                    name="accountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Account Number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={bankForm.control}
                    name="isDefault"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Default Account</FormLabel>
                          <DialogDescription>
                            Use this account as default for receiving payments.
                          </DialogDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button type="submit" disabled={isBankLoading}>
                      {isBankLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Save Account
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {bankAccounts.length === 0 ? (
            <div className="text-center py-8 text-gray-500 border border-dashed rounded-lg">
              No bank accounts added yet.
            </div>
          ) : (
            <div className="space-y-4">
              {bankAccounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50/50">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-indigo-50 rounded-lg flex items-center justify-center overflow-hidden h-12 w-12 shrink-0">
                      {account.bank.logoUrl ? (
                        <img src={api.getImageUrl(account.bank.logoUrl)} alt={account.bank.name} className="h-full w-full object-contain" />
                      ) : (
                        <Building2 className="text-indigo-600" size={24} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{account.bank.name}</p>
                        {account.isDefault && (
                          <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">Default</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{account.accountName}</p>
                      <p className="text-sm text-gray-500 tracking-wider">{account.accountNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500 hover:text-indigo-600" onClick={() => openBankModal(account)}>
                      <Pencil size={16} />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500 hover:text-red-600" onClick={() => handleDeleteBankAccount(account.id)}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
