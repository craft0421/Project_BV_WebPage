// myscore.js
const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();

router.get('/', (req, res) => {
  res.render('myscore', { user: req.session.user, scoreData: null, noScore: false });
});

router.post('/', (req, res) => {
  const date = req.body.date;
  const user = req.session.user;
  if (!user) return res.redirect('/login');
  if (!date || date.length !== 10) return res.render('myscore', { user, scoreData: null, noScore: true });

  const tableDate = date.replace(/-/g, '').slice(2); // 230124 형태
  const db = new sqlite3.Database('score.db');
  db.serialize(() => {
    db.all(`PRAGMA table_info("${tableDate}")`, (err, cols) => {
      if (err || cols.length === 0) {
        db.close();
        return res.render('myscore', { user, scoreData: null, noScore: true });
      }
      const columns = cols.map(col => col.name);
      db.all(`SELECT * FROM "${tableDate}"`, (err2, rows) => {
        db.close();
        if (err2 || rows.length < 3) {
          return res.render('myscore', { user, scoreData: null, noScore: true });
        }
        const totalRowObj = rows[rows.length - 3];
        const meanRowObj  = rows[rows.length - 2];
        const stdRowObj   = rows[rows.length - 1];
        const myRowObj = rows.find(r => r[columns[0]] === user.name);
        if (!myRowObj) return res.render('myscore', { user, scoreData: null, noScore: true });

        const rowToArray = rowObj =>
          columns.slice(1).map(col => rowObj[col] !== undefined ? rowObj[col] : "");

        res.render('myscore', {
          user,
          scoreData: {
            tableDate,
            columns,
            totalRow: rowToArray(totalRowObj),
            myRow: rowToArray(myRowObj),
            meanRow: rowToArray(meanRowObj),
            stdRow: rowToArray(stdRowObj),
          },
          noScore: false
        });
      });
    });
  });
});


module.exports = router;