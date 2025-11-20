import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveLoadStatusFromVehicleEvents1706716800006 implements MigrationInterface {
  name = 'RemoveLoadStatusFromVehicleEvents1706716800006'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "vehicle_events"
      DROP COLUMN IF EXISTS "load_status"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "vehicle_events"
      ADD COLUMN "load_status" varchar(10) NULL
    `);
  }
}

