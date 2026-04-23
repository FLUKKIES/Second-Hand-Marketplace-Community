"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, User as UserIcon, AlertCircle, Info, Check, X } from "lucide-react";
import { AuthNavbar } from "@/components/common/AuthNavbar";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export default function AddPhonePage() {
    const router = useRouter();
    const { user, login, loading, fetchUser } = useAuth();

    // Form state
    const [phoneNumber, setPhoneNumber] = useState("");
    const [username, setUsername] = useState("");

    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [showHints, setShowHints] = useState<Record<string, boolean>>({});

    // Fetch current user details on mount to pre-fill username
    useEffect(() => {
        if (user) {
            setUsername(user.username || "");
            if (user.phoneNumber) setPhoneNumber(user.phoneNumber);
        } else {
            fetchUser();
        }
    }, [user, fetchUser]);

    const handleFocus = (field: string) => {
        setShowHints({ ...showHints, [field]: true });
    };

    const handleBlur = (field: string) => {
        setShowHints({ ...showHints, [field]: false });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setFieldErrors({});
        setIsLoading(true);

        const errors: Record<string, string> = {};

        // Basic validation
        if (!phoneNumber || phoneNumber.length < 9) {
            errors.phoneNumber = "Please enter a valid phone number";
        }

        if (!username || username.length < 3) {
            errors.username = "Username must be at least 3 characters";
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setIsLoading(false);
            return;
        }

        try {
            await api.patch("/users/me", {
                phoneNumber,
                username
            });
            // Refresh user context and redirect
            await login();
        } catch (err: any) {
            console.error("Failed to update profile", err);
            const msg = getErrorMessage(err);

            // Handle specific errors
            if (msg.includes("Credentials taken") || msg.includes("P2002")) {
                // Try to guess which field caused the error based on the message, 
                // but Prisma error messages can be generic for P2002.
                // We'll set a general error and highlight both fields if ambiguous,
                // or just set a general message.
                setError("This username or phone number is already associated with another account.");
                setFieldErrors({
                    username: "This username may be taken",
                    phoneNumber: "This phone number may be in use"
                });
            } else {
                setError(msg || "Failed to update profile. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            {/* <AuthNavbar /> */}
            <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="flex justify-center text-indigo-600 space-x-2">
                        <UserIcon size={32} />
                        <Phone size={32} />
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Complete your Profile
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Please set your username and phone number to continue.
                    </p>
                </div>

                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow-xl sm:rounded-xl sm:px-10 border border-gray-100">
                        <form className="space-y-6" onSubmit={handleSubmit}>

                            {/* Username */}
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                    Username
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <UserIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <Input
                                        id="username"
                                        name="username"
                                        type="text"
                                        autoComplete="username"
                                        required
                                        value={username}
                                        onChange={(e) => {
                                            setUsername(e.target.value);
                                            if (fieldErrors.username) setFieldErrors({ ...fieldErrors, username: "" });
                                        }}
                                        onFocus={() => handleFocus("username")}
                                        onBlur={() => handleBlur("username")}
                                        className={cn(
                                            "pl-10 block w-full sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500",
                                            fieldErrors.username && "border-red-500 focus:ring-red-500"
                                        )}
                                        placeholder="username"
                                    />
                                </div>
                                {showHints.username && (
                                    <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                                        <Info size={12} />
                                        Used for your profile URL and mentions
                                    </p>
                                )}
                                {fieldErrors.username && (
                                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                                        <AlertCircle size={12} />
                                        {fieldErrors.username}
                                    </p>
                                )}
                            </div>

                            {/* Phone Number */}
                            <div>
                                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                                    Phone Number
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Phone className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <Input
                                        id="phoneNumber"
                                        name="phoneNumber"
                                        type="tel"
                                        autoComplete="tel"
                                        required
                                        value={phoneNumber}
                                        onChange={(e) => {
                                            setPhoneNumber(e.target.value);
                                            if (fieldErrors.phoneNumber) setFieldErrors({ ...fieldErrors, phoneNumber: "" });
                                        }}
                                        onFocus={() => handleFocus("phoneNumber")}
                                        onBlur={() => handleBlur("phoneNumber")}
                                        className={cn(
                                            "pl-10 block w-full sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500",
                                            fieldErrors.phoneNumber && "border-red-500 focus:ring-red-500"
                                        )}
                                        placeholder="0812345678"
                                    />
                                </div>
                                {showHints.phoneNumber && (
                                    <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                                        <Info size={12} />
                                        For order notifications and account security
                                    </p>
                                )}
                                {fieldErrors.phoneNumber && (
                                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                                        <AlertCircle size={12} />
                                        {fieldErrors.phoneNumber}
                                    </p>
                                )}
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="rounded-md bg-red-50 border border-red-200 p-3">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                                        <p className="text-sm text-red-800">{error}</p>
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div>
                                <Button
                                    type="submit"
                                    disabled={loading || isLoading}
                                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Saving...
                                        </div>
                                    ) : (
                                        "Save & Continue"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
