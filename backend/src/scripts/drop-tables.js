const { Client } = require('pg');
require('dotenv').config({ path: '../.env' });

const client = new Client({
    user: process.env.DATABASE_USER,
    host: process.env.DATABASE_HOST,
    database: process.env.DATABASE_NAME,
    password: process.env.DATABASE_PASSWORD,
    port: process.env.DATABASE_PORT,
    ssl: process.env.DATABASE_HOST !== 'localhost' ? { rejectUnauthorized: false } : false,
});

async function drop() {
    try {
        await client.connect();
        console.log('Connected');
        await client.query('DROP TABLE IF EXISTS "group_members", "groups", "countries" CASCADE;');
        console.log('Tables dropped');
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

drop();
