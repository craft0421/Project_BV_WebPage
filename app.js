const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const db = require('./db');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const signupRouter = require('./routes/signup');
app.use('/signup', signupRouter);

const loginRouter = require('./routes/login');
app.use('/login', loginRouter);

app.get('/', (req, res) => {
  res.render('index', { user: req.session.user });
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

const adminRouter = require('./routes/admin');
app.use('/admin', adminRouter);

app.use((req, res) => {
  res.status(404).send('Cannot GET ' + req.originalUrl);
});

app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});