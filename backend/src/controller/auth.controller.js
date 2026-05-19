import db from '../models/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

//Registro
export const register = async (req, res) => {
    //verificar si el usuario ya existe
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    try {
        const user = await db.User.create({
            username: req.body.username,
            email: req.body.email,
            password: hashedPassword,
        });
        res.status(201).json({ message: 'User created successfully', user });
    } catch (err) {
        res.status(500).json({ message: 'Error creating user', error: err.message });
    }
};

//Login
export const login = async (req, res) => {
    //buscar usuario
    //validar existencia
    //comparar contraseñas
    const validPassword = await bcrypt.compare(req.body.password, user.password);
    //genero jwt
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ message: 'Login successful', token });
};

