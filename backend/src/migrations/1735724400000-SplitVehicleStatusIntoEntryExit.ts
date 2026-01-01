import { MigrationInterface, QueryRunner } from 'typeorm';

export class SplitVehicleStatusIntoEntryExit1735724400000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add entry_vehicle_status column
        await queryRunner.query(`
            ALTER TABLE vehicle_records ADD COLUMN IF NOT EXISTS entry_vehicle_status VARCHAR(10) NULL
        `);

        // Add exit_vehicle_status column
        await queryRunner.query(`
            ALTER TABLE vehicle_records ADD COLUMN IF NOT EXISTS exit_vehicle_status VARCHAR(10) NULL
        `);

        // Migrate existing vehicle_status data to entry_vehicle_status (Option A)
        await queryRunner.query(`
            UPDATE vehicle_records SET entry_vehicle_status = vehicle_status WHERE vehicle_status IS NOT NULL
        `);

        // Drop old vehicle_status column
        await queryRunner.query(`
            ALTER TABLE vehicle_records DROP COLUMN IF EXISTS vehicle_status
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Re-add vehicle_status column
        await queryRunner.query(`
            ALTER TABLE vehicle_records ADD COLUMN IF NOT EXISTS vehicle_status VARCHAR(10) NULL
        `);

        // Migrate entry_vehicle_status back to vehicle_status
        await queryRunner.query(`
            UPDATE vehicle_records SET vehicle_status = entry_vehicle_status WHERE entry_vehicle_status IS NOT NULL
        `);

        // Drop entry_vehicle_status column
        await queryRunner.query(`
            ALTER TABLE vehicle_records DROP COLUMN IF EXISTS entry_vehicle_status
        `);

        // Drop exit_vehicle_status column
        await queryRunner.query(`
            ALTER TABLE vehicle_records DROP COLUMN IF EXISTS exit_vehicle_status
        `);
    }
}
