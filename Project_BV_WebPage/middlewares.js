function isAdmin(req, res, next) {
  /*
    console.log('isAdmin check:', req.session.user);
    admin으로 누가 계속 접속하려고 하는 정황 확인 시 활성화
  */
  if (!req.session.user || Number(req.session.user.role) !== 1) {
    return res.status(404).send('Cannot GET /admin');
  }
  next();
}
module.exports = { isAdmin };