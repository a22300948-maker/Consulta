// database/initDb.js
const sqlite3 = require('sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.db');

function initializeDatabase() {
    const db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
            console.error('Error al abrir/crear la base de datos:', err.message);
            process.exit(1);
        }
        console.log('Base de datos SQLite creada/abierta:', DB_PATH);
    });

    // Habilitar claves foráneas (aunque no tenemos relaciones aún)
    db.run('PRAGMA foreign_keys = ON;');

    // Crear tabla producto (compatible con SQLite)
    const createTableSQL = `
        CREATE TABLE IF NOT EXISTS producto (
            id_prod INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            imageURL TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT NOT NULL,
            inStock INTEGER NOT NULL CHECK (inStock IN (0,1))
        );
    `;

    db.run(createTableSQL, (err) => {
        if (err) {
            console.error('Error creando tabla:', err.message);
            db.close();
            process.exit(1);
        }
        console.log('Tabla "producto" verificada/creada.');

        // Verificar si ya hay datos
        db.get('SELECT COUNT(*) as count FROM producto', (err, row) => {
            if (err) {
                console.error('Error verificando datos:', err.message);
                db.close();
                process.exit(1);
            }
            if (row.count === 0) {
                // Insertar los productos
                const insertSQL = `
                  INSERT INTO producto (id_prod, name, price, imageURL, category, description, inStock) VALUES
                    (1, 'Pan Artesanal Romano', 45, 'https://i.ytimg.com/vi/650ob30wQ50/maxresdefault.jpg', 'Alimentos', 'Pan rústico elaborado con técnicas inspiradas en la antigua Roma.', 1),
                    (2, 'Queso de Cabra Artesanal', 120, 'https://tianguisvirtual.mx/wp-content/uploads/2022/09/13.png', 'Lacteos', 'Queso fresco de cabra con sabor tradicional romano.', 1),
                    (3, 'Miel Natural', 80, 'https://bodegaslaeralta.es/cdn/shop/articles/mulsum.jpg?v=1681318710', 'Endulzantes', 'Miel pura utilizada como principal endulzante en la época romana.', 1),
                    (4, 'Aceitunas Mediterraneas', 65, 'https://http2.mlstatic.com/D_Q_NP_2X_879191-MLA99373462456_112025-T.webp', 'Alimentos', 'Aceitunas seleccionadas con estilo tradicional mediterráneo.', 1),
                    (5, 'Vasija de Ceramica', 150, 'https://m.media-amazon.com/images/I/71LtaeN9EHL._AC_UF894,1000_QL80_.jpg', 'Utensilios', 'Recipiente de cerámica inspirado en utensilios romanos antiguos.', 1),
                    (6, 'Tunica Romana', 250, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS8tLj7YHVQ_-bqVDP53OkuZLCNmUjAJGcZNw&s', 'Recreación', 'Vestimenta tradicional romana ideal para eventos temáticos.', 0),
                    (7, 'Vino Tinto Romano', 180, 'https://lamanchawines.com/wp-content/uploads/2018/08/12540025.jpg', 'Bebidas', 'Vino tinto inspirado en las recetas tradicionales del Imperio Romano.', 1),
                    (8, 'Pan de Higos', 55, 'https://comedera.com/wp-content/uploads/sites/9/2022/04/pan-de-higo.jpg', 'Alimentos', 'Pan dulce con higos, muy consumido en la antigua Roma.', 1),
                    (9, 'Aceite de Oliva Extra Virgen', 140, 'https://www.molinoalfonso.com/wp-content/uploads/2021/06/aceite-oliva-virgen-extra-aragon.jpg', 'Alimentos', 'Aceite de oliva puro, esencial en la dieta romana.', 1),
                    (10, 'Copa de Metal Antigua', 95, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRA5kNjJj83Jq4AxIKj47ID1dzEHTowiBMxvA&s', 'Utensilios', 'Copa decorativa inspirada en banquetes romanos.', 1),
                    (11, 'Casco de Gladiador', 320, 'https://marqalicante.com/gladiadores/wp-content/uploads/2022/03/Gladiadores-MArq-Alicante-Caso-2.jpg', 'Recreación', 'Casco estilo gladiador para recreaciones históricas.', 0),
                    (12, 'Sandalias Romanas', 210, 'https://m.media-amazon.com/images/I/518Qdrpt0dL._AC_UF894,1000_QL80_.jpg', 'Vestimenta', 'Calzado tradicional romano hecho con cuero.', 1),
                    (13, 'Pergamino Decorativo', 70, 'https://i.etsystatic.com/20336931/r/il/50d18c/2691901451/il_570xN.2691901451_3fes.jpg', 'Decoración', 'Pergamino estilo antiguo ideal para decoración temática.', 1),
                    (14, 'Incienso Aromático', 60, 'https://www.jessenza.com/wp-content/uploads/2019/03/Incienso-Aromatico-Jessenza.jpeg', 'Aromas', 'Incienso utilizado en rituales y templos romanos.', 1);                `;
                db.exec(insertSQL, (err) => {
                    if (err) {
                        console.error('Error insertando datos:', err.message);
                    } else {
                        console.log('Productos insertados correctamente.');
                    }
                    db.close();
                });
            } else {
                console.log(`Ya existen ${row.count} productos. No se insertan datos.`);
                db.close();
            }
        });
    });
}

// Si se ejecuta directamente (node database/initDb.js)
if (require.main === module) {
    initializeDatabase();
}

module.exports = initializeDatabase;
