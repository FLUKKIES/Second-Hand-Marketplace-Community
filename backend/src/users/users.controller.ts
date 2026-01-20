import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { AuthGuard } from "@nestjs/passport";
import { GetUser } from "src/common/auth/decorator/get-user.decorator";
import { UpdateUserDto } from "./dto/update-user.dto";

@Controller("users")
export class UsersController {
    constructor(
        private readonly usersService: UsersService
    ) { }

    // ============================
    // Private Routes (ต้อง Login)
    // ============================

    @UseGuards(AuthGuard('jwt'))
    @Get('me')
    getMe(@GetUser('userId') userId: string) {
        return this.usersService.getMe(userId)
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch('me')
    updateMe(
        @GetUser('userId') userId: string,
        @Body() dto: UpdateUserDto,
    ) {
        return this.usersService.updateMe(userId, dto);
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch('me/consent')
    acceptTerms(@GetUser('userId') userId: string) {
        return this.usersService.acceptTerms(userId);
    }

    // ============================
    // Public Routes (ใครก็ดูได้)
    // ============================

    @Get(':username')
    getProfile(@Param('username') username: string) {
        return this.usersService.getPublicProfile(username);
    }
}
