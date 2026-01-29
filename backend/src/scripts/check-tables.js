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

async function check() {
    try {
        await client.connect();
        const res = await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public';");
        console.log(res.rows.map(r => r.tablename));
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

check();
