const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendPasswordResetCodeEmail } = require('../services/mail.service');

const DB_PATH = path.join(__dirname, '../database/database.db');
const JWT_SECRET = process.env.JWT_SECRET || 'consulta_secret';
const RESET_CODE_TTL_MS = 10 * 60 * 1000;

function openDatabase() {
  return new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE);
}

function normalizeIdentifier(value) {
  return String(value ?? '').trim();
}

function generateResetCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

function isValidResetCode(code) {
  return typeof code === 'string' && /^\d{6}$/.test(code);
}

exports.register = (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Faltan datos requeridos.', message: 'Faltan datos requeridos.' });
  }

  const db = openDatabase();
  db.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email], (selectErr, row) => {
    /////////////////
    // VALIDATIONS //
    /////////////////
    if (selectErr) {
      db.close();
      return res.status(500).json({ error: 'Error del servidor al verificar el usuario.', message: 'Error del servidor al verificar el usuario.' });
    }

    if (row) {
      db.close();
      return res.status(409).json({ error: 'El nombre de usuario o email ya está en uso.', message: 'El nombre de usuario o email ya está en uso.' });
    }
    // username needs to be 3-20 chars, only letters, numbers, underscores:
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      db.close();
      return res.status(400).json({ error: 'El nombre de usuario debe tener 3-20 caracteres y solo puede contener letras, números y guiones bajos.', message: 'El nombre de usuario debe tener 3-20 caracteres y solo puede contener letras, números y guiones bajos.' });
    }
    // Basic email format check:
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      db.close();
      return res.status(400).json({ error: 'Formato de email inválido.', message: 'Formato de email inválido.' });
    }
    // Password needs to be at least 6 chars, no spaces, contain one cap, one lower, one number and one special char:
    if (password.length < 6 || /\s/.test(password) || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      db.close();
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres, no contener espacios y debe incluir mayúsculas, minúsculas, números y caracteres especiales.', message: 'La contraseña debe tener al menos 6 caracteres, no contener espacios y debe incluir mayúsculas, minúsculas, números y caracteres especiales.' });
    }

    // Hash password and insert user:
    bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
      if (hashErr) {
        db.close();
        return res.status(500).json({ error: 'Error al procesar la contraseña.', message: 'Error al procesar la contraseña.' });
      }

      const insertSql = 'INSERT INTO users (username, email, password, created_at) VALUES (?, ?, ?, datetime("now"));';
      db.run(insertSql, [username, email, hashedPassword], function (insertErr) {
        db.close();
        if (insertErr) {
          // Handle unique constraint violations explicitly
          const msg = String(insertErr.message || 'Error guardando el usuario.');
          if (/unique|constraint/i.test(msg)) {
            return res.status(409).json({ error: 'El nombre de usuario o email ya está en uso.', message: 'El nombre de usuario o email ya está en uso.' });
          }
          return res.status(500).json({ error: 'Error guardando el usuario.', message: 'Error guardando el usuario.' });
        }
        return res.status(201).json({ message: 'Usuario creado correctamente.' });
      });
    });
  });
};

exports.login = (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Nombre de usuario y contraseña son requeridos.', message: 'Nombre de usuario y contraseña son requeridos.' });
  }

  const db = openDatabase();
  db.get('SELECT id, username, password, isAdmin FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      db.close();
      return res.status(500).json({ error: 'Error del servidor al buscar el usuario.', message: 'Error del servidor al buscar el usuario.' });
    }

    if (!user) {
      db.close();
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.', message: 'Usuario o contraseña incorrectos.' });
    }

    bcrypt.compare(password, user.password, (compareErr, validPassword) => {
      db.close();
      if (compareErr || !validPassword) {
        return res.status(401).json({ error: 'Usuario o contraseña incorrectos.', message: 'Usuario o contraseña incorrectos.' });
      }

      const token = jwt.sign({ id: user.id, username: user.username, isAdmin: user.isAdmin === 1 }, JWT_SECRET, { expiresIn: '8h' });
      return res.status(200).json({ message: 'Login successful', token });
    });
  });
};

exports.forgotPassword = (req, res) => {
  const identifier = normalizeIdentifier(req.body?.identifier);

  if (!identifier) {
    return res.status(400).json({ message: 'Por favor ingresa tu correo o nombre de usuario.' });
  }

  const db = openDatabase();
  db.get(
    'SELECT id, username, email FROM users WHERE username = ? OR email = ? LIMIT 1;',
    [identifier, identifier],
    async (err, user) => {
      if (err) {
        db.close();
        return res.status(500).json({ message: 'Error del servidor al buscar el usuario.' });
      }

      // Respuesta genérica para evitar enumeración.
      if (!user?.id || !user.email) {
        db.close();
        return res.status(200).json({ message: 'Si existe una cuenta, se envió un código de recuperación al correo.' });
      }

      const code = generateResetCode();
      const expiresAt = Date.now() + RESET_CODE_TTL_MS;
      const sentAt = Date.now();

      try {
        const codeHash = await bcrypt.hash(code, 10);
        db.run(
          'UPDATE users SET reset_code_hash = ?, reset_code_expires_at = ?, reset_code_sent_at = ? WHERE id = ?;',
          [codeHash, expiresAt, sentAt, user.id],
          async (updateErr) => {
            db.close();
            if (updateErr) {
              return res.status(500).json({ message: 'Error del servidor al generar el código.' });
            }

            try {
              await sendPasswordResetCodeEmail({
                to: user.email,
                username: user.username,
                code,
                minutes: Math.round(RESET_CODE_TTL_MS / 60000),
              });
            } catch (mailErr) {
              console.warn('[auth] No se pudo enviar correo de recuperación:', mailErr?.message || mailErr);
            }

            const response = { message: 'Si existe una cuenta, se envió un código de recuperación al correo.' };
            if (process.env.RESET_CODE_DEBUG === 'true') {
              response.debugCode = code;
            }
            return res.status(200).json(response);
          }
        );
      } catch {
        db.close();
        return res.status(500).json({ message: 'Error del servidor al generar el código.' });
      }
    }
  );
};

exports.resetPassword = (req, res) => {
  const identifier = normalizeIdentifier(req.body?.identifier);
  const code = normalizeIdentifier(req.body?.code);
  const newPassword = String(req.body?.newPassword ?? '');

  if (!identifier || !code || !newPassword) {
    return res.status(400).json({ message: 'Faltan datos requeridos.' });
  }

  if (!isValidResetCode(code)) {
    return res.status(400).json({ message: 'Código inválido.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
  }

  const db = openDatabase();
  db.get(
    'SELECT id, reset_code_hash, reset_code_expires_at FROM users WHERE username = ? OR email = ? LIMIT 1;',
    [identifier, identifier],
    (err, user) => {
      if (err) {
        db.close();
        return res.status(500).json({ message: 'Error del servidor al buscar el usuario.' });
      }

      if (!user?.id || !user.reset_code_hash || !user.reset_code_expires_at) {
        db.close();
        return res.status(400).json({ message: 'Código inválido o expirado.' });
      }

      const expiresAt = Number(user.reset_code_expires_at);
      if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
        db.run(
          'UPDATE users SET reset_code_hash = NULL, reset_code_expires_at = NULL, reset_code_sent_at = NULL WHERE id = ?;',
          [user.id],
          () => {
            db.close();
            return res.status(400).json({ message: 'Código inválido o expirado.' });
          }
        );
        return;
      }

      bcrypt.compare(code, user.reset_code_hash, (cmpErr, ok) => {
        if (cmpErr || !ok) {
          db.close();
          return res.status(400).json({ message: 'Código inválido o expirado.' });
        }

        bcrypt.hash(newPassword, 10, (hashErr, hashedPassword) => {
          if (hashErr) {
            db.close();
            return res.status(500).json({ message: 'Error al procesar la contraseña.' });
          }

          db.run(
            'UPDATE users SET password = ?, reset_code_hash = NULL, reset_code_expires_at = NULL, reset_code_sent_at = NULL WHERE id = ?;',
            [hashedPassword, user.id],
            (updateErr) => {
              db.close();
              if (updateErr) {
                return res.status(500).json({ message: 'Error del servidor al actualizar la contraseña.' });
              }
              return res.status(200).json({ message: 'Contraseña actualizada.' });
            }
          );
        });
      });
    }
  );
};
