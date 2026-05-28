const db= require('../config/db');

const getProductos = (req, res) => {
    const sql = `
        SELECT
            id_prod AS id,
            name,
            price,
            imageURL AS imageUrl,
            category,
            sDescription AS sDescription,
            description,
            inStock,
            COALESCE(is_active, 1) AS isActive
        FROM producto
        WHERE COALESCE(is_active, 1) = 1
    `;
    db.all(sql, (err, rows) => {
        if (err) return res.status(500).json({ error: 'Error al obtener los productos' });
        res.json(rows);
    });
};

const getProductosAdmin = (req, res) => {
    const sql = `
        SELECT
            id_prod AS id,
            name,
            price,
            imageURL AS imageUrl,
            category,
            sDescription AS sDescription,
            description,
            inStock,
            COALESCE(is_active, 1) AS isActive
        FROM producto
        ORDER BY id_prod DESC
    `;
    db.all(sql, (err, rows) => {
        if (err) return res.status(500).json({ error: 'Error al obtener los productos' });
        res.json(rows);
    });
};

const getProductoById = (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'ID inválido' });

    db.get(
        `SELECT id_prod AS id, name, price, imageURL AS imageUrl, category, sDescription AS sDescription, description, inStock, COALESCE(is_active,1) AS isActive FROM producto WHERE id_prod = ?;`,
        [id],
        (err, row) => {
            if (err) return res.status(500).json({ error: 'Error al leer el producto' });
            if (!row) return res.status(404).json({ error: 'Producto no encontrado' });
            return res.json(row);
        }
    );
};

const createProduct = (req, res) => {
    const { name, price, imageUrl, category, sDescription, description, inStock } = req.body || {};
    if (!name || !category || price == null) {
        return res.status(400).json({ error: 'Faltan campos requeridos: name, category, price' });
    }

    const priceNum = Number(price);
    const stockNum = Number(inStock ?? 0);

    if (!Number.isFinite(priceNum) || priceNum < 0) return res.status(400).json({ error: 'Precio inválido' });
    if (!Number.isFinite(stockNum) || stockNum < 0) return res.status(400).json({ error: 'Stock inválido' });

    const img = imageUrl || '';

    const sql = `INSERT INTO producto (name, price, imageURL, category, sDescription, description, inStock) VALUES (?, ?, ?, ?, ?, ?, ?);`;
    db.run(sql, [name, priceNum, img, category, sDescription || '', description || '', stockNum], function (err) {
        if (err) {
            console.error('Error creando producto:', err.message);
            return res.status(500).json({ error: 'Error al crear el producto' });
        }
        const id = this.lastID;
        db.get(`SELECT id_prod AS id, name, price, imageURL AS imageUrl, category, sDescription AS sDescription, description, inStock, COALESCE(is_active,1) AS isActive FROM producto WHERE id_prod = ?;`, [id], (gErr, row) => {
            if (gErr) return res.status(500).json({ error: 'Producto creado pero falló la lectura' });
            return res.status(201).json(row);
        });
    });
};

const updateProduct = (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'ID inválido' });

    const { name, price, imageUrl, category, sDescription, description, inStock } = req.body || {};

    const fields = [];
    const params = [];

    if (name !== undefined) { fields.push('name = ?'); params.push(name); }
    if (price !== undefined) { const p = Number(price); if (!Number.isFinite(p) || p < 0) return res.status(400).json({ error: 'Precio inválido' }); fields.push('price = ?'); params.push(p); }
    if (imageUrl !== undefined) { fields.push('imageURL = ?'); params.push(imageUrl || ''); }
    if (category !== undefined) { fields.push('category = ?'); params.push(category); }
    if (sDescription !== undefined) { fields.push('sDescription = ?'); params.push(sDescription); }
    if (description !== undefined) { fields.push('description = ?'); params.push(description); }
    if (inStock !== undefined) { const s = Number(inStock); if (!Number.isFinite(s) || s < 0) return res.status(400).json({ error: 'Stock inválido' }); fields.push('inStock = ?'); params.push(s); }

    if (!fields.length) return res.status(400).json({ error: 'No hay campos para actualizar' });

    params.push(id);
    const sql = `UPDATE producto SET ${fields.join(', ')} WHERE id_prod = ?;`;
    db.run(sql, params, function (err) {
        if (err) {
            console.error('Error actualizando producto:', err.message);
            return res.status(500).json({ error: 'Error al actualizar el producto' });
        }
        if (!this.changes) return res.status(404).json({ error: 'Producto no encontrado' });
        db.get(`SELECT id_prod AS id, name, price, imageURL AS imageUrl, category, sDescription AS sDescription, description, inStock, COALESCE(is_active,1) AS isActive FROM producto WHERE id_prod = ?;`, [id], (gErr, row) => {
            if (gErr) return res.status(500).json({ error: 'Producto actualizado, falló lectura' });
            return res.json(row);
        });
    });
};

const deleteProduct = (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'ID inválido' });

    // Soft delete: set is_active = 0
    db.run('UPDATE producto SET is_active = 0 WHERE id_prod = ?;', [id], function (err) {
        if (err) {
            console.error('Error eliminando producto:', err.message);
            return res.status(500).json({ error: 'Error al eliminar el producto' });
        }
        if (!this.changes) return res.status(404).json({ error: 'Producto no encontrado' });
        return res.json({ message: 'Producto eliminado (soft)'});
    });
};

const setProductActive = (req, res) => {
    const id = Number(req.params.id);
    const isActive = Number(req.body?.isActive);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'ID inválido' });
    }
    if (![0, 1].includes(isActive)) {
        return res.status(400).json({ error: 'isActive inválido' });
    }

    db.run('UPDATE producto SET is_active = ? WHERE id_prod = ?;', [isActive, id], function (err) {
        if (err) {
            console.error('Error actualizando estado activo:', err.message);
            return res.status(500).json({ error: 'Error al actualizar el estado del producto' });
        }
        if (!this.changes) return res.status(404).json({ error: 'Producto no encontrado' });

        db.get(
            `SELECT id_prod AS id, name, price, imageURL AS imageUrl, category, sDescription AS sDescription, description, inStock, COALESCE(is_active,1) AS isActive FROM producto WHERE id_prod = ?;`,
            [id],
            (getErr, row) => {
                if (getErr) {
                    return res.status(500).json({ error: 'Estado actualizado, pero no se pudo leer el producto' });
                }
                return res.json(row);
            }
        );
    });
};

const updateProductStock = (req, res) => {
    const id = Number(req.params.id);
    const inStockRaw = req.body?.inStock;
    const inStock = Number(inStockRaw);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'ID de producto inválido' });
    }
    if (!Number.isFinite(inStock) || !Number.isInteger(inStock) || inStock < 0) {
        return res.status(400).json({ error: 'Stock inválido (debe ser entero >= 0)' });
    }

    db.run('UPDATE producto SET inStock = ? WHERE id_prod = ?;', [inStock, id], function (err) {
        if (err) {
            console.error('Error actualizando stock:', err.message);
            return res.status(500).json({ error: 'Error al actualizar el stock' });
        }

        if (!this.changes) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        db.get(
            `SELECT
                id_prod AS id,
                name,
                price,
                imageURL AS imageUrl,
                category,
                sDescription AS sDescription,
                description,
                inStock,
                COALESCE(is_active,1) AS isActive
             FROM producto
             WHERE id_prod = ?;`,
            [id],
            (getErr, row) => {
                if (getErr) {
                    console.error('Error leyendo producto actualizado:', getErr.message);
                    return res.status(500).json({ error: 'Stock actualizado, pero no se pudo leer el producto' });
                }
                return res.json(row);
            }
        );
    });
};

module.exports = { getProductos, getProductosAdmin, getProductoById, createProduct, updateProduct, deleteProduct, setProductActive, updateProductStock };
