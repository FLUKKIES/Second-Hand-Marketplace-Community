"use client"

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const accountFormSchema = z.object({
    firstName: z.string().min(2, "First name must be at least 2 characters."),
    lastName: z.string().min(2, "Last name must be at least 2 characters."),
    bio: z.string().max(300, "Bio must not be longer than 300 characters.").optional(),
    phoneNumber: z.string().optional(),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

export default function AccountSettingsPage() {
    const { user, login } = useAuth(); // getting login to refresh user data if needed
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const form = useForm<AccountFormValues>({
        resolver: zodResolver(accountFormSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            bio: "",
            phoneNumber: "",
        },
    });

    // Load user data into form
    useEffect(() => {
        if (user) {
            form.reset({
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                bio: user.bio || "",
                phoneNumber: user.phoneNumber || "",
            });
        }
    }, [user, form]);

    const onSubmit = async (data: AccountFormValues) => {
        setIsLoading(true);
        setSuccessMessage("");
        try {
            const res = await api.patch("/users/me", data);
            
            // Optimistically update the user context or re-fetch
            // For now we might just want to show success
            // In a real app we would update the global auth state:
            // login(res.data.token); // if token is refreshed, or just re-fetch user
            
            // Reload user data to reflect changes in Navbar etc.
            window.location.reload(); 

        } catch (error) {
            console.error("Failed to update profile", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) {
        return <div>Loading user data...</div>;
    }

    return (
        <div className="max-w-2xl">
            <h2 className="text-xl font-semibold mb-6">Account Information</h2>
            
            <div className="mb-8 flex items-center gap-6">
                <Avatar className="h-20 w-20">
                     <AvatarImage src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} />
                     <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    <Button variant="outline" size="sm" disabled>Change Avatar</Button>
                    <p className="text-xs text-muted-foreground mt-2">
                        JPG, GIF or PNG. 1MB max. (Coming soon)
                    </p>
                </div>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">First name</Label>
                        <Input id="firstName" placeholder="John" {...form.register("firstName")} />
                        {form.formState.errors.firstName && (
                            <p className="text-sm text-red-500">{form.formState.errors.firstName.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lastName">Last name</Label>
                        <Input id="lastName" placeholder="Doe" {...form.register("lastName")} />
                        {form.formState.errors.lastName && (
                            <p className="text-sm text-red-500">{form.formState.errors.lastName.message}</p>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea 
                        id="bio" 
                        placeholder="Tell us a little bit about yourself" 
                        className="resize-none min-h-[100px]"
                        {...form.register("bio")} 
                    />
                     <p className="text-xs text-muted-foreground text-right">
                        {form.watch("bio")?.length || 0}/300
                    </p>
                    {form.formState.errors.bio && (
                        <p className="text-sm text-red-500">{form.formState.errors.bio.message}</p>
                    )}
                </div>

                 <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input id="phoneNumber" placeholder="0812345678" {...form.register("phoneNumber")} />
                </div>

                <div className="pt-4">
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Profile
                    </Button>
                </div>
            </form>
        </div>
    );
}
