import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUser = createParamDecorator(
    (data: string | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();

        // Handle null user (from OptionalJwtAuthGuard)
        if (!request.user) {
            return undefined;
        }

        // ถ้าระบุ field เช่น @GetUser('email') ก็คืนค่าเฉพาะ email
        if (data) {
            return request.user[data];
        }
        // ถ้าไม่ระบุ ก็คืนค่า user ทั้งก้อน (userId, email, role)
        return request.user;
    },
);
