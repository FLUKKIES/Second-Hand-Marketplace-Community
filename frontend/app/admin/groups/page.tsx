"use client";

import { useEffect, useState } from "react";
import { api, getErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
    Trash2,
    Search,
    Loader2,
    RefreshCw,
    PenSquare,
    Plus,
    Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Group {
    id: string;
    name: string;
    description?: string;
    imageUrl?: string;
    backgroundUrl?: string;
    categoryId: number;
    category?: {
        id: number;
        name: string;
    };
    _count?: {
        members: number;
        posts: number;
    };
}

interface Category {
    id: number;
    name: string;
    slug: string;
}

export default function AdminGroupsPage() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        categoryId: "",
        imageUrl: "",
        backgroundUrl: "",
    });

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const [bgImageFile, setBgImageFile] = useState<File | null>(null);
    const [bgImagePreview, setBgImagePreview] = useState<string | null>(null);

    const fetchGroups = async () => {
        setIsLoading(true);
        try {
            const data = await api.get("/groups");
            setGroups(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error("Failed to fetch groups");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const data = await api.get("/categories");
            setCategories(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        }
    };

    useEffect(() => {
        fetchGroups();
        fetchCategories();
    }, []);

    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            categoryId: "",
            imageUrl: "",
            backgroundUrl: "",
        });
        setImageFile(null);
        setImagePreview(null);
        setBgImageFile(null);
        setBgImagePreview(null);
        setEditingGroup(null);
    };

    const handleOpenDialog = (group?: Group) => {
        if (group) {
            setEditingGroup(group);
            setFormData({
                name: group.name,
                description: group.description || "",
                categoryId: group.categoryId.toString(),
                imageUrl: group.imageUrl || "",
                backgroundUrl: group.backgroundUrl || "",
            });
            setImagePreview(api.getImageUrl(group.imageUrl) || null);
            setBgImagePreview(api.getImageUrl(group.backgroundUrl) || null);
        } else {
            resetForm();
        }
        setIsDialogOpen(true);
    };

    const handleImageChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        type: "profile" | "cover",
    ) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Validate File Type
            if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
                toast.error("Please upload a valid image file (JPG, PNG)");
                return;
            }

            // Validate File Size (Max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                toast.error("Image size must be less than 10MB");
                return;
            }

            if (type === "profile") {
                setImageFile(file);
                setImagePreview(URL.createObjectURL(file));
            } else {
                setBgImageFile(file);
                setBgImagePreview(URL.createObjectURL(file));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            let imageUrl = formData.imageUrl;
            let backgroundUrl = formData.backgroundUrl;

            // Upload profile image if selected
            if (imageFile) {
                imageUrl = await api.uploadImage(imageFile, "group/profile");
            }

            // Upload cover image if selected
            if (bgImageFile) {
                backgroundUrl = await api.uploadImage(bgImageFile, "group/cover");
            }

            const payload = {
                name: formData.name,
                description: formData.description || undefined,
                categoryId: parseInt(formData.categoryId),
                imageUrl,
                backgroundUrl,
            };

            if (editingGroup) {
                await api.patch(`/groups/${editingGroup.id}`, payload);
                toast.success("Group updated successfully");
            } else {
                await api.post("/groups", payload);
                toast.success("Group created successfully");
            }

            setIsDialogOpen(false);
            resetForm();
            fetchGroups();
        } catch (error) {
            console.error(error);
            toast.error("Failed to save group");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            setDeletingId(id);
            await api.delete(`/groups/${id}`);
            toast.success("Group deleted successfully");
            setGroups((prev) => prev.filter((g) => g.id !== id));
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setDeletingId(null);
        }
    };

    const filteredGroups = groups.filter(
        (g) =>
            g.name.toLowerCase().includes(search.toLowerCase()) ||
            g.description?.toLowerCase().includes(search.toLowerCase()),
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manage Groups</h1>
                    <p className="text-gray-500">
                        Create, edit, and manage community groups
                    </p>
                </div>
                <Button
                    onClick={() => handleOpenDialog()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
                >
                    <Plus size={20} className="mr-2" />
                    New Group
                </Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            size={18}
                        />
                        <Input
                            placeholder="Search groups..."
                            className="pl-10"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="text-sm text-gray-500">Total: {groups.length}</div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Image</TableHead>
                                <TableHead>Group Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Members</TableHead>
                                <TableHead>Posts</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredGroups.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="h-32 text-center text-gray-500"
                                    >
                                        No groups found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredGroups.map((group) => (
                                    <TableRow key={group.id}>
                                        <TableCell>
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
                                                {group.imageUrl ? (
                                                    <img
                                                        src={api.getImageUrl(group.imageUrl)}
                                                        alt={group.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-xs text-gray-400">No Img</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium text-gray-900">
                                                    {group.name}
                                                </div>
                                                <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                                    {group.description}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                {group.category?.name || "Uncategorized"}
                                            </span>
                                        </TableCell>
                                        <TableCell>{group._count?.members || 0}</TableCell>
                                        <TableCell>{group._count?.posts || 0}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleOpenDialog(group)}
                                                    className="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                                                >
                                                    <PenSquare size={16} />
                                                </Button>

                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                                                        >
                                                            {deletingId === group.id ? (
                                                                <Loader2 size={16} className="animate-spin" />
                                                            ) : (
                                                                <Trash2 size={16} />
                                                            )}
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Group?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Are you sure you want to delete{" "}
                                                                <strong>{group.name}</strong>? This action
                                                                cannot be undone and will delete all posts
                                                                within this group.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDelete(group.id)}
                                                                className="bg-red-600 hover:bg-red-700 text-white"
                                                            >
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingGroup ? "Edit Group" : "New Group"}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Profile Image (Logo)</Label>
                                <div className="flex flex-col gap-3">
                                    <div className="w-24 h-24 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden relative group">
                                        {imagePreview ? (
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <Upload className="text-gray-400" size={24} />
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={(e) => handleImageChange(e, "profile")}
                                        />
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Recommended: Square (1:1)
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Cover Image (Background)</Label>
                                <div className="flex flex-col gap-3">
                                    <div className="w-full h-24 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden relative group">
                                        {bgImagePreview ? (
                                            <img
                                                src={bgImagePreview}
                                                alt="Cover Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <Upload className="text-gray-400" size={24} />
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={(e) => handleImageChange(e, "cover")}
                                        />
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Recommended: Landscape (16:9)
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Group Name</Label>
                            <Input
                                placeholder="e.g. Buy & Sell Electronics"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                                }
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                placeholder="Describe what this group is about..."
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        description: e.target.value,
                                    }))
                                }
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select
                                value={formData.categoryId}
                                onValueChange={(value) =>
                                    setFormData((prev) => ({ ...prev, categoryId: value }))
                                }
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id.toString()}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                {isSubmitting && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {editingGroup ? "Save Changes" : "Create Group"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
