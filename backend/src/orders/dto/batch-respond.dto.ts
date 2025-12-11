import { IsEnum, IsArray, IsUUID, ArrayMinSize } from 'class-validator';

export enum ActionType {
    APPROVE = 'APPROVE',
    REJECT = 'REJECT',
}

export class BatchRespondDto {
    @IsEnum(ActionType)
    action: ActionType;

    @IsArray()
    @ArrayMinSize(1) // ต้องเลือกมาอย่างน้อย 1 รายการ
    @IsUUID('4', { each: true }) // ตรวจสอบว่าทุกตัวใน Array เป็น UUID
    requestIds: string[]; // ส่งมาเป็น Array ["id1", "id2"]
}