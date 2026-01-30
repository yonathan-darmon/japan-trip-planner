import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVisualSeparationChangelog1780700000000 implements MigrationInterface {
    name = 'AddVisualSeparationChangelog1780700000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`INSERT INTO "changelogs" ("version", "content") VALUES ('v1.3.1', '🎨 Refonte Visuelle & Intelligence : Séparation nette entre le catalogue voyageur (cartes immersives) et le panel admin (tableau de bord). Les suggestions sont maintenant automatiquement liées au pays de votre voyage dès leur création !')`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "changelogs" WHERE "version" = 'v1.3.1'`);
    }
}
