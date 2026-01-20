"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, MapPin, Trash2, Edit2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

    const addressFormSchema = z.object({
        label: z.string().min(1, "Label is required"),
        phoneNumber: z.string().min(1, "Phone number is required"),
        addressLine1: z.string().min(1, "Address is required"),
        addressLine2: z.string().optional(),
        subDistrict: z.string().min(1, "Sub-district is required"),
        district: z.string().min(1, "District is required"),
        province: z.string().min(1, "Province is required"),
        postalCode: z.string().min(1, "Postal code is required"),
        isDefault: z.boolean().optional(),
    });

    type AddressFormValues = z.infer<typeof addressFormSchema>;

    import { Address } from "@/types";

    export default function AddressSettingsPage() {
        const { user } = useAuth();
        const [addresses, setAddresses] = useState<Address[]>([]);
        const [loading, setLoading] = useState(true);
        const [isDialogOpen, setIsDialogOpen] = useState(false);
        const [editingAddress, setEditingAddress] = useState<Address | null>(null);

        const form = useForm<AddressFormValues>({
            resolver: zodResolver(addressFormSchema),
            defaultValues: {
                label: "Home",
                phoneNumber: "",
                addressLine1: "",
                addressLine2: "",
                subDistrict: "",
                district: "",
                province: "",
                postalCode: "",
                isDefault: false,
            },
        });

        useEffect(() => {
            fetchAddresses();
        }, []);

        useEffect(() => {
            if (isDialogOpen && editingAddress) {
                // Ensure null values are handled if any
                form.reset({
                    label: editingAddress.label,
                    phoneNumber: editingAddress.phoneNumber,
                    addressLine1: editingAddress.addressLine1,
                    addressLine2: editingAddress.addressLine2 || "",
                    subDistrict: editingAddress.subDistrict,
                    district: editingAddress.district,
                    province: editingAddress.province,
                    postalCode: editingAddress.postalCode,
                    isDefault: editingAddress.isDefault,
                });
            } else if (isDialogOpen && !editingAddress) {
                 form.reset({
                    label: "Home",
                    phoneNumber: user?.phoneNumber || "",
                    addressLine1: "",
                    addressLine2: "",
                    subDistrict: "",
                    district: "",
                    province: "",
                    postalCode: "",
                    isDefault: addresses.length === 0,
                });
            }
        }, [isDialogOpen, editingAddress, user, form, addresses.length]);

        const fetchAddresses = async () => {
            try {
                const addresses = await api.get<Address[]>("/addresses/me");
                setAddresses(addresses);
            } catch (error) {
                console.error("Failed to fetch addresses", error);
                toast.error("Failed to load addresses");
            } finally {
                setLoading(false);
            }
        };

        const onSubmit = async (data: AddressFormValues) => {
            try {
                if (editingAddress) {
                     const address = await api.patch<Address>(`/addresses/${editingAddress.id}`, data);
                     setAddresses(prev => prev.map(a => a.id === editingAddress.id ? address : a));
                     toast.success("Address updated");
                } else {
                     const address = await api.post<Address>("/addresses", data);
                     setAddresses(prev => [...prev, address]);
                     toast.success("Address added");
                }
                 
                 setIsDialogOpen(false);
                 setEditingAddress(null);
            } catch (error) {
                console.error(error);
                toast.error("Failed to save address");
            }
        };

        const handleDelete = async (id: string) => {
            try {
                await api.delete(`/addresses/${id}`);
                setAddresses(prev => prev.filter(a => a.id !== id));
                toast.success("Address deleted");
            } catch (error) {
                toast.error("Failed to delete address");
            }
        };

        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>My Addresses</CardTitle>
                            <CardDescription>
                                Manage your shipping addresses for orders.
                            </CardDescription>
                        </div>
                        <Button onClick={() => { setEditingAddress(null); setIsDialogOpen(true); }}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add New
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="animate-spin text-primary" />
                            </div>
                        ) : addresses.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                    <MapPin className="text-gray-400" />
                                </div>
                                <h3 className="text-sm font-semibold text-gray-900">No addresses found</h3>
                                <p className="text-sm text-gray-500 mb-4">Add an address to speed up checkout.</p>
                                <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(true)}>
                                    Add Address
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {addresses.map((address) => (
                                    <div key={address.id} className="border border-gray-200 rounded-xl p-4 hover:border-indigo-200 transition-colors bg-white relative group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-gray-900">{address.label}</span>
                                                {address.isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
                                            </div>
                                            <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-indigo-600" onClick={() => { setEditingAddress(address); setIsDialogOpen(true); }}>
                                                    <Edit2 size={14} />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600" onClick={() => handleDelete(address.id)}>
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        </div>
                                        
                                        <div className="text-sm text-gray-600 space-y-1">
                                            <p>{address.phoneNumber}</p>
                                            <p>{address.addressLine1}</p>
                                            {address.addressLine2 && <p>{address.addressLine2}</p>}
                                            <p>{address.subDistrict}, {address.district}</p>
                                            <p>{address.province} {address.postalCode}</p>
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
                            <DialogTitle>{editingAddress ? "Edit Address" : "Add New Address"}</DialogTitle>
                            <DialogDescription>
                                Enter your address details below.
                            </DialogDescription>
                        </DialogHeader>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="label"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Label</FormLabel>
                                                <FormControl><Input placeholder="Home" {...field} value={field.value || ""} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="phoneNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Phone Number</FormLabel>
                                                <FormControl><Input placeholder="0812345678" {...field} value={field.value || ""} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="addressLine1"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Address Line 1</FormLabel>
                                            <FormControl><Input placeholder="123 Main St" {...field} value={field.value || ""} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                 <FormField
                                    control={form.control}
                                    name="addressLine2"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Address Line 2 (Optional)</FormLabel>
                                            <FormControl><Input placeholder="Apt 4B" {...field} value={field.value || ""} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="subDistrict"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Sub-District (Tambon)</FormLabel>
                                                <FormControl><Input placeholder="Sukhumvit" {...field} value={field.value || ""} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="district"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>District (Amphoe)</FormLabel>
                                                <FormControl><Input placeholder="Watthana" {...field} value={field.value || ""} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="province"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Province</FormLabel>
                                                <FormControl><Input placeholder="Bangkok" {...field} value={field.value || ""} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="postalCode"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Postal Code</FormLabel>
                                                <FormControl><Input placeholder="10110" {...field} value={field.value || ""} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                
                                <DialogFooter>
                                    <Button type="submit">Save Address</Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }
