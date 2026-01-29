import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateChangelogTable1780300000000 implements MigrationInterface {
    name = 'CreateChangelogTable1780300000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "changelogs" ("id" SERIAL NOT NULL, "version" character varying(50) NOT NULL, "content" text NOT NULL, "published_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_changelogs" PRIMARY KEY ("id"))`);

        // Seed initial changelog
        await queryRunner.query(`INSERT INTO "changelogs" ("version", "content") VALUES ('v1.1.0', '🎉 Refonte Administration & Profils : Gestion des pays, gestion des membres de groupe par le Super Admin, et refonte design "Glassmorphism" des paramètres !')`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "changelogs"`);
    }
}
