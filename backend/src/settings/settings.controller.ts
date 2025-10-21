import { Body, Controller, Get, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { SettingsService } from './settings.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import * as multer from 'multer';
import * as FileType from 'file-type';
import sharp from 'sharp';
import { UpdateSettingsDto } from './dto/update-settings.dto';

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
  update(@Body() body: UpdateSettingsDto) {
    return this.settings.update(body);
  }

  // Uploads a PNG logo file to /uploads and returns its URL
  @Post('logo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
      limits: { fileSize: 2 * 1024 * 1024 },
    })
  )
  async uploadLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file || !file.buffer) throw new Error('Dosya zorunludur');
    const type = await FileType.fileTypeFromBuffer(file.buffer);
    if (!type || type.mime !== 'image/png') {
      throw new Error('Yalnız PNG desteklenir');
    }
    const dir = join(process.cwd(), 'uploads');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = `logo-${unique}.png`;
    // Re-encode to PNG to strip metadata and ensure safe content
    const encoded = await sharp(file.buffer).png({ compressionLevel: 9 }).toBuffer();
    writeFileSync(join(dir, filename), encoded);
    const url = `/uploads/${filename}`;
    return { url };
  }
}


