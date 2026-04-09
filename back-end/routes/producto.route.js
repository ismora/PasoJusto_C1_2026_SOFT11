const express = require("express");
const router = express.Router();
const Producto = require("../models/producto.model");

// Registrar un nuevo producto
router.post("/", async (req, res) => {
    const { nombre, comercio, puntosNecesarios } = req.body;

    if (!nombre || !comercio || puntosNecesarios == null) {
        return res.status(400).json({ 
            msj: "Todos los campos son obligatorios" 
        });
    }

    try {
        const nuevoProducto = new Producto(req.body);
        const productoGuardado = await nuevoProducto.save();
        res.status(201).json(productoGuardado); 
    } catch (error) {
        res.status(400).json({ msj: "Error al crear el producto", error });
    }
});

/* {
"nombre": "Python",
"comercio": "CENFOTEC",
"puntosNecesarios": 10
} */

// Endpoint GET: Obtener todas las productos
router.get("/", async (req, res) => {
    try {
        const productos = await Producto.find();
        res.json(productos);
    } catch (error) {
        res.status(500).json({ msj: "Error al obtener los productos", error });
    }
});

module.exports = router;