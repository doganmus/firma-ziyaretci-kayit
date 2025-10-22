import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVisits1706716799997 implements MigrationInterface {
  name = 'CreateVisits1706716799997'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "visits" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "date" date NOT NULL,
        "entry_at" timestamptz NOT NULL,
        "exit_at" timestamptz,
        "visitor_full_name" varchar(150) NOT NULL,
        "visited_person_full_name" varchar(150) NOT NULL,
        "company_name" varchar(150) NOT NULL,
        "has_vehicle" boolean NOT NULL DEFAULT false,
        "vehicle_plate" varchar(20),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT vehicle_check CHECK ((has_vehicle = false AND vehicle_plate IS NULL) OR (has_vehicle = true AND vehicle_plate IS NOT NULL)),
        CONSTRAINT vehicle_plate_format CHECK ((has_vehicle = false AND vehicle_plate IS NULL) OR (has_vehicle = true AND vehicle_plate ~ '^(0[1-9]|[1-7][0-9]|80|81)(?:[A-Z][0-9]{4,5}|[A-Z]{2}[0-9]{3,4}|[A-Z]{3}[0-9]{2,3})$'))
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_visits_entry_at" ON "visits" ("entry_at")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_visits_visitor_full_name" ON "visits" ("visitor_full_name")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_visits_visited_person_full_name" ON "visits" ("visited_person_full_name")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_visits_company_name" ON "visits" ("company_name")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_visits_vehicle_plate" ON "visits" ("vehicle_plate")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "visits"`);
  }
}


