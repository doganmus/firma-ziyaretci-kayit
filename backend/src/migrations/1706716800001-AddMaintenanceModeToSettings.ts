import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMaintenanceModeToSettings1706716800001 implements MigrationInterface {
    name = 'AddMaintenanceModeToSettings1706716800001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "maintenance_mode" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN IF EXISTS "maintenance_mode"`);
    }

}


