const express = require('express');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // 필요 시 SSL 옵션 추가:
  // ssl: { rejectUnauthorized: false }
});

const app = express();

app.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT NOW() AS now');
  res.json({ now: rows[0].now });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on ${port}`));