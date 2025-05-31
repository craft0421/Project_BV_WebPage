const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

// GET: 로그인 폼
router.get('/', (req, res) => {
  res.render('login');
});

// POST: 로그인 처리 (alert만 뜨게!)
router.post('/', (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.json({ success: false, message: '모든 값을 입력하세요.' });
  }

  db.get('SELECT * FROM users WHERE phone = ?', [phone], async (err, user) => {
    if (err) return res.json({ success: false, message: 'DB 오류: ' + err.message });
    if (!user) return res.json({ success: false, message: '존재하지 않는 전화번호입니다.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.json({ success: false, message: '비밀번호가 일치하지 않습니다.' });

    // 세션에 사용자 정보 저장
    req.session.user = {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role
    };
    res.json({ success: true, message: '로그인 성공! 메인페이지로 이동합니다.' });
  });
});

module.exports = router;
