import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVehicleLogs1706716800002 implements MigrationInterface {
  name = 'CreateVehicleLogs1706716800002'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "vehicle_logs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "date" date NOT NULL,
        "entry_at" timestamptz NOT NULL,
        "exit_at" timestamptz,
        "plate" varchar(20) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "vehicle_logs"
      ADD CONSTRAINT vehicle_plate_format_vehicle_logs
      CHECK (plate ~ '^(0[1-9]|[1-7][0-9]|80|81)(?:[A-Z][0-9]{4,5}|[A-Z]{2}[0-9]{3,4}|[A-Z]{3}[0-9]{2,3})$')
    `);
    await queryRunner.query(`
      ALTER TABLE "vehicle_logs"
      ADD CONSTRAINT exit_after_entry_vehicle_logs
      CHECK (exit_at IS NULL OR exit_at >= entry_at)
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_vehicle_logs_entry_at" ON "vehicle_logs" ("entry_at")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_vehicle_logs_plate" ON "vehicle_logs" ("plate")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "vehicle_logs"`);
  }
}


