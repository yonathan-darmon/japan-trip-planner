import { MigrationInterface, QueryRunner } from "typeorm";

export class ItineraryImprovementChangelog1782400000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO "changelogs" ("version", "content") 
            VALUES ('v1.6.0', '🗺️ Amélioration de l''Itinéraire & Devises :
            - Clustering plus précis (50km) et rayon de recherche d''hôtel réduit (30km).
            - Gestion des zones sans hébergement (alerte visuelle).
            - Optimisation des jours par hôtel pour réduire les changements.
            - Correctif : Affichage correct de la devise locale pour chaque activité (¥, €, etc.) en utilisant le code devise du pays.')
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM "changelogs" WHERE "version" = 'v1.6.0';
        `);
    }

}
