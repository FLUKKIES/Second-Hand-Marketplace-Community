"use client"

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Address } from "@/types";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, MapPin, Trash2, Loader2 } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";

const addressSchema = z.object({
    label: z.string().min(1, "Label is required"),
    addressLine1: z.string().min(1, "Address Line 1 is required"),
    addressLine2: z.string().optional(),
    subDistrict: z.string().min(1, "Sub-district is required"),
    district: z.string().min(1, "District is required"),
    province: z.string().min(1, "Province is required"),
    postalCode: z.string().min(5, "Postal code is required"),
    phoneNumber: z.string().optional(),
    isDefault: z.boolean().optional(),
});

type AddressFormValues = z.infer<typeof addressSchema>;

export default function AddressSettingsPage() {
    const { user } = useAuth();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<AddressFormValues>({
        resolver: zodResolver(addressSchema),
        defaultValues: {
            label: "Home",
            addressLine1: "",
            addressLine2: "",
            subDistrict: "",
            district: "",
            province: "",
            postalCode: "",
            phoneNumber: "",
            isDefault: false,
        },
    });

    const fetchAddresses = async () => {
        try {
            setIsLoading(true);
            const res = await api.get("/addresses/me");
            setAddresses(res.data);
        } catch (error) {
            console.error("Failed to fetch addresses", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAddresses();
    }, []);

    const onSubmit = async (data: AddressFormValues) => {
        try {
            setIsSubmitting(true);
            await api.post("/addresses", data);
            fetchAddresses();
            setIsDialogOpen(false);
            form.reset();
        } catch (error) {
            console.error("Failed to create address", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this address?")) return;
        try {
            await api.delete(`/addresses/${id}`);
            fetchAddresses();
        } catch (error) {
            console.error("Failed to delete address", error);
        }
    };

    if (isLoading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">My Addresses</h2>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus size={16} /> Add Address
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] overflow-y-auto max-h-[90vh]">
                        <DialogHeader>
                            <DialogTitle>Add New Address</DialogTitle>
                            <DialogDescription>
                                Add a new shipping address to your account.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                            <div className="grid gap-2">
                                <Label htmlFor="label">Label (e.g. Home, Office)</Label>
                                <Input id="label" {...form.register("label")} />
                                {form.formState.errors.label && <p className="text-red-500 text-xs">{form.formState.errors.label.message}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="addressLine1">Address Line 1</Label>
                                <Input id="addressLine1" placeholder="House No., Building, Street" {...form.register("addressLine1")} />
                                {form.formState.errors.addressLine1 && <p className="text-red-500 text-xs">{form.formState.errors.addressLine1.message}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                                <Input id="addressLine2" placeholder="Floor, Room, Landmark" {...form.register("addressLine2")} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="subDistrict">Sub-district / Tambon</Label>
                                    <Input id="subDistrict" {...form.register("subDistrict")} />
                                    {form.formState.errors.subDistrict && <p className="text-red-500 text-xs">{form.formState.errors.subDistrict.message}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="district">District / Amphoe</Label>
                                    <Input id="district" {...form.register("district")} />
                                    {form.formState.errors.district && <p className="text-red-500 text-xs">{form.formState.errors.district.message}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="province">Province / Changwat</Label>
                                    <Input id="province" {...form.register("province")} />
                                    {form.formState.errors.province && <p className="text-red-500 text-xs">{form.formState.errors.province.message}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="postalCode">Postal Code</Label>
                                    <Input id="postalCode" {...form.register("postalCode")} />
                                    {form.formState.errors.postalCode && <p className="text-red-500 text-xs">{form.formState.errors.postalCode.message}</p>}
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="phoneNumber">Phone Number (for delivery)</Label>
                                <Input id="phoneNumber" {...form.register("phoneNumber")} />
                            </div>
                            
                            {/* Checkbox for isDefault could go here if UI supports it easily */}

                            <div className="flex justify-end pt-4">
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Address
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4">
                {addresses.length === 0 ? (
                    <div className="text-center p-8 border border-dashed rounded-xl text-gray-500">
                        No addresses found. Add one to get started.
                    </div>
                ) : (
                    addresses.map((address) => (
                        <Card key={address.id} className="relative group">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-4">
                                        <div className="bg-indigo-50 p-2.5 rounded-full h-fit">
                                            <MapPin className="text-primary h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-gray-900">{address.label}</h3>
                                                {address.isDefault && (
                                                    <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">Default</span>
                                                )}
                                            </div>
                                            <p className="text-gray-600 text-sm leading-relaxed">
                                                {address.addressLine1} {address.addressLine2 && `, ${address.addressLine2}`} <br />
                                                {address.subDistrict}, {address.district}, {address.province} {address.postalCode}
                                            </p>
                                            {address.phoneNumber && (
                                                 <p className="text-gray-500 text-xs mt-2">Tel: {address.phoneNumber}</p>
                                            )}
                                        </div>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="text-gray-400 hover:text-red-500"
                                        onClick={() => handleDelete(address.id)}
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
