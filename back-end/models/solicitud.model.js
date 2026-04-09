const mongoose = require('mongoose');

const solicitudSchema = new mongoose.Schema({
    ubicacion: { 
        type: String,
        required: true 
    },
    usuarioId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Usuario', required: true 
    },
    estado: { 
        type: String,
        default: 'activa' 
    }, 
    createdAt: { 
        type: Date,
        default: Date.now 
    }
});

module.exports = mongoose.model('Solicitud', solicitudSchema);