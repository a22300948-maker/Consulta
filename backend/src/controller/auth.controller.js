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
