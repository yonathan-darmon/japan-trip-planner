import { MigrationInterface, QueryRunner } from "typeorm";

export class FixSecurityColumns1780200000000 implements MigrationInterface {
    name = 'FixSecurityColumns1780200000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add missing columns to Users table
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email" character varying(255) UNIQUE`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_viewed_changelog_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "token_version" integer NOT NULL DEFAULT 1`);

        // Add missing columns to and relationships (just in case they were missed)
        await queryRunner.query(`ALTER TABLE "itineraries" ADD COLUMN IF NOT EXISTS "group_id" integer`);
        await queryRunner.query(`ALTER TABLE "suggestions" ADD COLUMN IF NOT EXISTS "country_id" integer`);

        // Update suggestions if any are null (fallback to Japan if country exists)
        const japan = await queryRunner.query(`SELECT id FROM "countries" WHERE code = 'JP' LIMIT 1`);
        if (japan && japan.length > 0) {
            const japanId = japan[0].id;
            await queryRunner.query(`UPDATE "suggestions" SET "country_id" = $1 WHERE "country_id" IS NULL`, [japanId]);
            await queryRunner.query(`UPDATE "itineraries" SET "group_id" = (SELECT "group_id" FROM "group_members" WHERE "user_id" = "itineraries"."created_by" LIMIT 1) WHERE "group_id" IS NULL`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No need to drop columns for now as it's a fix migration
    }
}
