const { Client } = require('pg');
require('dotenv').config();

console.log('🔍 Vérification de la configuration de la base de données...');
console.log(`Hôte: ${process.env.DATABASE_HOST}`);
console.log(`Port: ${process.env.DATABASE_PORT}`);
console.log(`Utilisateur: ${process.env.DATABASE_USER}`);
console.log(`Base de données: ${process.env.DATABASE_NAME}`);

const client = new Client({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: 'postgres', // Connexion à la DB par défaut pour vérifier
});

async function checkConnection() {
    try {
        await client.connect();
        console.log('✅ Connexion à PostgreSQL réussie !');

        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${process.env.DATABASE_NAME}'`);
        if (res.rowCount === 0) {
            console.log(`⚠️  La base de données '${process.env.DATABASE_NAME}' n'existe pas encore.`);
            console.log(`Création de la base de données...`);
            await client.query(`CREATE DATABASE "${process.env.DATABASE_NAME}"`);
            console.log(`✅ Base de données '${process.env.DATABASE_NAME}' créée avec succès !`);
        } else {
            console.log(`✅ La base de données '${process.env.DATABASE_NAME}' existe déjà.`);
        }

        console.log('\n🎉 Tout est prêt ! Vous pouvez lancer le backend.');
    } catch (err) {
        console.error('❌ Échec de la connexion :', err.message);
        if (err.code === '28P01') {
            console.log('👉 Vérifiez votre mot de passe dans le fichier .env');
        } else if (err.code === 'ECONNREFUSED') {
            console.log('👉 Vérifiez que PostgreSQL est bien installé et démarré sur le port 5432');
        }
    } finally {
        await client.end();
    }
}

checkConnection();
