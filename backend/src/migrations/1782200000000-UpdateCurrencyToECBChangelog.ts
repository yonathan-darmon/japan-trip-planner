import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateCurrencyToECBChangelog1782200000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO "changelogs" ("version", "content") 
            VALUES ('v1.5.0', '💶 Taux de Change en Temps Réel (API BCE) :
            - Taux Officiels : Utilisation des taux de référence de la Banque Centrale Européenne.
            - Mise à Jour Quotidienne : Les conversions sont basées sur les taux du jour.
            - Cache Intelligent : Les taux sont mis en cache localement pour optimiser les performances (24h).
            - Fallback Automatique : En cas d''indisponibilité de l''API, les taux statiques sont utilisés.')
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM "changelogs" WHERE "version" = 'v1.5.0';
        `);
    }

}
