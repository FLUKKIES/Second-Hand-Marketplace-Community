
"use client";

import { useEffect, useState } from "react";
import { api, getErrorMessage } from "@/lib/api";
import { Bank } from "@/types";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Pencil, Trash, Upload, Loader2, Landmark } from "lucide-react";


export default function AdminBanksPage() {
    const [banks, setBanks] = useState<Bank[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingBank, setEditingBank] = useState<Bank | null>(null);

    // Form Stats
    const [formData, setFormData] = useState({
        name: "",
        code: "",
        officialName: "",
        logoUrl: "",
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const fetchBanks = async () => {
        try {
            const data = await api.get<Bank[]>("/banks");
            setBanks(data);
        } catch (error) {
            toast.error("Failed to fetch banks");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBanks();
    }, []);

    const resetForm = () => {
        setFormData({ name: "", code: "", officialName: "", logoUrl: "" });
        setSelectedFile(null);
        setPreviewUrl(null);
        setEditingBank(null);
    };

    const handleOpenDialog = (bank?: Bank) => {
        if (bank) {
            setEditingBank(bank);
            setFormData({
                name: bank.name,
                code: bank.code,
                officialName: bank.officialName,
                logoUrl: bank.logoUrl || "",
            });
            setPreviewUrl(bank.logoUrl ? api.getImageUrl(bank.logoUrl) : null);
        } else {
            resetForm();
        }
        setIsDialogOpen(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            let logoUrl = formData.logoUrl;

            if (selectedFile) {
                logoUrl = await api.uploadImage(selectedFile, "bank");
            }

            const payload = { ...formData, logoUrl };

            if (editingBank) {
                await api.patch(`/banks/${editingBank.id}`, payload);
                toast.success("Bank updated successfully");
            } else {
                await api.post("/banks", payload);
                toast.success("Bank created successfully");
            }

            setIsDialogOpen(false);
            fetchBanks();
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this bank?")) return;

        try {
            await api.delete(`/banks/${id}`);
            toast.success("Bank deleted successfully");
            fetchBanks();
        } catch (error) {
            toast.error(getErrorMessage(error));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Bank Management</h1>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" /> Add Bank
                </Button>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingBank ? "Edit Bank" : "Add Bank"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Bank Icon</Label>
                            <div className="flex items-center gap-4">
                                <Avatar className="w-16 h-16 border">
                                    <AvatarImage src={previewUrl || ""} className="object-cover" />
                                    <AvatarFallback className="bg-gray-100">
                                        <Landmark className="h-6 w-6 text-gray-400" />
                                    </AvatarFallback>
                                </Avatar>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="max-w-[250px]"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Name (Short)</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Example: KBank"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Bank Code</Label>
                            <Input
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                placeholder="Example: kbank"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Official Name</Label>
                            <Input
                                value={formData.officialName}
                                onChange={(e) => setFormData({ ...formData, officialName: e.target.value })}
                                placeholder="Example: Kasikorn Bank"
                                required
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <div className="border rounded-lg bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Icon</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Official Name</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : banks.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-gray-500">
                                    No banks found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            banks.map((bank) => (
                                <TableRow key={bank.id}>
                                    <TableCell>
                                        <Avatar className="w-10 h-10 border bg-gray-50">
                                            <AvatarImage src={api.getImageUrl(bank.logoUrl)} alt={bank.name} className="object-cover" />
                                            <AvatarFallback>
                                                <Landmark className="h-4 w-4 text-gray-400" />
                                            </AvatarFallback>
                                        </Avatar>
                                    </TableCell>
                                    <TableCell className="font-mono">{bank.code}</TableCell>
                                    <TableCell>{bank.name}</TableCell>
                                    <TableCell>{bank.officialName}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleOpenDialog(bank)}
                                        >
                                            <Pencil className="h-4 w-4 text-blue-500" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(bank.id)}
                                        >
                                            <Trash className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
