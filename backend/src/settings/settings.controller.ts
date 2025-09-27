import { Body, Controller, Get, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { SettingsService } from './settings.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  // Returns brand settings (name or logo url)
  @Get()
  get() {
    return this.settings.get();
  }

  // Updates brand settings; only the provided fields are changed
  @Patch()
  update(@Body() body: { brandName?: string | null; brandLogoUrl?: string | null }) {
    return this.settings.update(body);
  }

  // Uploads a PNG logo file to /uploads and returns its URL
  @Post('logo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dir = join(process.cwd(), 'uploads')
          if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
          cb(null, dir)
        },
        filename: (_req, file, cb) => {
          const ext = (extname(file.originalname) || '.png').toLowerCase()
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
          cb(null, `logo-${unique}${ext}`)
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (file.mimetype !== 'image/png') {
          cb(new Error('Only PNG allowed'), false)
        } else {
          cb(null, true)
        }
      },
      limits: { fileSize: 2 * 1024 * 1024 },
    })
  )
  uploadLogo(@UploadedFile() file: Express.Multer.File) {
    const url = `/uploads/${file.filename}`
    return { url }
  }
}


