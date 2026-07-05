const { Client } = require('pg');
require('dotenv').config();

async function run() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to database!');

        // Get columns of products table
        const columnsRes = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'products'
    `);

        console.log('--- Columns of table products ---');
        console.log(JSON.stringify(columnsRes.rows, null, 2));

        // Get a sample product row
        const productRes = await client.query('SELECT * FROM products LIMIT 1');
        console.log('--- Sample product ---');
        console.log(JSON.stringify(productRes.rows[0], null, 2));

    } catch (err) {
        console.error('Error executing query:', err.message);
    } finally {
        await client.end();
    }
}

run();
