import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVehicleStatusAndNullableEntryAt1735497600000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop existing check constraint
        await queryRunner.query(`
            ALTER TABLE vehicle_records DROP CONSTRAINT IF EXISTS exit_after_entry_vehicle_records
        `);

        // Make entry_at nullable
        await queryRunner.query(`
            ALTER TABLE vehicle_records ALTER COLUMN entry_at DROP NOT NULL
        `);

        // Make date nullable
        await queryRunner.query(`
            ALTER TABLE vehicle_records ALTER COLUMN date DROP NOT NULL
        `);

        // Add vehicle_status column
        await queryRunner.query(`
            ALTER TABLE vehicle_records ADD COLUMN IF NOT EXISTS vehicle_status VARCHAR(10) NULL
        `);

        // Add new check constraint that allows null entry_at
        await queryRunner.query(`
            ALTER TABLE vehicle_records ADD CONSTRAINT exit_after_entry_vehicle_records 
            CHECK (exit_at IS NULL OR entry_at IS NULL OR exit_at > entry_at)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop new check constraint
        await queryRunner.query(`
            ALTER TABLE vehicle_records DROP CONSTRAINT IF EXISTS exit_after_entry_vehicle_records
        `);

        // Remove vehicle_status column
        await queryRunner.query(`
            ALTER TABLE vehicle_records DROP COLUMN IF EXISTS vehicle_status
        `);

        // Make date NOT NULL (only if all values are non-null)
        await queryRunner.query(`
            UPDATE vehicle_records SET date = COALESCE(date, CURRENT_DATE) WHERE date IS NULL
        `);
        await queryRunner.query(`
            ALTER TABLE vehicle_records ALTER COLUMN date SET NOT NULL
        `);

        // Make entry_at NOT NULL (only if all values are non-null)
        await queryRunner.query(`
            UPDATE vehicle_records SET entry_at = COALESCE(entry_at, exit_at, NOW()) WHERE entry_at IS NULL
        `);
        await queryRunner.query(`
            ALTER TABLE vehicle_records ALTER COLUMN entry_at SET NOT NULL
        `);

        // Restore original check constraint
        await queryRunner.query(`
            ALTER TABLE vehicle_records ADD CONSTRAINT exit_after_entry_vehicle_records 
            CHECK (exit_at IS NULL OR exit_at > entry_at)
        `);
    }
}
