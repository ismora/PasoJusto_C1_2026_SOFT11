const express = require('express');
const router = express.Router();
const Solicitud = require('../models/solicitud.model');
const Usuario = require('../models/usuario.model');

// Crear una solicitud de cortesía
router.post('/', async (req, res) => {
    const { ubicacion, correoUsuario } = req.body;
    if (!ubicacion || !correoUsuario) return res.status(400).json({ msj: 'Faltan datos' });
    const usuario = await Usuario.findOne({ correo: correoUsuario });
    if (!usuario) return res.status(404).json({ msj: 'Usuario no existe' });
    const solicitud = new Solicitud({ ubicacion, usuarioId: usuario._id });
    await solicitud.save();
    res.status(201).json(solicitud);
});

// Obtener solicitudes activas
router.get('/', async (req, res) => {
    const solicitudes = await Solicitud.find({ estado: 'activa' }).populate('usuarioId', 'nombre correo');
    res.json(solicitudes);
});

// Responder a una solicitud (ceder el paso)
router.post('/:id/responder', async (req, res) => {
    const { correoRespuesta } = req.body;
    const solicitud = await Solicitud.findById(req.params.id);
    if (!solicitud) return res.status(404).json({ msj: 'Solicitud no existe' });
    if (solicitud.estado !== 'activa') return res.status(400).json({ msj: 'Ya fue atendida' });
    const usuarioResp = await Usuario.findOne({ correo: correoRespuesta });
    if (!usuarioResp) return res.status(404).json({ msj: 'Usuario no encontrado' });
    if (solicitud.usuarioId.toString() === usuarioResp._id.toString()) {
        return res.status(400).json({ msj: 'No puedes responder tu propia solicitud' });
    }
    // Otorgar 10 puntos
    usuarioResp.puntosAsignados += 10;
    await usuarioResp.save();
    solicitud.estado = 'atendida';
    await solicitud.save();
    res.json({ puntosEarned: 10, mensaje: 'Cortesía registrada' });
});

module.exports = router;