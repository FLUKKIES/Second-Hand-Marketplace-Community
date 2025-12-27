"use client"

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Bank, BankAccount } from "@/types";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, CreditCard, Trash2, Loader2, Building2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const bankAccountSchema = z.object({
    bankId: z.string().min(1, "Bank is required"),
    accountNumber: z.string().min(1, "Account number is required"),
    accountName: z.string().min(1, "Account name is required"),
});

type BankAccountFormValues = z.infer<typeof bankAccountSchema>;

export default function BankSettingsPage() {
    const { user } = useAuth();
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [banks, setBanks] = useState<Bank[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<BankAccountFormValues>({
        resolver: zodResolver(bankAccountSchema),
        defaultValues: {
            bankId: "",
            accountNumber: "",
            accountName: "",
        },
    });

    const fetchBankAccounts = async () => {
        try {
            setIsLoading(true);
            const res = await api.get("/bank-accounts/me");
            setBankAccounts(res.data);
        } catch (error) {
            console.error("Failed to fetch bank accounts", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchBanks = async () => {
        try {
            const res = await api.get<Bank[]>("/banks");
            setBanks(res.data);
        } catch (error) {
            console.error("Failed to fetch banks", error);
        }
    };

    useEffect(() => {
        fetchBankAccounts();
        fetchBanks();
    }, []);

    const onSubmit = async (data: BankAccountFormValues) => {
        try {
            setIsSubmitting(true);
            // DTO expects bankId as string, verified in backend
            await api.post("/bank-accounts", data);
            fetchBankAccounts();
            setIsDialogOpen(false);
            form.reset();
        } catch (error) {
            console.error("Failed to create bank account", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this bank account?")) return;
        try {
            await api.delete(`/bank-accounts/${id}`);
            fetchBankAccounts();
        } catch (error) {
            console.error("Failed to delete bank account", error);
        }
    };

    if (isLoading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Bank Accounts</h2>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus size={16} /> Add Account
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Link Bank Account</DialogTitle>
                            <DialogDescription>
                                Add a bank account to receive payments.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                            <div className="grid gap-2">
                                <Label htmlFor="bankId">Bank</Label>
                                <Select onValueChange={(value) => form.setValue("bankId", value)} defaultValue={form.getValues("bankId")}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a bank" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {banks.map((bank) => (
                                            <SelectItem key={bank.id} value={bank.id.toString()}>
                                                <div className="flex items-center gap-2">
                                                    {/* If bank has logo, we could show it, typically simplified */}
                                                    <span>{bank.name}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {form.formState.errors.bankId && <p className="text-red-500 text-xs">{form.formState.errors.bankId.message}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="accountNumber">Account Number</Label>
                                <Input id="accountNumber" placeholder="0123456789" {...form.register("accountNumber")} />
                                {form.formState.errors.accountNumber && <p className="text-red-500 text-xs">{form.formState.errors.accountNumber.message}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="accountName">Account Name</Label>
                                <Input id="accountName" placeholder="John Doe" {...form.register("accountName")} />
                                {form.formState.errors.accountName && <p className="text-red-500 text-xs">{form.formState.errors.accountName.message}</p>}
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Link Account
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4">
                {bankAccounts.length === 0 ? (
                    <div className="text-center p-8 border border-dashed rounded-xl text-gray-500">
                        No bank accounts linked. Add one to receive payments.
                    </div>
                ) : (
                    bankAccounts.map((account) => (
                        <Card key={account.id} className="relative group">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100 overflow-hidden">
                                            {account.bank.logoUrl ? (
                                                <img src={account.bank.logoUrl} alt={account.bank.name} className="w-full h-full object-contain" />
                                            ) : (
                                                <Building2 className="text-gray-400" size={24} />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{account.bank.name}</h3>
                                            <p className="text-sm font-medium text-gray-600 font-mono tracking-wide">{account.accountNumber}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{account.accountName}</p>
                                        </div>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="text-gray-400 hover:text-red-500"
                                        onClick={() => handleDelete(account.id)}
                                    >
                                        <Trash2 size={18} />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
