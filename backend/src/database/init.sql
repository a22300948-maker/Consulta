-- Eliminar la tabla si ya existe (para limpiar)
DROP TABLE IF EXISTS producto;

-- Crear tabla producto
CREATE TABLE producto (
  id_prod INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  imageURL TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  inStock INTEGER NOT NULL   -- 0 = false, 1 = true
);

-- Insertar los datos
INSERT INTO producto (id_prod, name, price, imageURL, category, description, inStock) VALUES
(1, 'Pan Artesanal Romano', 45, 'https://i.ytimg.com/vi/650ob30wQ50/maxresdefault.jpg', 'Alimentos', 'Pan rústico elaborado con técnicas inspiradas en la antigua Roma.', 1),
(2, 'Queso de Cabra Artesanal', 120, 'https://tianguisvirtual.mx/wp-content/uploads/2022/09/13.png', 'Lacteos', 'Queso fresco de cabra con sabor tradicional romano.', 1),
(3, 'Miel Natural', 80, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSj1sZzNjx30oxmqDOlmadCMBSX', 'Endulzantes', 'Miel pura utilizada como principal endulzante en la época romana.', 1),
(4, 'Aceitunas Mediterraneas', 65, 'https://http2.mlstatic.com/D_Q_NP_2X_879191-MLA99373462456_112025-T.webp', 'Alimentos', 'Aceitunas seleccionadas con estilo tradicional mediterráneo.', 1),
(5, 'Vasija de Ceramica', 150, 'https://m.media-amazon.com/images/I/71LtaeN9EHL._AC_UF894,1000_QL80_.jpg', 'Utensilios', 'Recipiente de cerámica inspirado en utensilios romanos antiguos.', 1),
(6, 'Tunica Romana', 250, 'https://i.etsystatic.com/55006896/r/il/3aaaf6/6400749494/il_340x270.6400749494_t', 'Recreación', 'Vestimenta tradicional romana ideal para eventos temáticos.', 0),
(7, 'Vino Tinto Romano', 180, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRv5pZ5xmwKscVbJvajqreksAdp', 'Bebidas', 'Vino tinto inspirado en las recetas tradicionales del Imperio Romano.', 1),
(8, 'Pan de Higos', 55, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSb8hOQNFZuS3RfiYPRUeXN-LSQ', 'Alimentos', 'Pan dulce con higos, muy consumido en la antigua Roma.', 1),
(9, 'Aceite de Oliva Extra Virgen', 140, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS8Eqa4k4F3dEqFrFggT4hdYw56', 'Alimentos', 'Aceite de oliva puro, esencial en la dieta romana.', 1),
(10, 'Copa de Metal Antigua', 95, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR5AflCjJmFHXvs38tnh4fKBtWW', 'Utensilios', 'Copa decorativa inspirada en banquetes romanos.', 1),
(11, 'Casco de Gladiador', 320, 'https://m.media-amazon.com/images/I/61rEP1HfxhL.jpg', 'Recreación', 'Casco estilo gladiador para recreaciones históricas.', 0),
(12, 'Sandalias Romanas', 210, 'https://m.media-amazon.com/images/I/518Qdrpt0dL._AC_UF894,1000_QL80_.jpg', 'Vestimenta', 'Calzado tradicional romano hecho con cuero.', 1),
(13, 'Pergamino Decorativo', 70, 'https://img.freepik.com/vector-gratis/pergamino-abierto-realista-transparente_10', 'Decoración', 'Pergamino estilo antiguo ideal para decoración temática.', 1),
(14, 'Incienso Aromático', 60, 'https://naturalmarket.com.mx/wp-content/uploads/2021/06/Combo_Romano_Gris_03.jpg', 'Aromas', 'Incienso utilizado en rituales y templos romanos.', 1);
