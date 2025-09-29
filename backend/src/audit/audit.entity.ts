import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity({ name: 'audit_logs' })
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  @Index()
  createdAt!: Date;

  @Column({ type: 'varchar', length: 50 })
  method!: string;

  @Column({ type: 'text' })
  @Index()
  path!: string;

  @Column({ type: 'int', name: 'status_code' })
  statusCode!: number;

  @Column({ type: 'int', name: 'duration_ms' })
  durationMs!: number;

  @Column({ type: 'varchar', length: 80, name: 'user_id', nullable: true })
  @Index()
  userId!: string | null;

  @Column({ type: 'varchar', length: 150, name: 'user_email', nullable: true })
  @Index()
  userEmail!: string | null;

  @Column({ type: 'varchar', length: 30, name: 'user_role', nullable: true })
  userRole!: string | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip!: string | null;

  @Column({ type: 'text', name: 'user_agent', nullable: true })
  userAgent!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  action!: string | null;

  @Column({ type: 'varchar', length: 100, name: 'resource_id', nullable: true })
  resourceId!: string | null;

  @Column({ type: 'json', nullable: true })
  payload!: Record<string, unknown> | null;
}


