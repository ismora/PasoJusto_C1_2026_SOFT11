const express = require('express'); 
const mongoose = require('mongoose'); 
const cors = require('cors'); 
const bodyParser = require('body-parser'); 
require('dotenv').config(); 

const app = express(); 
const PORT = process.env.PORT || 3000; 

// Importación de rutas
const usuarioRoute = require("./routes/usuario.route");
const productoRoute = require("./routes/producto.route");

app.use(express.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(cors());

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(()=> console.log('MongoDB Atlas conectado'))
.catch(error => console.log('Ocurrió un error al conectarse con MongoDB: ', error));

// Rutas
app.use("/usuarios", usuarioRoute); 
app.use("/productos", productoRoute); 

app.get('/', (req,res)=> {
    res.send('Servidor en funcionamiento');
});

app.listen(PORT, ()=>{
    console.log('Servidor corriendo en http://localhost:' + PORT);
});