"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, FileText } from "lucide-react";

export function ConsentModal() {
  const { user, fetchUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Show modal if user is logged in, has phone number, but hasn't accepted terms
    if (user && user.phoneNumber && !user.acceptedTermsAt) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [user]);

  const handleAccept = async () => {
    if (!accepted) return;
    setLoading(true);
    try {
      await api.patch("/users/me/consent", {});
      await fetchUser(); // Refresh user data to update acceptedTermsAt
      setOpen(false);
    } catch (error) {
      console.error("Failed to accept terms", error);
    } finally {
      setLoading(false);
    }
  };

  // Prevent closing by clicking outside or escape
  const preventClose = (e: Event) => {
    e.preventDefault();
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={() => { }}>
      <DialogContent
        className="max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden"
        onPointerDownOutside={preventClose}
        onEscapeKeyDown={preventClose}
      >
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-primary">
              <Shield className="h-6 w-6" />
              Terms of Service and Privacy Policy
            </DialogTitle>
            <DialogDescription className="text-base text-gray-500 mt-2">
              To comply with the Personal Data Protection Act (PDPA) and international standards, please take a moment to read and accept the terms below to continue.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-gray-600 bg-white">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-50 rounded-lg shrink-0">
                <FileText className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">
                  1. Personal Data Collection
                </h3>
                <p className="leading-relaxed">
                  We collect your personal information only as necessary and beneficial for using the website, such as your full name, email, and contact details, so you can safely create an account, post messages, and trade items.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-50 rounded-lg shrink-0">
                <FileText className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">
                  2. Purpose of Data Use
                </h3>
                <span className="leading-relaxed">
                  Your data will be used to:
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>Verify identity and create an account</li>
                    <li>Facilitate trading and communication between users</li>
                    <li>Develop and improve system efficiency</li>
                    <li>Comply with relevant laws and regulations</li>
                  </ul>
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-50 rounded-lg shrink-0">
                <FileText className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">
                  3. Data Disclosure
                </h3>
                <p className="leading-relaxed">
                  We will not disclose your personal information to third parties unless we have your consent or as required by court order or relevant laws.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-50 rounded-lg shrink-0">
                <FileText className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">
                  4. Data Subject Rights
                </h3>
                <p className="leading-relaxed">
                  You have the right to request access, correction, deletion, or suspension of the use of your personal data at any time by contacting our Support channel or managing it through the profile settings page.
                </p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mt-4">
              <p className="text-xs text-gray-500">
                * By clicking &quot;Accept&quot;, you acknowledge that you have read, understood, and accept all the terms and conditions above, including our Privacy Policy.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50/50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={accepted}
                onCheckedChange={(checked) => setAccepted(checked as boolean)}
              />
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                I accept the terms and conditions
              </label>
            </div>
            <Button
              onClick={handleAccept}
              disabled={!accepted || loading}
              className="w-full sm:w-auto min-w-[150px]"
            >
              {loading ? "Processing..." : "Accept and Continue"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
