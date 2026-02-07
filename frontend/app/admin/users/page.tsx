"use client";

import { useEffect, useState, Suspense } from "react";
import { api } from "@/lib/api";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Search, Ban, CheckCircle, MoreHorizontal } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

interface User {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    role: "USER" | "ADMIN";
    avatarUrl: string | null;
    isBanned: boolean;
    banReason: string | null;
    warningCount: number;
}

import { BanUserDialog } from "@/components/admin/BanUserDialog";

function UserManagementContent() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const searchParams = useSearchParams();
    const router = useRouter();
    const search = searchParams.get("search") || "";
    const [keyword, setKeyword] = useState(search);

    // Ban Dialog State
    const [selectedUserToBan, setSelectedUserToBan] = useState<User | null>(null);
    const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);

    // Unban Dialog State
    const [userToUnban, setUserToUnban] = useState<User | null>(null);
    const [isUnbanDialogOpen, setIsUnbanDialogOpen] = useState(false);

    useEffect(() => {
        fetchUsers(search);
    }, [search]);

    const fetchUsers = async (query: string) => {
        // ... (existing fetchUsers logic)
        try {
            setLoading(true);
            const data = await api.get<User[]>(`/users/search?keyword=${query}`);
            setUsers(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.push(`/admin/users?search=${keyword}`);
    };

    const openBanDialog = (user: User) => {
        setSelectedUserToBan(user);
        setIsBanDialogOpen(true);
    };

    const handleBanConfirm = async (durationDays: number | null, reason: string) => {
        if (!selectedUserToBan) return;
        try {
            await api.post(`/users/${selectedUserToBan.id}/ban`, { durationDays, reason });
            toast.success("User banned successfully");
            fetchUsers(search);
        } catch (error) {
            toast.error("Failed to ban user");
        }
    };

    const confirmUnban = (user: User) => {
        setUserToUnban(user);
        setIsUnbanDialogOpen(true);
    };

    const handleUnban = async () => {
        if (!userToUnban) return;
        try {
            await api.post(`/users/${userToUnban.id}/unban`);
            toast.success("User unbanned successfully");
            fetchUsers(search);
        } catch (error) {
            toast.error("Failed to unban user");
        } finally {
            setIsUnbanDialogOpen(false);
            setUserToUnban(null);
        }
    };

    return (
        <div className="p-8 space-y-6">
            {/* ... (existing JSX for header, search, table) ... */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
            </div>

            <div className="flex items-center gap-4">
                <form onSubmit={handleSearch} className="flex-1 max-w-sm flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Search users..."
                            className="pl-8"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                        />
                    </div>
                    <Button type="submit">Search</Button>
                </form>
            </div>

            <div className="bg-white rounded-lg border shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Warnings</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-gray-500">
                                    No users found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={api.getImageUrl(user.avatarUrl)} />
                                            <AvatarFallback>{user.username[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{user.username}</span>
                                            <span className="text-xs text-gray-500">{user.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{user.role}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {user.isBanned ? (
                                            <div className="flex flex-col gap-1">
                                                <Badge variant="destructive">Banned</Badge>
                                                {user.banReason && (
                                                    <span className="text-[10px] text-gray-500 max-w-[150px] truncate" title={user.banReason}>
                                                        {user.banReason}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {user.warningCount > 0 && (
                                            <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                                                {user.warningCount} Warnings
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => router.push(`/admin/users/${user.id}`)}>
                                                    View Profile
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                {user.isBanned ? (
                                                    <DropdownMenuItem onClick={() => confirmUnban(user)} className="text-green-600">
                                                        <CheckCircle className="h-4 w-4 mr-2" />
                                                        Unban User
                                                    </DropdownMenuItem>
                                                ) : (

                                                    <DropdownMenuItem onClick={() => openBanDialog(user)} className="text-red-600">
                                                        <Ban className="h-4 w-4 mr-2" />
                                                        Ban User
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))

                        )}
                    </TableBody>
                </Table>
            </div>

            {
                selectedUserToBan && (
                    <BanUserDialog
                        isOpen={isBanDialogOpen}
                        onClose={() => setIsBanDialogOpen(false)}
                        onConfirm={handleBanConfirm}
                        username={selectedUserToBan.username}
                    />
                )
            }

            <AlertDialog open={isUnbanDialogOpen} onOpenChange={setIsUnbanDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Unban User?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to unban <strong>{userToUnban?.username}</strong>?
                            They will regain access to their account immediately.
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
        </div >
    );
}

export default function AdminUsersPage() {
    return (
        <Suspense fallback={<div className="p-8">Loading...</div>}>
            <UserManagementContent />
        </Suspense>
    );
}
