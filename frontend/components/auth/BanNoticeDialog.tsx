"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertOctagon } from "lucide-react";

interface BanNoticeDialogProps {
    isOpen: boolean;
    onClose: () => void;
    reason?: string;
    expiresAt?: string;
}

export function BanNoticeDialog({ isOpen, onClose, reason, expiresAt }: BanNoticeDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <AlertOctagon className="w-6 h-6 text-red-600" />
                    </div>
                    <DialogTitle className="text-center text-xl">Account Suspended</DialogTitle>
                    <DialogDescription className="text-center">
                        Your account has been suspended due to a violation of our community guidelines.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {reason && (
                        <div className="bg-gray-50 p-3 rounded-md text-sm border border-gray-100">
                            <span className="font-semibold text-gray-700 block mb-1">Reason:</span>
                            <span className="text-gray-600">{reason}</span>
                        </div>
                    )}

                    {expiresAt && (
                        <div className="bg-gray-50 p-3 rounded-md text-sm border border-gray-100">
                            <span className="font-semibold text-gray-700 block mb-1">Ban Expires:</span>
                            <span className="text-gray-600">
                                {new Date(expiresAt).toLocaleString()}
                            </span>
                        </div>
                    )}

                    {!expiresAt && (
                        <div className="bg-red-50 p-3 rounded-md text-sm border border-red-100 text-red-700">
                            <span className="font-semibold block mb-1">Permanent Ban</span>
                            Your account has been permanently suspended.
                        </div>
                    )}
                </div>

                <div className="flex justify-center mt-4">
                    <Button onClick={onClose} className="w-full">
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
