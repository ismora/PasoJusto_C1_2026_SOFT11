const express = require("express");
const router = express.Router();
const Usuario = require("../models/usuario.model");
const Producto = require("../models/producto.model");

// POST: Crear un usuario
router.post("/", async (req, res) => {
    const { correo, nombre } = req.body;

    if (!correo || !nombre) {
        return res.status(400).json({ msj: "Todos los campos son obligatorios" });
    }
    try {
        const nuevoUsuario = new Usuario({ correo, nombre });
        await nuevoUsuario.save();
        res.status(201).json(nuevoUsuario);
    } catch (error) {
        res.status(400).json({ msj: error.message });
    }

});

router.get("/", async (req, res) => {
    try {
        const usuarios = await Usuario.find().populate("productosCanjeados");
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ msj: error.message });
    }

});

router.get("/:correo", async (req, res) => {
    const { correo } = req.params;

    if (!correo) {
        return res.status(400).json({ msj: "El correo es obligatorio" });
    }

    try {
        const usuario = await Usuario
            .findOne({ correo })
            .populate("productosCanjeados");

        if (!usuario) {
            return res.status(404).json({ msj: "Usuario no encontrado" });
        }

        res.json(usuario);
    } catch (error) {
        res.status(500).json({ msj: error.message });
    }
});

/*
http://localhost:3000/usuarios/rose@test.ac.cr
*/

router.get('/:correo/puntos', async (req, res) => {
    try {
        const usuario = await Usuario.findOne({ correo: req.params.correo }).populate('productosCanjeados');
        if (!usuario) return res.status(404).json({ msj: 'Usuario no existe' });
        let puntosCanjeados = 0;
        for (let prod of usuario.productosCanjeados) {
            puntosCanjeados += prod.puntosNecesarios;
        }
        const disponibles = usuario.puntosAsignados - puntosCanjeados;
        res.json({
            asignados: usuario.puntosAsignados,
            canjeados: puntosCanjeados,
            disponibles: disponibles
        });
    } catch (error) {
        res.status(500).json({ msj: error.message });
    }
});

module.exports = router;