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

// 값 저장
app.post("/save", express.json(), async (req, res) => {
  const { content } = req.body;
  await pool.query("INSERT INTO messages (content) VALUES ($1)", [content]);
  res.send("Saved!");
});

// 값 불러오기
app.get("/messages", async (req, res) => {
  const result = await pool.query("SELECT * FROM messages ORDER BY id DESC");
  res.json(result.rows);
});


app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
