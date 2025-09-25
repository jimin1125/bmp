// index.js
const express = require("express");
const { Pool } = require("pg"); // DB 안 쓸 거면 이 줄 지워도 됨

const app = express();
const port = process.env.PORT || 3000;

// DB 쓰는 경우
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Railway Postgres는 SSL 필요할 수 있음
  ssl: { rejectUnauthorized: false }
});

// 라우트 예제
app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.send(`Hello from Express! Time: ${result.rows[0].now}`);
  } catch (err) {
    res.send("Hello from Express! (DB 연결 안 됨)");
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
