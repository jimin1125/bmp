const express = require("express");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const { Pool } = require("pg");
const cookieParser = require("cookie-parser");
const path = require("path");

// DB 연결 풀
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const app = express();
const port = process.env.PORT || 3000;

// ✅ 미들웨어 먼저
app.use(express.json());
app.use(cookieParser());

// ✅ 세션 설정
app.use(session({
  store: new pgSession({
    pool: pool,
    tableName: "session"
  }),
  secret: "super-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 1000 * 60 * 60 * 24
  }
}));

// ✅ 라우트 등록
const authRoutes = require("./node_modules/routes/auth.js");
app.use("/auth", authRoutes);

// ✅ 정적 파일은 dist 폴더에서 제공
app.use(express.static(path.join(__dirname, "../dist")));

// ✅ 맨 마지막 catch-all 라우트 (리액트 라우터 대응)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist", "index.html"));
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
