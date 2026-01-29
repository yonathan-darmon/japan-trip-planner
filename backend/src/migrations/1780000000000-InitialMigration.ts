import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1780000000000 implements MigrationInterface {
    name = 'InitialMigration1780000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Helper to ignore errors
        const loose = async (p: Promise<any>) => {
            try { await p; } catch (e) {
                // QueryFailedError: relation "..." already exists
                if (e.code === '42P07' || e.message.includes('already exists')) return;
                console.log('Ignoring non-critical error:', e.message);
            }
        };

        // 1. Create Tables (IF NOT EXISTS)
        await loose(queryRunner.query(`CREATE TABLE "countries" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "code" character varying(3) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_countries_name" UNIQUE ("name"), CONSTRAINT "UQ_countries_code" UNIQUE ("code"), CONSTRAINT "PK_countries" PRIMARY KEY ("id"))`));
        await loose(queryRunner.query(`CREATE TABLE "groups" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "trip_config_id" integer, "country_id" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_groups_trip_config" UNIQUE ("trip_config_id"), CONSTRAINT "PK_groups" PRIMARY KEY ("id"))`));
        await loose(queryRunner.query(`CREATE TABLE "group_members" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "group_id" integer NOT NULL, "role" character varying NOT NULL DEFAULT 'member', "joined_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_group_members" PRIMARY KEY ("id"))`));

        // 2. Add Columns to Existing Tables
        await loose(queryRunner.query(`ALTER TABLE "itineraries" ADD COLUMN IF NOT EXISTS "group_id" integer`));
        await loose(queryRunner.query(`ALTER TABLE "suggestions" ADD COLUMN IF NOT EXISTS "country_id" integer`));
        await loose(queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email" character varying(255) UNIQUE`));
        await loose(queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_viewed_changelog_at" TIMESTAMP`));

        // 3. SEED Data: Japan
        await loose(queryRunner.query(`INSERT INTO "countries" ("name", "code") VALUES ('Japan', 'JP') ON CONFLICT DO NOTHING`));
        const japan = await queryRunner.query(`SELECT id FROM "countries" WHERE code = 'JP' LIMIT 1`);
        const japanId = japan[0].id;

        // 4. DATA MIGRATION: Existing Users -> Groups
        const users = await queryRunner.query(`SELECT id, username FROM "users"`);
        for (const user of users) {
            // Check if user already has a group (to prevent duplicates on re-run)
            const membership = await queryRunner.query(`SELECT id FROM "group_members" WHERE "user_id" = $1 LIMIT 1`, [user.id]);
            let groupId;

            if (membership.length > 0) {
                // User already in a group, get it
                const memberRecord = await queryRunner.query(`SELECT "group_id" FROM "group_members" WHERE "user_id" = $1 LIMIT 1`, [user.id]);
                groupId = memberRecord[0].group_id;
            } else {
                // Create Group
                const groupRes = await queryRunner.query(`INSERT INTO "groups" ("name", "country_id") VALUES ($1, $2) RETURNING id`, [`${user.username}'s Group`, japanId]);
                groupId = groupRes[0].id;
                // Add Member
                await queryRunner.query(`INSERT INTO "group_members" ("user_id", "group_id", "role") VALUES ($1, $2, 'admin')`, [user.id, groupId]);
            }

            // Migrate Itineraries
            await queryRunner.query(`UPDATE "itineraries" SET "group_id" = $1 WHERE "created_by" = $2`, [groupId, user.id]);
        }

        // Backfill Suggestions country_id
        await queryRunner.query(`UPDATE "suggestions" SET "country_id" = $1 WHERE "country_id" IS NULL`, [japanId]);

        // 5. Add Constraints & Indices
        await loose(queryRunner.query(`ALTER TABLE "groups" ADD CONSTRAINT "FK_groups_trip_config" FOREIGN KEY ("trip_config_id") REFERENCES "trip_config"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`));
        await loose(queryRunner.query(`ALTER TABLE "groups" ADD CONSTRAINT "FK_groups_country" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`));
        await loose(queryRunner.query(`ALTER TABLE "group_members" ADD CONSTRAINT "FK_members_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`));
        await loose(queryRunner.query(`ALTER TABLE "group_members" ADD CONSTRAINT "FK_members_group" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`));

        // Suggestions FK
        await loose(queryRunner.query(`ALTER TABLE "suggestions" ADD CONSTRAINT "FK_suggestions_country" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`));

        // Itineraries FK
        await loose(queryRunner.query(`ALTER TABLE "itineraries" ADD CONSTRAINT "FK_itineraries_group" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "itineraries" DROP CONSTRAINT "FK_e2e824d7482f3e865a2c2556093"`);
        await queryRunner.query(`ALTER TABLE "suggestions" DROP CONSTRAINT "FK_e8cb58147f64245c94e3f359bce"`);
        await queryRunner.query(`ALTER TABLE "group_members" DROP CONSTRAINT "FK_2c840df5db52dc6b4a1b0b69c6e"`);
        await queryRunner.query(`ALTER TABLE "group_members" DROP CONSTRAINT "FK_20a555b299f75843aa53ff8b0ee"`);
        await queryRunner.query(`ALTER TABLE "groups" DROP CONSTRAINT "FK_71b1dafadaebbb65f4baf4a4411"`);
        await queryRunner.query(`ALTER TABLE "groups" DROP CONSTRAINT "FK_de22ee2075982661efdaec24aed"`);
        await queryRunner.query(`DROP TABLE "group_members"`);
        await queryRunner.query(`DROP TABLE "groups"`);
        await queryRunner.query(`DROP TABLE "countries"`);
    }

}
