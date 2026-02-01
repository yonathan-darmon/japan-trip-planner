import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCurrencyFeatureChangelog1782100000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO "changelogs" ("version", "content") 
            VALUES ('v1.4.1', '💶 Conversion de Devises Intégrée :
            - Saisie Facile : Entrez vos prix en Euros, l''application calcule automatiquement l''équivalent local (ex: ¥).
            - Stockage Intelligent : Les prix sont toujours enregistrés dans la devise du pays pour faciliter la gestion du budget.
            - Affichage Clair : Liste des suggestions avec conversion approximative en Euros.')
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM "changelogs" WHERE "version" = 'v1.4.1';
        `);
    }

}
