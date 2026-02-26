import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSeoOptimizationChangelog1783700000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO changelogs (version, content, published_at) 
            VALUES (
                'v1.8.3',
                '🔎 Moteur de recherche & Référencement (SEO)
        
✨ Nouveautés sous le capot :
• Intégration de balises dynamiques (Titre, Description) qui changent selon la page visitée (Tableau de bord, Itinéraire, Suggestions).
• Meilleure lecture pour les réseaux sociaux (partage de liens sur Facebook, LinkedIn, Twitter mis en avant).
• Optimisation sémantique pour être plus visible sur Google !',
                NOW()
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM changelogs WHERE version = 'v1.8.3'`);
    }
}
