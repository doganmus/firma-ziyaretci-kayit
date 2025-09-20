import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'settings' })
export class Setting {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'brand_name', type: 'varchar', length: 120, nullable: true })
  brandName!: string | null;

  @Column({ name: 'brand_logo_url', type: 'varchar', length: 500, nullable: true })
  brandLogoUrl!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}


