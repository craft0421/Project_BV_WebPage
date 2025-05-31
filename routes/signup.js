const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

router.get('/', (req, res) => {
  res.render('signup'); // views/signup.ejs가 필요
});

router.post('/', async (req, res) => {
  const { name, phone, password } = req.body;
  if (!name || !phone || !password)
    return res.json({ success: false, message: '모든 값을 입력하세요.' });

  const hashed = await bcrypt.hash(password, 10);

  db.run(
    `INSERT INTO users (name, phone, password, role) VALUES (?, ?, ?, 0)`,
    [name, phone, hashed],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.json({ success: false, message: '이미 가입된 전화번호입니다.' });
        }
        return res.json({ success: false, message: '오류 발생: ' + err.message });
      }
      // 성공
      res.json({ success: true, message: '회원가입 완료! 로그인 페이지로 이동합니다.' });
    }
  );
});


module.exports = router;