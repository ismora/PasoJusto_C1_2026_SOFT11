const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Usuario = require('../models/usuario.model');
const Producto = require('../models/producto.model');

// Almacén temporal de tokens (en producción usar Redis o colección con expiración)
const tokens = new Map();

// Generar token único para un producto
router.post('/generar-qr', async (req, res) => {
    const { correo, productoId } = req.body;
    if (!correo || !productoId) return res.status(400).json({ msj: 'Datos incompletos' });
    const usuario = await Usuario.findOne({ correo });
    const producto = await Producto.findById(productoId);
    if (!usuario || !producto) return res.status(404).json({ msj: 'Usuario o producto no existe' });
    // Verificar puntos suficientes (opcional, se vuelve a validar al canjear)
    const puntosUsados = usuario.productosCanjeados.reduce((sum, p) => sum + p.puntosNecesarios, 0);
    const disponibles = usuario.puntosAsignados - puntosUsados;
    if (disponibles < producto.puntosNecesarios) {
        return res.status(400).json({ msj: 'Puntos insuficientes' });
    }
    const token = crypto.randomBytes(32).toString('hex');
    tokens.set(token, {
        correo,
        productoId,
        productoNombre: producto.nombre,
        puntos: producto.puntosNecesarios,
        expira: Date.now() + 10 * 60 * 1000 // 10 minutos
    });
    res.json({ token });
});

// Canjear producto mediante token QR
router.post('/canjear', async (req, res) => {
    const { token } = req.body;
    const data = tokens.get(token);
    if (!data) return res.status(400).json({ msj: 'Token inválido o expirado' });
    if (Date.now() > data.expira) {
        tokens.delete(token);
        return res.status(400).json({ msj: 'Token expirado' });
    }
    const usuario = await Usuario.findOne({ correo: data.correo });
    const producto = await Producto.findById(data.productoId);
    if (!usuario || !producto) return res.status(404).json({ msj: 'Usuario o producto no existe' });
    // Recalcular puntos disponibles
    let puntosCanjeados = 0;
    for (let pid of usuario.productosCanjeados) {
        const p = await Producto.findById(pid);
        if (p) puntosCanjeados += p.puntosNecesarios;
    }
    const disponibles = usuario.puntosAsignados - puntosCanjeados;
    if (disponibles < producto.puntosNecesarios) {
        return res.status(400).json({ msj: 'Ya no tienes suficientes puntos' });
    }
    usuario.productosCanjeados.push(producto._id);
    await usuario.save();
    tokens.delete(token);
    res.json({ mensaje: 'Canje exitoso', puntosSpent: producto.puntosNecesarios });
});

// Historial de canjes de un usuario
router.get('/historial/:correo', async (req, res) => {
    const usuario = await Usuario.findOne({ correo: req.params.correo }).populate('productosCanjeados');
    if (!usuario) return res.status(404).json({ msj: 'Usuario no encontrado' });
    const historial = usuario.productosCanjeados.map(p => ({
        productName: p.nombre,
        pointsSpent: p.puntosNecesarios,
        date: p.createdAt || new Date()
    }));
    res.json(historial);
});

module.exports = router;