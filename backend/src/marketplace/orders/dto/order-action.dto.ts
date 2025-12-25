import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

// 1. ผู้ซื้อแจ้งโอนเงิน
export class ConfirmPaymentDto {
    @IsString()
    @IsNotEmpty()
    slipUrl: string; // URL สลิปที่ได้จาก Upload Module
}

// (Optional) ค่าคงที่รายชื่อธนาคาร เพื่อให้ Frontend เอาไปทำ Dropdown
export const BANK_LIST = [
    { code: 'KBANK', name: 'Kasikorn Bank', icon: 'kbank.png' },
    { code: 'SCB', name: 'Siam Commercial Bank', icon: 'scb.png' },
    { code: 'BBL', name: 'Bangkok Bank', icon: 'bbl.png' },
    { code: 'KTB', name: 'Krung Thai Bank', icon: 'ktb.png' },
    { code: 'TTB', name: 'TMBThanachart Bank', icon: 'ttb.png' },
    // ... เพิ่มตามต้องการ
];
