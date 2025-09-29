// index.js
const express = require("express");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const { Pool } = require("pg");
const cookieParser = require("cookie-parser");

// DB 연결 풀
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const app = express();
const port = process.env.PORT || 3000;
const path = require("path");
app.use(express.static(path.join(__dirname, "..", "dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
});
// 미들웨어
app.use(express.json());
app.use(cookieParser());

// 세션 설정
app.use(session({
  store: new pgSession({
    pool: pool,        // Postgres에 세션 저장
    tableName: "session" // 세션 테이블 이름 (자동 생성됨)
  }),
  secret: "super-secret-key", // ⚠️ 실제로는 환경변수로 관리
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,   // HTTPS에서만 쿠키 전송하려면 true
    maxAge: 1000 * 60 * 60 * 24 // 1일 유지
  }
}));

// 라우트 등록
const authRoutes = require("./routes/auth");
app.use("/auth", authRoutes);

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
