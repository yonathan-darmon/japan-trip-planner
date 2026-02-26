import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDashboardResponsiveChangelog1783600000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO changelogs (version, content, published_at) 
            VALUES (
                'v1.8.2',
                '📱 Dashboard Responsive optimisé
        
✨ Nouveautés :
• La section "Administration du Groupe" s''adapte parfaitement sur les petits écrans.
• Les boutons d''action sont repliés pour faciliter votre utilisation sur mobile.',
                NOW()
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM changelogs WHERE version = 'v1.8.2'`);
    }
}
