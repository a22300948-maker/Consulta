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
module.exports = {getProductos};
