import { MigrationInterface, QueryRunner } from "typeorm";

export class FixDurationAndAdminNavChangelog1781400000000 implements MigrationInterface {
    name = 'FixDurationAndAdminNavChangelog1781400000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`INSERT INTO "changelogs" ("version", "content") VALUES ('v1.3.8', '🐞 Correctifs : La durée des activités ne se réinitialise plus lors de la modification. 🛠️ Admin : Accès enfin fonctionnel à la gestion des utilisateurs.')`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "changelogs" WHERE "version" = 'v1.3.8'`);
    }
}
