import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

// Stores brand display name or a logo URL for the application header
@Entity({ name: 'settings' })
export class Setting {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'brand_name', type: 'varchar', length: 120, nullable: true })
  brandName!: string | null;

  @Column({ name: 'brand_logo_url', type: 'text', nullable: true })
  brandLogoUrl!: string | null;

  @Column({ name: 'maintenance_mode', type: 'boolean', default: false })
  maintenanceMode!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}


