import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn, Check } from 'typeorm';

// Vehicle log table for vehicle-only entries (no person fields)
@Entity('vehicle_logs')
@Check(
  'vehicle_plate_format_vehicle_logs',
  // TR plate format (normalized, no spaces)
  "plate ~ '^(0[1-9]|[1-7][0-9]|80|81)(?:[A-Z][0-9]{4,5}|[A-Z]{2}[0-9]{3,4}|[A-Z]{3}[0-9]{2,3})$'",
)
@Check('exit_after_entry_vehicle_logs', '(exit_at IS NULL) OR (exit_at >= entry_at)')
export class VehicleLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'timestamptz' })
  @Index()
  entry_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  exit_at: Date | null;

  @Column({ type: 'varchar', length: 20 })
  @Index()
  plate: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @Index()
  district: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  @Index()
  vehicle_type: string | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}


