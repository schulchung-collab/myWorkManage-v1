// 로컬 SQLite DB 를 지운다. 다음에 앱을 열면 빈 DB 가 만들어지고 샘플 데이터가 다시 들어간다.
// 사용: npm run db:reset   (개발 서버를 끈 상태에서 실행하세요)
import fs from "node:fs";
import path from "node:path";

const dbPath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(process.cwd(), "data", "personal-site.db");

let removed = 0;
for (const file of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`]) {
  try {
    fs.rmSync(file);
    removed++;
  } catch (err) {
    if (err.code === "EBUSY" || err.code === "EPERM") {
      console.error(`파일이 사용 중입니다: ${file}\n개발 서버(npm run dev)를 끈 뒤 다시 실행하세요.`);
      process.exit(1);
    }
    if (err.code !== "ENOENT") throw err;
  }
}

console.log(
  removed > 0
    ? `DB 를 지웠습니다: ${dbPath}\n앱을 다시 열면 샘플 데이터가 새로 들어갑니다.`
    : `지울 DB 파일이 없습니다: ${dbPath}`,
);
