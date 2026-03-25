const db= require('..</config/db');
const getproductos = (require)=>{
    const sql = 'SELECT * FROM productos';
    db.query(sql,(err,results)=>{
        if(err)
            return results.status(500).json({error: 'Error al obtener los productos'});
        results.json(results);

    });

}