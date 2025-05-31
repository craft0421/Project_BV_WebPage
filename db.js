const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('users.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role INTEGER NOT NULL DEFAULT 0
  )`);
});

module.exports = db;