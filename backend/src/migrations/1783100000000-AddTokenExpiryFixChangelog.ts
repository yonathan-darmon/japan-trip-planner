import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTokenExpiryFixChangelog1783100000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      INSERT INTO "changelogs" ("version", "content", "published_at")
      VALUES (
        'v1.7.1',
        '🔐 Correction de sécurité — Expiration de session

🚪 Déconnexion automatique :
• Si ta session expire (token JWT invalide), tu es maintenant automatiquement redirigé vers la page de connexion
• Plus de situation où tu semblais connecté mais sans accès aux données
• La durée de session reste de 24h après ta dernière connexion',
        NOW()
      )
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "changelogs" WHERE "version" = 'v1.7.1'`);
    }
}
