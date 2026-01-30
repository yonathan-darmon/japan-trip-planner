import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserManagementChangelog1780400000000 implements MigrationInterface {
    name = 'AddUserManagementChangelog1780400000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`INSERT INTO "changelogs" ("version", "content") VALUES ('v1.2.0', '🛡️ Sécurité & Gestion Pro : Nouvelle interface de gestion des utilisateurs pour le Super Admin, contrôle total des groupes et rôles, et restrictions d''accès pour les membres de groupe simples !')`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "changelogs" WHERE "version" = 'v1.2.0'`);
    }
}
