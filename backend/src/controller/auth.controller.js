const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const DB_PATH = path.join(__dirname, '../database/database.db');
const JWT_SECRET = process.env.JWT_SECRET || 'consulta_secret';

function openDatabase() {
  return new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE);
}

exports.register = (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Faltan datos requeridos.' });
  }

  const db = openDatabase();
  db.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email], (selectErr, row) => {
    if (selectErr) {
      db.close();
      return res.status(500).json({ message: 'Error del servidor al verificar el usuario.' });
    }

    if (row) {
      db.close();
      return res.status(409).json({ message: 'El nombre de usuario o email ya está en uso.' });
    }

    bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
      if (hashErr) {
        db.close();
        return res.status(500).json({ message: 'Error al procesar la contraseña.' });
      }

      const insertSql = 'INSERT INTO users (username, email, password, created_at) VALUES (?, ?, ?, datetime("now"));';
      db.run(insertSql, [username, email, hashedPassword], function (insertErr) {
        db.close();
        if (insertErr) {
          return res.status(500).json({ message: 'Error guardando el usuario.' });
        }
        return res.status(201).json({ message: 'Usuario creado correctamente.' });
      });
    });
  });
};

exports.login = (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Nombre de usuario y contraseña son requeridos.' });
  }

  const db = openDatabase();
  db.get('SELECT id, username, password, isAdmin FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      db.close();
      return res.status(500).json({ message: 'Error del servidor al buscar el usuario.' });
    }

    if (!user) {
      db.close();
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos.' });
    }

    bcrypt.compare(password, user.password, (compareErr, validPassword) => {
      db.close();
      if (compareErr || !validPassword) {
        return res.status(401).json({ message: 'Usuario o contraseña incorrectos.' });
      }

      const token = jwt.sign({ id: user.id, username: user.username, isAdmin: user.isAdmin === 1 }, JWT_SECRET, { expiresIn: '1h' });
      return res.status(200).json({ message: 'Login successful', token });
    });
  });
};
