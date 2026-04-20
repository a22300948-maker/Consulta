-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 16-04-2026 a las 04:26:39
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `wallmartromano`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `producto`
--

CREATE TABLE `producto` (
  `id_prod` int(11) NOT NULL,
  `name` varchar(40) NOT NULL,
  `price` float NOT NULL,
  `imageURL` varchar(80) NOT NULL,
  `category` varchar(40) NOT NULL,
  `description` varchar(80) NOT NULL,
  `inStock` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `producto`
--

INSERT INTO `producto` (`id_prod`, `name`, `price`, `imageURL`, `category`, `description`, `inStock`) VALUES
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

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `producto`
--
ALTER TABLE `producto`
  ADD PRIMARY KEY (`id_prod`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `producto`
--
ALTER TABLE `producto`
  MODIFY `id_prod` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
