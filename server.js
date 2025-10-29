import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ public 폴더 전체 정적 제공
app.use(express.static(path.join(__dirname, "public")));

// ✅ 메인 라우트
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ SPA (싱글 페이지 앱) 대비 - 모든 라우트 index.html로 연결
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ Render 환경 포트 설정 (핵심 수정)
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ 서버 실행 중: http://0.0.0.0:${PORT}`);
});
