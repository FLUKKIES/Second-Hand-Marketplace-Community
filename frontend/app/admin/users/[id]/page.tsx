"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Ban, CheckCircle, Mail, Calendar, MapPin, AlertTriangle, Shield } from "lucide-react";
import { toast } from "sonner";
import { BanUserDialog } from "@/components/admin/BanUserDialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserProfile {
    id: string;
    username: string;
    email: string; // Admin can see email
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    bio: string | null;
    role: "USER" | "ADMIN";
    createdAt: string;
    phoneNumber: string | null;
    warningCount: number;
    isBanned: boolean;
    banReason: string | null;
    addresses: any[];
}

export default function AdminUserDetailPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.id as string; // Note: The route should be /admin/users/[id], but AdminUsersPage links to username. We might need to adjust or fetch by username if ID is not available. 
    // Actually, getting by ID is safer for admin. Let's assume we link by ID.

    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Ban/Unban State
    const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);
    const [isUnbanDialogOpen, setIsUnbanDialogOpen] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                // We need a way to get user details by ID for admin. 
                // The existing getPublicProfile uses username. 
                // Creating a specific admin endpoint or using the search/getMe logic might be needed.
                // However, for admin, we probably want full details. 
                // Let's verify if we have GET /users/:id for admin. 
                // If not, we might need to rely on the public one OR add a new endpoint. 
                // But wait, the previous `getMe` is for self.

                // Workaround: Use the public profile endpoint if we only have username in URL, 
                // OR if we pass ID, we need an endpoint. 
                // Let's assume we change the link to pass ID and use a new endpoint OR reusing one.
                // Actually, let's use the public profile for now but we really need Email/Phone etc.
                // Let's try to fetch by ID. If it fails, we might need to add a backend endpoint `GET /users/:id` for Admin.

                // Checking backend `UsersController`:
                // Public: GET /users/:username -> getPublicProfile
                // Private: GET /users/me -> getMe
                // Search: GET /users/search -> search

                // Missing: GET /users/:id (Admin get full detail).
                // I should probably add this to backend first? 
                // Or I can use client side trickery? No.
                // Let's just use what we have: GET /users/:username (public), but we want email/phone.

                // Let's assume I will use the `id` from URL to fetch. 
                // If I haven't implemented `GET /users/:id` for admin, I should.
                // But for now, to save time, I will try to use `getPublicProfile` via username if I can 
                // BUT wait, `AdminUsersPage` links to `profile/[username]`. 
                // I should change the link to `/admin/users/[id]`.

                // Let's add the endpoint quickly in the next step if needed. 
                // For now, I'll write the frontend code expecting `GET /users/:id` (Admin privileged) exists or I will implement it.
                // Actually, I'll use `api.get('/users/admin/' + userId)` pattern or similar.

                // Wait, simply `api.get('/users/' + userId)` might conflict with `:username`.
                // Let's assume I will implement `GET /users/admin/:id` in backend.

                const data = await api.get<UserProfile>(`/users/admin/${userId}`);
                setUser(data);
            } catch (error) {
                console.error("Failed to fetch user", error);
                toast.error("Failed to load user details");
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchUser();
        }
    }, [userId]);

    const handleBanConfirm = async (durationDays: number | null, reason: string) => {
        if (!user) return;
        try {
            await api.post(`/users/${user.id}/ban`, { durationDays, reason });
            toast.success("User banned successfully");
            // Refresh
            const data = await api.get<UserProfile>(`/users/admin/${userId}`);
            setUser(data);
        } catch (error) {
            toast.error("Failed to ban user");
        }
    };

    const handleUnban = async () => {
        if (!user) return;
        try {
            await api.post(`/users/${user.id}/unban`);
            toast.success("User unbanned successfully");
            // Refresh
            const data = await api.get<UserProfile>(`/users/admin/${userId}`);
            setUser(data);
        } catch (error) {
            toast.error("Failed to unban user");
        } finally {
            setIsUnbanDialogOpen(false);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;
    if (!user) return <div className="p-8">User not found</div>;

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");

    return (
        <div className="p-8 space-y-6 max-w-5xl mx-auto">
            <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Users
            </Button>

            {/* Header / Overview */}
            <div className="flex flex-col md:flex-row gap-6 items-start">
                <Avatar className="h-32 w-32 border-4 border-white shadow-sm">
                    <AvatarImage src={api.getImageUrl(user.avatarUrl)} />
                    <AvatarFallback className="text-4xl">{user.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{fullName || user.username}</h1>
                            <p className="text-gray-500 text-lg">@{user.username}</p>
                        </div>
                        <div className="flex gap-2">
                            {user.isBanned ? (
                                <Button variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => setIsUnbanDialogOpen(true)}>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Unban User
                                </Button>
                            ) : (
                                <Button variant="destructive" onClick={() => setIsBanDialogOpen(true)}>
                                    <Ban className="h-4 w-4 mr-2" />
                                    Ban User
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-4 text-sm text-gray-600 mt-4">
                        <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {user.email}
                        </div>
                        <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Joined {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                            <Shield className="h-4 w-4" />
                            {user.role}
                        </div>
                    </div>
                </div>
            </div>

            {/* Status & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Account Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {user.isBanned ? (
                            <div className="flex flex-col gap-2">
                                <Badge variant="destructive" className="w-fit text-base px-3 py-1">Banned</Badge>
                                {user.banReason && <p className="text-sm text-red-600 mt-1">Reason: {user.banReason}</p>}
                            </div>
                        ) : (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 text-base px-3 py-1">Active</Badge>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Warnings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <div className="text-2xl font-bold">{user.warningCount}</div>
                            {user.warningCount > 0 && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Total warnings issued</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Contact Info</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1">
                            <p className="text-sm">{user.phoneNumber || "-"}</p>
                            <p className="text-xs text-gray-500">Phone Number</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Dialogs */}
            <BanUserDialog
                isOpen={isBanDialogOpen}
                onClose={() => setIsBanDialogOpen(false)}
                onConfirm={handleBanConfirm}
                username={user.username}
            />

            <AlertDialog open={isUnbanDialogOpen} onOpenChange={setIsUnbanDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Unban User?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to unban <strong>{user.username}</strong>?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleUnban} className="bg-green-600 hover:bg-green-700">
                            Confirm Unban
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
