import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLoadStatusToVehicleEvents1706716800005 implements MigrationInterface {
  name = 'AddLoadStatusToVehicleEvents1706716800005'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "vehicle_events"
      ADD COLUMN "load_status" varchar(10) NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "vehicle_events"
      DROP COLUMN "load_status"
    `);
  }
}

