import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn, Check } from 'typeorm';

export type VehicleEventAction = 'ENTRY' | 'EXIT';

@Entity('vehicle_events')
@Check(
  'vehicle_plate_format_vehicle_events',
  "plate ~ '^(0[1-9]|[1-7][0-9]|80|81)(?:[A-Z][0-9]{4,5}|[A-Z]{2}[0-9]{3,4}|[A-Z]{3}[0-9]{2,3})$'",
)
export class VehicleEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  @Index()
  date: string;

  @Column({ type: 'timestamptz' })
  @Index()
  at: Date;

  @Column({ type: 'varchar', length: 20 })
  @Index()
  plate: string;

  @Column({ type: 'varchar', length: 10 })
  @Index()
  action: VehicleEventAction;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @Index()
  district: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  @Index()
  vehicle_type: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  load_status: 'DOLU' | 'BOS' | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}


