const db= require('../config/db');
const getProductos = (req,res)=>{
    const sql = `
        SELECT
            id_prod AS id,
            name,
            price,
            imageURL AS imageUrl,
            category,
            sDescription AS sDescription,
            description,
            inStock
        FROM producto
    `;
    db.query(sql,(err,results)=>{
        if(err)
            return res.status(500).json({error: 'Error al obtener los productos'});
        res.json(results);
    });
}

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
                inStock
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

module.exports = { getProductos, updateProductStock };
