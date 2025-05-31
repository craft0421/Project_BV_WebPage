const express = require('express');
const router = express.Router();
const db = require('../db');
const { isAdmin } = require('../middlewares');

// 가입 유저 목록
router.get('/', isAdmin, (req, res) => {
  db.all('SELECT id, name, phone, role FROM users', [], (err, users) => {
    if (err) return res.status(500).send('DB 오류');
   res.render('admin', { users, user: req.session.user });
  });
});

// 유저 삭제 (POST /admin/delete/:id)
router.post('/delete/:id', isAdmin, (req, res) => {
  const userId = req.params.id;
  // 관리자 자기 자신은 삭제 불가 (선택)
  if (req.session.user.id == userId) {
    return res.json({ success: false, message: '관리자는 자기 자신을 삭제할 수 없습니다.' });
  }
  db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
    if (err) return res.json({ success: false, message: '삭제 실패: ' + err.message });
    res.json({ success: true, message: '삭제 완료!' });
    console.log('삭제 요청 처리 완료 : ', req.session.user);
  });
});

// 유저 권한 변경 (POST /admin/role/:id)
router.post('/role/:id', isAdmin, (req, res) => {
  const userId = req.params.id;
  const newRole = req.body.role; // 0 또는 1
  // 관리자 자기 자신은 권한 변경 불가 (선택)
  if (req.session.user.id == userId) {
    return res.json({ success: false, message: '관리자는 자기 자신의 권한을 변경할 수 없습니다.' });
  }
  db.run('UPDATE users SET role = ? WHERE id = ?', [newRole, userId], function(err) {
    if (err) return res.json({ success: false, message: '권한 변경 실패: ' + err.message });
    res.json({ success: true, message: '권한 변경 완료!' });
    console.log('권한 변경 요청 처리 완료 : ', req.session.user);
  });
});

module.exports = router;
