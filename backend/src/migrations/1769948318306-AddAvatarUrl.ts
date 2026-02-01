import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAvatarUrl1769948318306 implements MigrationInterface {
    name = 'AddAvatarUrl1769948318306'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "avatar_url" character varying`);
        await queryRunner.query(`INSERT INTO "changelogs" ("version", "content") VALUES ('v1.3.12', '👤 Profil : Créez votre identité en ajoutant une photo de profil ! Rendez-vous dans les paramètres.')`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "changelogs" WHERE "version" = 'v1.3.12'`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar_url"`);
    }

}
