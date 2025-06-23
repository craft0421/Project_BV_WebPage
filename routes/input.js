const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const { isAdmin } = require('../middlewares');

function calcMean(arr) {
  if (!arr.length) return "";
  return (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2);
}
function calcStd(arr, mean) {
  if (!arr.length) return "";
  const variance = arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length;
  return Math.sqrt(variance).toFixed(2);
}

let cachedTables = null;

router.get('/', isAdmin, (req, res) => {
  cachedTables = null;
  res.render('input', { tables: null });
});

router.post('/', upload.single('excel'), (req, res) => {
  if (!req.file) return res.render('input', { tables: null });
  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const tables = [];
    workbook.SheetNames.forEach(sheetName => {
      const json = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
      if (json.length === 0) return;
      let columns = Object.keys(json[0]);
      const studentRows = json.slice(0, json.length - 1);
      const totalRow = json[json.length - 1];

      // 총합 함수
      function rowSum(row) {
        return columns.slice(1).reduce((sum, col) => {
          const v = Number(row[col]);
          return sum + (isNaN(v) ? 0 : v);
        }, 0);
      }

      // 학생별 총합 미리 구해두기
      const studentsWithSum = studentRows.map(row => {
        return { ...row, "총합": rowSum(row) };
      });
      const totalRowWithSum = { ...totalRow, "총합": rowSum(totalRow) };

      // 평균/표준편차 계산 (학생 데이터만, 각 열별)
      const numericValues = {};
      columns.slice(1).forEach(col => {
        numericValues[col] = studentRows.map(row => Number(row[col])).filter(v => !isNaN(v));
      });
      // 학생별 총합 배열 (평균/표준편차용)
      const sumArray = studentsWithSum.map(row => Number(row["총합"])).filter(v => !isNaN(v));

      // 평균, 표준편차 행
      const meanRow = {}, stdRow = {};
      columns.forEach((col, idx) => {
        if (idx === 0 || ["이름", "만점", "이영희", "김철수"].includes(col)) {
          meanRow[col] = "평균";
          stdRow[col] = "표준편차";
        } else if (numericValues[col] && numericValues[col].length) {
          const mean = parseFloat(calcMean(numericValues[col]));
          meanRow[col] = mean.toFixed(2);
          stdRow[col] = calcStd(numericValues[col], mean);
        } else {
          meanRow[col] = "";
          stdRow[col] = "";
        }
      });
      // "총합" 열 추가, 학생별 총합에 대해 정석적으로 계산!
      columns = [...columns, "총합"];
      meanRow["총합"] = calcMean(sumArray);
      stdRow["총합"]  = calcStd(sumArray, parseFloat(meanRow["총합"]));

      tables.push({
        name: sheetName,
        columns,
        rows: [...studentsWithSum, totalRowWithSum],
        meanRow,
        stdRow
      });
    });
    cachedTables = tables;
    res.render('input', { tables });
  } catch (err) {
    cachedTables = null;
    res.render('input', { tables: null });
  }
});

router.post('/score-upload', express.urlencoded({ extended: true }), (req, res) => {
  if (!cachedTables || !Array.isArray(cachedTables) || cachedTables.length === 0) {
    return res.send(`<script>alert('표 데이터가 없습니다.');location.href='/input';</script>`);
  }
  const date = req.body.date;
  if (!date || date.length !== 10) {
    return res.send(`<script>alert('날짜 입력 오류');location.href='/input';</script>`);
  }
  const tableName = date.replace(/-/g, '').slice(2);
  const db = new sqlite3.Database('score.db');
  const table = cachedTables[0];
  const columns = table.columns.map(col => `"${col}" TEXT`).join(', ');

  db.serialize(() => {
    db.run(`DROP TABLE IF EXISTS "${tableName}"`);
    db.run(`CREATE TABLE "${tableName}" (${columns})`);
    const placeholders = table.columns.map(() => '?').join(', ');
    const stmt = db.prepare(`INSERT INTO "${tableName}" VALUES (${placeholders})`);
    table.rows.forEach(row => {
      stmt.run(table.columns.map(col => row[col]));
    });
    stmt.run(table.columns.map(col => table.meanRow[col]));
    stmt.run(table.columns.map(col => table.stdRow[col]));
    stmt.finalize(err => {
      db.close();
      if (err) {
        return res.send(`<script>alert('저장 실패: ${err.message}');location.href='/input';</script>`);
      } else {
        cachedTables = null;
        return res.send(`<script>alert('DB 저장 완료!');location.href='/input';</script>`);
      }
    });
  });
});

module.exports = router;
