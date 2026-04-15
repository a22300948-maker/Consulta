const db= require('../config/db');
const getProductos = (req,res)=>{
    const sql = 'SELECT * FROM productos';
    db.query(sql,(err,results)=>{
        if(err)
            return res.status(500).json({error: 'Error al obtener los productos'});
        res.json(results);
    });
}
module.exports = {getProductos};
