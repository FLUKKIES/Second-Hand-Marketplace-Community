import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportActionDto } from './dto/report-action.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/auth/guards/roles.guard';
import { Roles } from '../common/auth/decorator/roles.decorator';
import { Role } from '@prisma/client';

@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @UseGuards(AuthGuard('jwt'))
    @Post()
    create(@Request() req, @Body() createReportDto: CreateReportDto) {
        return this.reportsService.create(req.user.userId, createReportDto);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.ADMIN)
    @Get()
    findAll(@Query('username') username?: string) {
        return this.reportsService.findAll(username);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.ADMIN)
    @Patch(':id/action')
    takeAction(@Param('id') id: string, @Body() actionDto: ReportActionDto) {
        return this.reportsService.takeAction(id, actionDto);
    }
}
