import { MigrationInterface, QueryRunner } from "typeorm";

export class SuggestionLinkageFixChangelog1781500000000 implements MigrationInterface {
    name = 'SuggestionLinkageFixChangelog1781500000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`INSERT INTO "changelogs" ("version", "content") VALUES ('v1.3.9', '🔗 Liaisons robustes : Vos suggestions sont désormais toujours associées à un pays et à votre voyage, même après un rafraîchissement de page ! 🔒 Sécurité : Correction du nettoyage de session au log-out.')`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "changelogs" WHERE "version" = 'v1.3.9'`);
    }
}
