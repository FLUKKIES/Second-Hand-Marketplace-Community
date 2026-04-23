"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface BanUserDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (durationDays: number | null, reason: string) => Promise<void>;
    username: string;
}

export function BanUserDialog({ isOpen, onClose, onConfirm, username }: BanUserDialogProps) {
    const [banType, setBanType] = useState<string>("TEMP");
    const [duration, setDuration] = useState<string>("3");
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        try {
            const durationDays = banType === "PERM" ? null : parseInt(duration);
            await onConfirm(durationDays, reason || "Violation of community guidelines");
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Ban User: {username}</DialogTitle>
                    <DialogDescription>
                        Select ban duration and provide a reason. This action will suspend the user's account.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Ban Type</Label>
                        <Select value={banType} onValueChange={setBanType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="TEMP">Temporary Ban</SelectItem>
                                <SelectItem value="PERM">Permanent Ban</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {banType === "TEMP" && (
                        <div className="space-y-2">
                            <Label>Duration (Days)</Label>
                            <Select value={duration} onValueChange={setDuration}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">1 Day</SelectItem>
                                    <SelectItem value="3">3 Days</SelectItem>
                                    <SelectItem value="7">7 Days</SelectItem>
                                    <SelectItem value="30">30 Days</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Reason</Label>
                        <Textarea
                            id="reason"
                            placeholder="e.g. Repeated spamming, offensive behavior..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
                        {loading ? "Banning..." : "Confirm Ban"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
