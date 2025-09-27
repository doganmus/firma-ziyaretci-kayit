import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './settings.entity';

@Injectable()
export class SettingsService {
  constructor(@InjectRepository(Setting) private readonly repo: Repository<Setting>) {}

  // Returns the single settings record (or empty defaults)
  async get(): Promise<{ brandName: string | null; brandLogoUrl: string | null }> {
    const s = await this.repo.find({ order: { createdAt: 'ASC' }, take: 1 });
    const first = s[0];
    return {
      brandName: first?.brandName ?? null,
      brandLogoUrl: first?.brandLogoUrl ?? null,
    };
  }

  // Creates or updates settings with provided fields only
  async update(data: { brandName?: string | null; brandLogoUrl?: string | null }) {
    const s = await this.repo.find({ order: { createdAt: 'ASC' }, take: 1 });
    let entity = s[0];
    if (!entity) {
      entity = this.repo.create({ brandName: null, brandLogoUrl: null });
    }
    if (Object.prototype.hasOwnProperty.call(data, 'brandName')) entity.brandName = data.brandName ?? null;
    if (Object.prototype.hasOwnProperty.call(data, 'brandLogoUrl')) entity.brandLogoUrl = data.brandLogoUrl ?? null;
    const saved = await this.repo.save(entity);
    return { brandName: saved.brandName, brandLogoUrl: saved.brandLogoUrl };
  }
}


