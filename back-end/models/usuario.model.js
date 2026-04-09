const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schemaUsuario = new mongoose.Schema({
    correo: {
        type: String,
        required: true,
        unique: true
    },
    nombre: {
        type: String,
        required: true,
        unique: false
    },
    puntosDisponibles: {
        type: Number,
        default: 0
    },
    puntosCanjeados: {
        type: Number,
        default: 0
    },
    productosCanjeados: [
        {
            type: Schema.Types.ObjectId,
            ref: "Producto"
        }
    ]
},
    {
        timestamps: true
    });


const Usuario = mongoose.model("Usuario", schemaUsuario);
module.exports = Usuario; 