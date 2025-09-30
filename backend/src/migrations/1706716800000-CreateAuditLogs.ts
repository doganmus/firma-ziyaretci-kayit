import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLogs1706716800000 implements MigrationInterface {
  name = 'CreateAuditLogs1706716800000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "method" varchar(50) NOT NULL,
        "path" text NOT NULL,
        "status_code" int NOT NULL,
        "duration_ms" int NOT NULL,
        "user_id" varchar(80),
        "user_email" varchar(150),
        "user_role" varchar(30),
        "ip" varchar(45),
        "user_agent" text,
        "action" varchar(200),
        "resource_id" varchar(100),
        "payload" json
      )
    `)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_created_at" ON "audit_logs" ("created_at")`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_user_id" ON "audit_logs" ("user_id")`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_user_email" ON "audit_logs" ("user_email")`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`)
  }
}


