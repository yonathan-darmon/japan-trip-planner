import { MigrationInterface, QueryRunner } from "typeorm";

export class AddModularArchChangelog1782000000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO "changelogs" ("version", "content") 
            VALUES ('v1.4.0', '🌍 Architecture Modulaire & Devises :
            - Le système supporte désormais des fonctionnalités spécifiques par pays (ex: JR Pass prévu pour le Japon).
            - Gestion automatique des devises : Affichage en ¥ pour le Japon et en € pour l''Europe dans les itinéraires.')
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM "changelogs" WHERE "version" = 'v1.4.0';
        `);
    }

}
