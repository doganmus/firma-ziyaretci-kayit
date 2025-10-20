import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterVehicleLogsAddFields1706716800003 implements MigrationInterface {
  name = 'AlterVehicleLogsAddFields1706716800003'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "vehicle_logs" ADD COLUMN IF NOT EXISTS "district" varchar(100)`);
    await queryRunner.query(`ALTER TABLE "vehicle_logs" ADD COLUMN IF NOT EXISTS "vehicle_type" varchar(20)`);
    await queryRunner.query(`ALTER TABLE "vehicle_logs" ADD COLUMN IF NOT EXISTS "note" text`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_vehicle_logs_district" ON "vehicle_logs" ("district")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_vehicle_logs_vehicle_type" ON "vehicle_logs" ("vehicle_type")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_vehicle_logs_district"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_vehicle_logs_vehicle_type"`);
    await queryRunner.query(`ALTER TABLE "vehicle_logs" DROP COLUMN IF EXISTS "district"`);
    await queryRunner.query(`ALTER TABLE "vehicle_logs" DROP COLUMN IF EXISTS "vehicle_type"`);
    await queryRunner.query(`ALTER TABLE "vehicle_logs" DROP COLUMN IF EXISTS "note"`);
  }
}


