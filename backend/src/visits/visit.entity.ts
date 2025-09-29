import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn, Check } from 'typeorm';

// Visit table with checks ensuring plate is present/valid only when a vehicle exists
@Entity('visits')
@Check('vehicle_check', '(has_vehicle = false AND vehicle_plate IS NULL) OR (has_vehicle = true AND vehicle_plate IS NOT NULL)')
@Check(
  'vehicle_plate_format',
  "(has_vehicle = false AND vehicle_plate IS NULL) OR (has_vehicle = true AND vehicle_plate ~ '^(0[1-9]|[1-7][0-9]|80|81)(?:[A-Z][0-9]{4,5}|[A-Z]{2}[0-9]{3,4}|[A-Z]{3}[0-9]{2,3})$')",
)
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
  @Index()
  visitor_full_name: string;

  @Column({ type: 'varchar', length: 150 })
  @Index()
  visited_person_full_name: string;

  @Column({ type: 'varchar', length: 150 })
  @Index()
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
