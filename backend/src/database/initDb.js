// database/initDb.js - initialize the database only when it does not exist, preserve data otherwise
const sqlite3 = require('sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

const DB_PATH = path.join(__dirname, 'database.db');

function runAsync(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) return reject(err);
            resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
}

function getAsync(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) return reject(err);
            resolve(row);
        });
    });
}

async function ensureAdminUser(db) {
    const username = (process.env.ADMIN_USERNAME || '').trim();
    const email = (process.env.ADMIN_EMAIL || '').trim();
    const password = process.env.ADMIN_PASSWORD || '';

    // Si no se configuró, no forzamos nada.
    if (!username || !email || !password) {
        console.warn('[initDb] ADMIN_USERNAME/ADMIN_EMAIL/ADMIN_PASSWORD no configurados; no se crea admin inicial.');
        return;
    }

    const existing = await getAsync(
        db,
        'SELECT id, isAdmin FROM users WHERE username = ? OR email = ? LIMIT 1;',
        [username, email]
    );

    const hashedPassword = await bcrypt.hash(password, 10);

    if (existing?.id) {
        await runAsync(
            db,
            'UPDATE users SET isAdmin = 1, password = ? WHERE id = ?;',
            [hashedPassword, existing.id]
        );
        return;
    }

    await runAsync(
        db,
        'INSERT INTO users (username, email, password, isAdmin, created_at) VALUES (?, ?, ?, 1, datetime("now"));',
        [username, email, hashedPassword]
    );
}

function ensureColumnExists(db, table, column, definition, callback) {
    db.all(`PRAGMA table_info(${table});`, (err, rows) => {
        if (err) return callback(err);
        const exists = rows.some((columnInfo) => columnInfo.name === column);
        if (exists) return callback(null);
        db.run(`ALTER TABLE ${table} ADD COLUMN ${definition};`, callback);
    });
}

function ensureColumns(db, checks, callback) {
    let remaining = checks.length;
    if (remaining === 0) return callback(null);

    checks.forEach(({ table, column, definition }) => {
        ensureColumnExists(db, table, column, definition, (err) => {
            if (err) return callback(err);
            remaining -= 1;
            if (remaining === 0) callback(null);
        });
    });
}

function initializeDatabase() {
    const databaseExists = fs.existsSync(DB_PATH);
    const db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
            console.error('Error al abrir/crear la base de datos:', err.message);
            process.exit(1);
        }
        console.log('Base de datos SQLite creada/abierta:', DB_PATH);
    });

    db.serialize(() => {
        db.run('PRAGMA foreign_keys = ON;');

        const createUserSQL = `
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                isAdmin INTEGER NOT NULL DEFAULT 0,
                reset_code_hash TEXT,
                reset_code_expires_at INTEGER,
                reset_code_sent_at INTEGER,
                full_name TEXT,
                address TEXT,
                postal_code TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
        `;

        const createProductoSQL = `
            CREATE TABLE IF NOT EXISTS producto (
                id_prod INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                price REAL NOT NULL,
                imageURL TEXT NOT NULL,
                category TEXT NOT NULL,
                sDescription TEXT NOT NULL,
                description TEXT NOT NULL,
                inStock INTEGER NOT NULL DEFAULT 0
            );
        `;

        const createPedidoSQL = `
            CREATE TABLE IF NOT EXISTS pedido (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                paypal_order_id TEXT,
                total REAL NOT NULL,
                iva_rate REAL NOT NULL DEFAULT 0.16,
                iva_amount REAL,
                total_con_iva REAL,
                currency TEXT NOT NULL DEFAULT 'MXN',
                status TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                receipt_xml TEXT,
                receipt_downloaded_at TEXT,
                raw_payload TEXT,
                user_id INTEGER,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
        `;

        const createPedidoItemSQL = `
            CREATE TABLE IF NOT EXISTS pedido_item (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pedido_id INTEGER NOT NULL,
                producto_id INTEGER,
                item_name TEXT NOT NULL,
                unit_price REAL NOT NULL,
                quantity INTEGER NOT NULL,
                subtotal REAL NOT NULL,
                FOREIGN KEY (pedido_id) REFERENCES pedido(id) ON DELETE CASCADE,
                FOREIGN KEY (producto_id) REFERENCES producto(id_prod)
            );
        `;

        db.run(createUserSQL);
        db.run(createProductoSQL);
        db.run(createPedidoSQL);
        db.run(createPedidoItemSQL, (err) => {
            if (err) {
                console.error('Error creando tablas iniciales:', err.message);
                db.close();
                process.exit(1);
            }

            ensureColumns(db, [
                { table: 'users', column: 'full_name', definition: 'full_name TEXT' },
                { table: 'users', column: 'address', definition: 'address TEXT' },
                { table: 'users', column: 'postal_code', definition: 'postal_code TEXT' },
                { table: 'users', column: 'isAdmin', definition: 'isAdmin INTEGER NOT NULL DEFAULT 0' },
                { table: 'users', column: 'reset_code_hash', definition: 'reset_code_hash TEXT' },
                { table: 'users', column: 'reset_code_expires_at', definition: 'reset_code_expires_at INTEGER' },
                { table: 'users', column: 'reset_code_sent_at', definition: 'reset_code_sent_at INTEGER' },
                { table: 'pedido', column: 'user_id', definition: 'user_id INTEGER' },
                { table: 'pedido', column: 'iva_rate', definition: 'iva_rate REAL NOT NULL DEFAULT 0.16' },
                { table: 'pedido', column: 'iva_amount', definition: 'iva_amount REAL' },
                { table: 'pedido', column: 'total_con_iva', definition: 'total_con_iva REAL' },
                { table: 'producto', column: 'is_active', definition: 'is_active INTEGER NOT NULL DEFAULT 1' },
            ], (columnErr) => {
                if (columnErr) {
                    console.error('Error asegurando columnas de la base de datos:', columnErr.message);
                    db.close();
                    process.exit(1);
                }

                ensureAdminUser(db)
                    .catch((adminErr) => {
                        console.error('Error asegurando usuario admin inicial:', adminErr.message || adminErr);
                    })
                    .finally(() => {
                        if (!databaseExists) {
                            seedInitialProductsV2(db).finally(() => db.close());
                            return;
                        }

                        db.get('SELECT COUNT(1) AS count FROM producto;', (err, row) => {
                            if (err) {
                                console.error('Error verificando tabla producto:', err.message);
                            } else if (!row || row.count === 0) {
                                seedInitialProductsV2(db).finally(() => db.close());
                                return;
                            }
                            db.close();
                        });
                    });
            });
        });
    });
}

function seedInitialProducts(db) {
    return new Promise((resolve) => {
        const insertSQL = `
            INSERT INTO producto (id_prod, name, price, imageURL, category, sDescription, description, inStock) VALUES
            (1, 'Pan Artesanal Romano', 45, 'https://i.ytimg.com/vi/650ob30wQ50/maxresdefault.jpg', 'alimento', 'Pan rústico tradicional', 'Pan rústico elaborado con harina integral y masa madre, siguiendo técnicas tradicionales que aportan textura y sabor profundo.', 25),
            (2, 'Queso de Cabra Artesanal', 120, 'https://tianguisvirtual.mx/wp-content/uploads/2022/09/13.png', 'alimento', 'Queso fresco de cabra', 'Queso de cabra madurado el tiempo justo para obtener una textura cremosa y un aroma suave, ideal para tablas y cocina tradicional.', 12),
            (3, 'Miel Natural', 80, 'https://bodegaslaeralta.es/cdn/shop/articles/mulsum.jpg?v=1681318710', 'alimento', 'Miel pura de flor', 'Miel 100% natural recolectada de flores silvestres, sin aditivos, con notas florales y cuerpo denso.', 40),
            (4, 'Aceitunas Mediterraneas', 65, 'https://http2.mlstatic.com/D_Q_NP_2X_879191-MLA99373462456_112025-T.webp', 'alimento', 'Aceitunas seleccionadas', 'Aceitunas verdes y negras curadas con hierbas mediterráneas para un sabor equilibrado y tradicional.', 30),
            (5, 'Vasija de Ceramica', 150, 'https://m.media-amazon.com/images/I/71LtaeN9EHL._AC_UF894,1000_QL80_.jpg', 'decoracion', 'Vasija cerámica decorativa', 'Vasija de cerámica hecha y pintada a mano, inspirada en estilos antiguos, perfecta como pieza decorativa o contenedor.', 8),
            (6, 'Tunica Romana', 250, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS8tLj7YHVQ_-bqVDP53OkuZLCNmUjAJGcZNw&s', 'vestimenta', 'Túnica temática', 'Túnica de algodón con corte clásico, ideal para recreaciones históricas o eventos temáticos, cómoda y resistente.', 6),
            (7, 'Vino Tinto Romano', 180, 'https://lamanchawines.com/wp-content/uploads/2018/05/12540025.jpg', 'alimento', 'Vino tinto tradicional', 'Vino tinto con cuerpo y notas frutales, elaborado siguiendo técnicas inspiradas en recetas antiguas.', 20),
            (8, 'Pan de Higos', 55, 'https://comedera.com/wp-content/uploads/sites/9/2022/04/pan-de-higo.jpg', 'alimento', 'Pan dulce con higos', 'Pan dulce relleno de higos secos y especias, con miga tierna y sabor naturalmente dulce.', 18),
            (9, 'Aceite de Oliva Extra Virgen', 140, 'https://www.molinoalfonso.com/wp-content/uploads/2018/08/aceite-oliva-virgen-extra-aragon.jpg', 'alimento', 'Aceite de oliva premium', 'Aceite de oliva extra virgen prensado en frío, con aroma intenso y sabor afrutado, perfecto para aderezos y cocina.', 22),
            (10, 'Copa de Metal Antigua', 95, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRA5kNjJj83Jq4AxIKj47ID1dzEHTowiBMxA&s', 'decoracion', 'Copa metálica decorativa', 'Copa metálica con acabado envejecido, ideal como pieza de colección o decoración para mesas temáticas.', 11),
            (11, 'Casco de Gladiador', 320, 'https://marqalicante.com/gladiadores/wp-content/uploads/2022/03/Gladiadores-MArq-Alicante-Caso-2.jpg', 'decoracion', 'Casco decorativo', 'Casco de inspiración histórica, perfecto para exhibición o para complementar disfraces en eventos culturales.', 4),
            (12, 'Sandalias Romanas', 210, 'https://m.media-amazon.com/images/I/518Qdrpt0dL._AC_UF894,1000_QL80_.jpg', 'vestimenta', 'Sandalias tradicionales', 'Sandalias de cuero con diseño tradicional, cómodas y duraderas para recreaciones o uso casual.', 9),
            (13, 'Pergamino Decorativo', 70, 'https://i.etsystatic.com/20336931/r/il/50d18c/2691901451/il_570xN.2691901451_3fes.jpg', 'decoracion', 'Pergamino impreso con motivos antiguos, ideal para enmarcar o usar en decoraciones temáticas.', 14),
            (14, 'Incienso Aromático', 60, 'https://www.jessenza.com/wp-content/uploads/2019/03/InciensoAromaticoJessenza.jpeg', 'miscelaneos', 'Incienso aromático de mezcla herbal, utilizado para ambientar espacios y ceremonias con fragancias sutiles.', 26);
        `;

        db.exec(insertSQL, (err) => {
            if (err) {
                console.error('Error insertando datos:', err.message);
            } else {
                console.log('Productos insertados correctamente.');
            }
            resolve();
        });
    });
}

function seedInitialProductsV2(db) {
    return new Promise((resolve) => {
        const productos = [
            { id_prod: 1, name: 'Pan Artesanal Romano', price: 45, imageURL: 'https://i.ytimg.com/vi/650ob30wQ50/maxresdefault.jpg', category: 'alimento', sDescription: 'Pan rústico tradicional', description: 'Pan rústico elaborado con harina integral y masa madre, siguiendo técnicas tradicionales que aportan textura y sabor profundo.', inStock: 25 },
            { id_prod: 2, name: 'Queso de Cabra Artesanal', price: 120, imageURL: 'https://tianguisvirtual.mx/wp-content/uploads/2022/09/13.png', category: 'alimento', sDescription: 'Queso fresco de cabra', description: 'Queso de cabra madurado el tiempo justo para obtener una textura cremosa y un aroma suave, ideal para tablas y cocina tradicional.', inStock: 12 },
            { id_prod: 3, name: 'Miel Natural', price: 80, imageURL: 'https://bodegaslaeralta.es/cdn/shop/articles/mulsum.jpg?v=1681318710', category: 'alimento', sDescription: 'Miel pura de flor', description: 'Miel 100% natural recolectada de flores silvestres, sin aditivos, con notas florales y cuerpo denso.', inStock: 40 },
            { id_prod: 4, name: 'Aceitunas Mediterraneas', price: 65, imageURL: 'https://http2.mlstatic.com/D_Q_NP_2X_879191-MLA99373462456_112025-T.webp', category: 'alimento', sDescription: 'Aceitunas seleccionadas', description: 'Aceitunas verdes y negras curadas con hierbas mediterráneas para un sabor equilibrado y tradicional.', inStock: 30 },
            { id_prod: 5, name: 'Vasija de Ceramica', price: 150, imageURL: 'https://m.media-amazon.com/images/I/71LtaeN9EHL._AC_UF894,1000_QL80_.jpg', category: 'decoracion', sDescription: 'Vasija cerámica decorativa', description: 'Vasija de cerámica hecha y pintada a mano, inspirada en estilos antiguos, perfecta como pieza decorativa o contenedor.', inStock: 8 },
            { id_prod: 6, name: 'Tunica Romana', price: 250, imageURL: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS8tLj7YHVQ_-bqVDP53OkuZLCNmUjAJGcZNw&s', category: 'vestimenta', sDescription: 'Túnica temática', description: 'Túnica de algodón con corte clásico, ideal para recreaciones históricas o eventos temáticos, cómoda y resistente.', inStock: 6 },
            { id_prod: 7, name: 'Vino Tinto Romano', price: 180, imageURL: 'https://lamanchawines.com/wp-content/uploads/2018/05/12540025.jpg', category: 'alimento', sDescription: 'Vino tinto tradicional', description: 'Vino tinto con cuerpo y notas frutales, elaborado siguiendo técnicas inspiradas en recetas antiguas.', inStock: 20 },
            { id_prod: 8, name: 'Pan de Higos', price: 55, imageURL: 'https://comedera.com/wp-content/uploads/sites/9/2022/04/pan-de-higo.jpg', category: 'alimento', sDescription: 'Pan dulce con higos', description: 'Pan dulce relleno de higos secos y especias, con miga tierna y sabor naturalmente dulce.', inStock: 18 },
            { id_prod: 9, name: 'Aceite de Oliva Extra Virgen', price: 140, imageURL: 'https://www.molinoalfonso.com/wp-content/uploads/2018/08/aceite-oliva-virgen-extra-aragon.jpg', category: 'alimento', sDescription: 'Aceite de oliva premium', description: 'Aceite de oliva extra virgen prensado en frío, con aroma intenso y sabor afrutado, perfecto para aderezos y cocina.', inStock: 22 },
            { id_prod: 10, name: 'Copa de Metal Antigua', price: 95, imageURL: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRA5kNjJj83Jq4AxIKj47ID1dzEHTowiBMxA&s', category: 'decoracion', sDescription: 'Copa metálica decorativa', description: 'Copa metálica con acabado envejecido, ideal como pieza de colección o decoración para mesas temáticas.', inStock: 11 },
            { id_prod: 11, name: 'Casco de Gladiador', price: 320, imageURL: 'https://marqalicante.com/gladiadores/wp-content/uploads/2022/03/Gladiadores-MArq-Alicante-Caso-2.jpg', category: 'decoracion', sDescription: 'Casco decorativo', description: 'Casco de inspiración histórica, perfecto para exhibición o para complementar disfraces en eventos culturales.', inStock: 4 },
            { id_prod: 12, name: 'Sandalias Romanas', price: 210, imageURL: 'https://m.media-amazon.com/images/I/518Qdrpt0dL._AC_UF894,1000_QL80_.jpg', category: 'vestimenta', sDescription: 'Sandalias tradicionales', description: 'Sandalias de cuero con diseño tradicional, cómodas y duraderas para recreaciones o uso casual.', inStock: 9 },
            { id_prod: 13, name: 'Pergamino Decorativo', price: 70, imageURL: 'https://i.etsystatic.com/20336931/r/il/50d18c/2691901451/il_570xN.2691901451_3fes.jpg', category: 'decoracion', sDescription: 'Pergamino impreso decorativo', description: 'Pergamino impreso con motivos antiguos, ideal para enmarcar o usar en decoraciones temáticas.', inStock: 14 },
            { id_prod: 14, name: 'Incienso Aromático', price: 60, imageURL: 'https://www.jessenza.com/wp-content/uploads/2019/03/InciensoAromaticoJessenza.jpeg', category: 'miscelaneos', sDescription: 'Incienso aromático', description: 'Incienso aromático de mezcla herbal, utilizado para ambientar espacios y ceremonias con fragancias suaves.', inStock: 26 },
        ];

        const stmt = db.prepare('INSERT INTO producto (id_prod, name, price, imageURL, category, sDescription, description, inStock) VALUES (?, ?, ?, ?, ?, ?, ?, ?);');
        let pending = productos.length;
        productos.forEach((producto) => {
            stmt.run([
                producto.id_prod,
                producto.name,
                producto.price,
                producto.imageURL,
                producto.category,
                producto.sDescription,
                producto.description,
                producto.inStock,
            ], (err) => {
                if (err) {
                    console.error('Error insertando dato:', err.message, producto.name);
                }
                pending -= 1;
                if (pending === 0) {
                    stmt.finalize((finalizeErr) => {
                        if (finalizeErr) {
                            console.error('Error finalizando statement:', finalizeErr.message);
                        }
                        console.log('Productos insertados correctamente.');
                        resolve();
                    });
                }
            });
        });
    });
}

if (require.main === module) {
    initializeDatabase();
}

module.exports = initializeDatabase;
