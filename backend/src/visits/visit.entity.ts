import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn, Check } from 'typeorm';

@Entity('visits')
@Check('vehicle_check', '(has_vehicle = false AND vehicle_plate IS NULL) OR (has_vehicle = true AND vehicle_plate IS NOT NULL)')
export class Visit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'timestamptz' })
  @Index()
  entry_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  exit_at: Date | null;

  @Column({ type: 'varchar', length: 150 })
  visitor_full_name: string;

  @Column({ type: 'varchar', length: 150 })
  visited_person_full_name: string;

  @Column({ type: 'varchar', length: 150 })
  company_name: string;

  @Column({ type: 'boolean', default: false })
  has_vehicle: boolean;

  @Column({ type: 'varchar', length: 20, nullable: true })
  @Index()
  vehicle_plate: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
