"use client";

import { useEffect, useState } from "react";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, Gavel, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Report {
    id: string;
    reporterId: string;
    targetId: string;
    targetType: "USER" | "POST" | "GROUP";
    reason: string;
    status: "PENDING" | "RESOLVED" | "DISMISSED";
    createdAt: string;
    reporter: {
        id: string;
        username: string;
        avatarUrl: string | null;
    };
}

export default function AdminReportsPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [keyword, setKeyword] = useState("");

    // Action Form State
    const [actionType, setActionType] = useState<string>("WARN");
    const [banDuration, setBanDuration] = useState<string>("3");
    const [adminNotes, setAdminNotes] = useState("");
    const [warningMessage, setWarningMessage] = useState("");

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async (search: string = "") => {
        try {
            setLoading(true);
            const data = await api.get<Report[]>(`/reports${search ? `?username=${search}` : ""}`);
            setReports(data);
        } catch (error) {
            toast.error("Failed to fetch reports");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchReports(keyword);
    };

    const handleOpenAction = (report: Report) => {
        setSelectedReport(report);
        setAdminNotes("");
        setWarningMessage("");
        setBanDuration("3");
        setActionType("WARN");
        setIsActionModalOpen(true);
    };

    const handleSubmitAction = async () => {
        if (!selectedReport) return;

        try {
            const payload: any = {
                action: actionType,
                adminNotes,
            };

            if (actionType === "WARN") {
                payload.warningMessage = warningMessage || "You have been warned for violating community guidelines.";
            } else if (actionType === "TEMP_BAN") {
                payload.banDurationDays = parseInt(banDuration);
            }

            await api.patch(`/reports/${selectedReport.id}/action`, payload);

            toast.success("Action taken successfully");
            setIsActionModalOpen(false);
            fetchReports(keyword); // Refresh list
        } catch (error) {
            toast.error("Failed to take action");
        }
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Report Management</h1>
            </div>

            <div className="flex items-center gap-4">
                <form onSubmit={handleSearch} className="flex-1 max-w-sm flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Search by reporter username..."
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
                            <TableHead>Reporter</TableHead>
                            <TableHead>Target</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reports.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-gray-500">
                                    No reports found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            reports.map((report) => (
                                <TableRow key={report.id}>
                                    <TableCell className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={api.getImageUrl(report.reporter.avatarUrl)} />
                                            <AvatarFallback>{report.reporter.username[0]}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">{report.reporter.username}</span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="mr-2">{report.targetType}</Badge>
                                        <span className="text-sm text-gray-500 font-mono">{report.targetId.substring(0, 8)}...</span>
                                    </TableCell>
                                    <TableCell className="max-w-[300px] truncate" title={report.reason}>
                                        {report.reason}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={report.status === "PENDING" ? "destructive" : "secondary"}>
                                            {report.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{new Date(report.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleOpenAction(report)}
                                            disabled={report.status !== "PENDING"}
                                        >
                                            <Gavel className="h-4 w-4 mr-1" />
                                            Resolve
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Take Action</DialogTitle>
                        <DialogDescription>
                            Decide how to handle this report. This action cannot be undone easily.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Action Type</Label>
                            <Select value={actionType} onValueChange={setActionType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="WARN">Send Warning</SelectItem>
                                    <SelectItem value="TEMP_BAN">Temporary Ban</SelectItem>
                                    <SelectItem value="PERMA_BAN">Permanent Ban</SelectItem>
                                    <SelectItem value="DISMISS">Dismiss Report</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {actionType === "WARN" && (
                            <div className="space-y-2">
                                <Label>Warning Message</Label>
                                <Input
                                    placeholder="e.g. Please stop spamming..."
                                    value={warningMessage}
                                    onChange={(e) => setWarningMessage(e.target.value)}
                                />
                            </div>
                        )}

                        {actionType === "TEMP_BAN" && (
                            <div className="space-y-2">
                                <Label>Duration (Days)</Label>
                                <Select value={banDuration} onValueChange={setBanDuration}>
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
                            <Label>Admin Notes</Label>
                            <Textarea
                                placeholder="Internal notes about this decision..."
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setIsActionModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmitAction}>Confirm Action</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
