const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
        return res.status(403).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'consulta_secret');
        req.userId = decoded.id;
        req.isAdmin = !!decoded.isAdmin;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
};

exports.verifyAdmin = (req, res, next) => {
    if (req.isAdmin) return next();
    return res.status(403).json({ message: 'Admin privileges required' });
};
