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
              เงื่อนไขการให้บริการและนโยบายความเป็นส่วนตัว
            </DialogTitle>
            <DialogDescription className="text-base text-gray-500 mt-2">
              เพื่อให้เป็นไปตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล (PDPA)
              และมาตรฐานสากล
              โปรดสละเวลาอ่านและยอมรับเงื่อนไขด้านล่างเพื่อดำเนินการต่อ
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
                  1. การเก็บรวบรวมข้อมูลส่วนบุคคล
                </h3>
                <p className="leading-relaxed">
                  เราจะเก็บรวบรวมข้อมูลส่วนบุคคลของท่านเท่าที่จำเป็นและเป็นประโยชน์ต่อการใช้งานเว็บไซต์
                  เช่น ชื่อ-นามสกุล, อีเมล (Email), และข้อมูลการติดต่อ
                  เพื่อให้ท่านสามารถสร้างบัญชีผู้ใช้ โพสต์ข้อความ
                  และซื้อขายสินค้าได้อย่างปลอดภัย
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-50 rounded-lg shrink-0">
                <FileText className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">
                  2. วัตถุประสงค์การใช้งานข้อมูล
                </h3>
                <span className="leading-relaxed">
                  ข้อมูลของท่านจะถูกนำไปใช้เพื่อ:
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>ยืนยันตัวตนและการสร้างบัญชี</li>
                    <li>
                      อำนวยความสะดวกในการซื้อขายและการสื่อสารระหว่างผู้ใช้
                    </li>
                    <li>พัฒนาและปรับปรุงประสิทธิภาพของระบบ</li>
                    <li>ปฏิบัติตามกฎหมายและข้อบังคับที่เกี่ยวข้อง</li>
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
                  3. การเปิดเผยข้อมูล
                </h3>
                <p className="leading-relaxed">
                  เราจะไม่เปิดเผยข้อมูลส่วนบุคคลของท่านแก่บุคคลภายนอก
                  เว้นแต่ได้รับความยินยอมจากท่าน หรือเป็นการปฏิบัติตามคำสั่งศาล
                  หรือกฎหมายที่เกี่ยวข้อง
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-50 rounded-lg shrink-0">
                <FileText className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">
                  4. สิทธิของเจ้าของข้อมูล
                </h3>
                <p className="leading-relaxed">
                  ท่านมีสิทธิในการขอเข้าถึง แก้ไข ลบ
                  หรือระงับการใช้ข้อมูลส่วนบุคคลของท่านได้ตลอดเวลา
                  โดยสามารถติดต่อผ่านช่องทาง Support ของเรา
                  หรือจัดการผ่านหน้าตั้งค่าโปรไฟล์
                </p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mt-4">
              <p className="text-xs text-gray-500">
                * การกด "ยอมรับ" หมายความว่าท่านได้อ่าน ทำความเข้าใจ
                และยอมรับข้อตกลงและเงื่อนไขข้างต้นทั้งหมด
                รวมถึงนโยบายความเป็นส่วนตัวของเรา
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
                ข้าพเจ้ายอมรับข้อกำหนดและเงื่อนไข
              </label>
            </div>
            <Button
              onClick={handleAccept}
              disabled={!accepted || loading}
              className="w-full sm:w-auto min-w-[150px]"
            >
              {loading ? "กำลังดำเนินการ..." : "ยอมรับและดำเนินการต่อ"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
