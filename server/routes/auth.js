// routes/auth.js
const express = require("express");
const bcrypt = require("bcrypt");
const { Pool } = require("pg");

const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 회원가입
router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  // 비번 해싱
  const hashedPassword = await bcrypt.hash(password, 10);

  await pool.query(
    "INSERT INTO users (username, password) VALUES ($1, $2)",
    [username, hashedPassword]
  );

  res.send("회원가입 성공!");
});

// 로그인
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const result = await pool.query(
    "SELECT * FROM users WHERE username = $1",
    [username]
  );
  const user = result.rows[0];

  if (!user) return res.status(400).send("사용자를 찾을 수 없음");

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).send("비밀번호 불일치");

  // 세션에 유저 정보 저장
  req.session.userId = user.id;

  res.send("로그인 성공!");
});

// 로그인 상태 확인
router.get("/me", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).send("로그인 안 됨");
  }
  res.send(`현재 로그인한 사용자 ID: ${req.session.userId}`);
});

// 로그아웃
router.post("/logout", (req, res) => {
  req.session.destroy();
  res.send("로그아웃 완료!");
});

module.exports = router;
