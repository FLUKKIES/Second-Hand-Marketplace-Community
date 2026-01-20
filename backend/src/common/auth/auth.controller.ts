import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService
    ) { }

    @Post('signup')
    async signup(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
        const result = await this.authService.register(dto);
        this.setCookie(res, result.access_token);
        return result;
    }

    @Post('signin')
    async signin(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
        const result = await this.authService.login(dto);
        this.setCookie(res, result.access_token);
        return result;
    }

    @Post('logout')
    logout(@Res({ passthrough: true }) res: Response) {
        res.clearCookie('access_token');
        return { message: 'Logged out' };
    }

    // --- Google OAuth Endpoints ---

    @Get('google')
    @UseGuards(AuthGuard('google'))
    async googleAuth(@Req() req) { }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleAuthRedirect(@Req() req, @Res() res: Response) {
        const result = await this.authService.googleLogin(req);

        // Check if result has access_token (successful login)
        if (result && typeof result === 'object' && 'access_token' in result) {
            this.setCookie(res, (result as any).access_token);
            // Redirect to frontend (cookie will be set)
            return res.redirect(`${process.env.FRONTEND_URL}/auth/google/callback`);
        } else {
            // Redirect to login with error
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=Google_Login_Failed`);
        }
    }

    private setCookie(res: Response, token: string) {
        res.cookie('access_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000, // 1 day
        });
    }
}
