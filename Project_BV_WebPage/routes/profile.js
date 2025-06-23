const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const { isAdmin } = require('../middlewares');

router.get('/', (req, res) => {
  res.render('profile', { user: req.session.user });
});

module.exports = router;