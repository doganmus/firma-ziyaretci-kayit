import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVehicleEvents1706716800004 implements MigrationInterface {
  name = 'CreateVehicleEvents1706716800004'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "vehicle_events" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "date" date NOT NULL,
        "at" timestamptz NOT NULL,
        "plate" varchar(20) NOT NULL,
        "action" varchar(10) NOT NULL,
        "district" varchar(100),
        "vehicle_type" varchar(20),
        "note" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicle_events"
      ADD CONSTRAINT vehicle_plate_format_vehicle_events
      CHECK (plate ~ '^(0[1-9]|[1-7][0-9]|80|81)(?:[A-Z][0-9]{4,5}|[A-Z]{2}[0-9]{3,4}|[A-Z]{3}[0-9]{2,3})$')
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_vehicle_events_plate" ON "vehicle_events" ("plate")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_vehicle_events_date" ON "vehicle_events" ("date")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_vehicle_events_at" ON "vehicle_events" ("at")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_vehicle_events_action" ON "vehicle_events" ("action")`);

    // Backfill from vehicle_logs (if table exists)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicle_logs') THEN
          INSERT INTO vehicle_events (date, at, plate, action, district, vehicle_type, note)
          SELECT entry_at::date AS date, entry_at AS at, plate, 'ENTRY' AS action, district, vehicle_type, note
          FROM vehicle_logs;

          INSERT INTO vehicle_events (date, at, plate, action, district, vehicle_type, note)
          SELECT exit_at::date AS date, exit_at AS at, plate, 'EXIT' AS action, district, vehicle_type, note
          FROM vehicle_logs
          WHERE exit_at IS NOT NULL;
        END IF;
      END$$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "vehicle_events"`);
  }
}


