// database/initDb.js - reinitialize producto table with sDescription and numeric inStock
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

    db.serialize(() => {
        db.run('PRAGMA foreign_keys = ON;');

        // Dropear la tabla si existe para asegurar la nueva estructura
        db.run('DROP TABLE IF EXISTS producto;');

        const createTableSQL = `
            CREATE TABLE producto (
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

        db.run(createTableSQL, (err) => {
            if (err) {
                console.error('Error creando tabla:', err.message);
                db.close();
                process.exit(1);
            }
            console.log('Tabla "producto" creada con nueva estructura.');

            // Insertar productos iniciales con descripciones cortas y largas, y cantidades en stock
            const insertSQL = `
                INSERT INTO producto (id_prod, name, price, imageURL, category, sDescription, description, inStock) VALUES
                (1, 'Pan Artesanal Romano', 45, 'https://i.ytimg.com/vi/650ob30wQ50/maxresdefault.jpg', 'alimento', 'Pan rústico tradicional', 'Pan rústico elaborado con harina integral y masa madre, siguiendo técnicas tradicionales que aportan textura y sabor profundo.', 25),
                (2, 'Queso de Cabra Artesanal', 120, 'https://tianguisvirtual.mx/wp-content/uploads/2022/09/13.png', 'alimento', 'Queso fresco de cabra', 'Queso de cabra madurado el tiempo justo para obtener una textura cremosa y un aroma suave, ideal para tablas y cocina tradicional.', 12),
                (3, 'Miel Natural', 80, 'https://bodegaslaeralta.es/cdn/shop/articles/mulsum.jpg?v=1681318710', 'alimento', 'Miel pura de flor', 'Miel 100% natural recolectada de flores silvestres, sin aditivos, con notas florales y cuerpo denso.', 40),
                (4, 'Aceitunas Mediterraneas', 65, 'https://http2.mlstatic.com/D_Q_NP_2X_879191-MLA99373462456_112025-T.webp', 'alimento', 'Aceitunas seleccionadas', 'Aceitunas verdes y negras curadas con hierbas mediterráneas para un sabor equilibrado y tradicional.', 30),
                (5, 'Vasija de Ceramica', 150, 'https://m.media-amazon.com/images/I/71LtaeN9EHL._AC_UF894,1000_QL80_.jpg', 'decoracion', 'Vasija cerámica decorativa', 'Vasija de cerámica hecha y pintada a mano, inspirada en estilos antiguos, perfecta como pieza decorativa o contenedor.', 8),
                (6, 'Tunica Romana', 250, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS8tLj7YHVQ_-bqVDP53OkuZLCNmUjAJGcZNw&s', 'vestimenta', 'Túnica temática', 'Túnica de algodón con corte clásico, ideal para recreaciones históricas o eventos temáticos; cómoda y resistente.', 6),
                (7, 'Vino Tinto Romano', 180, 'https://lamanchawines.com/wp-content/uploads/2018/08/12540025.jpg', 'alimento', 'Vino tinto tradicional', 'Vino tinto con cuerpo y notas frutales, elaborado siguiendo técnicas inspiradas en recetas antiguas.', 20),
                (8, 'Pan de Higos', 55, 'https://comedera.com/wp-content/uploads/sites/9/2022/04/pan-de-higo.jpg', 'alimento', 'Pan dulce con higos', 'Pan dulce relleno de higos secos y especias, con miga tierna y sabor naturalmente dulce.', 18),
                (9, 'Aceite de Oliva Extra Virgen', 140, 'https://www.molinoalfonso.com/wp-content/uploads/2021/06/aceite-oliva-virgen-extra-aragon.jpg', 'alimento', 'Aceite de oliva premium', 'Aceite de oliva extra virgen prensado en frío, con aroma intenso y sabor afrutado, perfecto para aderezos y cocina.', 22),
                (10, 'Copa de Metal Antigua', 95, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRA5kNjJj83Jq4AxIKj47ID1dzEHTowiBMxvA&s', 'decoracion', 'Copa metálica decorativa', 'Copa metálica con acabado envejecido, ideal como pieza de colección o decoración para mesas temáticas.', 11),
                (11, 'Casco de Gladiador', 320, 'https://marqalicante.com/gladiadores/wp-content/uploads/2022/03/Gladiadores-MArq-Alicante-Caso-2.jpg', 'decoracion', 'Casco decorativo', 'Casco de inspiración histórica, perfecto para exhibición o para complementar disfraces en eventos culturales.', 4),
                (12, 'Sandalias Romanas', 210, 'https://m.media-amazon.com/images/I/518Qdrpt0dL._AC_UF894,1000_QL80_.jpg', 'vestimenta', 'Sandalias tradicionales', 'Sandalias de cuero con diseño tradicional; cómodas y duraderas para recreaciones o uso casual.', 9),
                (13, 'Pergamino Decorativo', 70, 'https://i.etsystatic.com/20336931/r/il/50d18c/2691901451/il_570xN.2691901451_3fes.jpg', 'decoracion', 'Pergamino para decoración', 'Pergamino impreso con motivos antiguos, ideal para enmarcar o usar en decoraciones temáticas.', 14),
                (14, 'Incienso Aromático', 60, 'https://www.jessenza.com/wp-content/uploads/2019/03/Incienso-Aromatico-Jessenza.jpeg', 'miscelaneos', 'Incienso de aromas suaves', 'Incienso aromático de mezcla herbal, utilizado para ambientar espacios y ceremonias con fragancias sutiles.', 26);
            `;

            db.exec(insertSQL, (err) => {
                if (err) {
                    console.error('Error insertando datos:', err.message);
                } else {
                    console.log('Productos insertados correctamente.');
                }
                db.close();
            });
        });
    });
}

if (require.main === module) {
    initializeDatabase();
}

module.exports = initializeDatabase;
