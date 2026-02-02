import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCurrencyRefactorChangelog1782500000000 implements MigrationInterface {
    name = 'AddCurrencyRefactorChangelog1782500000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`INSERT INTO "changelogs" ("version", "content") VALUES ('v1.6.0', '💱 Devise & Itinéraire : Intégration complète du Yen (JPY). Tous les prix sont maintenant affichés correctement selon le contexte du pays sur toutes les vues (Itinéraire, Suggestions, Planning) !')`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "changelogs" WHERE "version" = 'v1.6.0'`);
    }
}
