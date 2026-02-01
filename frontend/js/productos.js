// Elementos DOM
const productosContainer = document.getElementById("productos-container");
const puntosDisponiblesElement = document.getElementById("puntosDisponibles");
const puntosCanjeadosElement = document.getElementById("puntosCanjeados");
const puntosTotalesElement = document.getElementById("puntosTotales");
const nombreUsuarioElement = document.getElementById("nombreUsuario");
const correoUsuarioElement = document.getElementById("correoUsuario");

// Variables globales
let usuario = null;
let productos = [];
let puntosDisponibles = 0;

// Configuración
const CORREO_USUARIO = "rose@test.ac.cr"; // En una aplicación real, esto vendría de la sesión

// URLs de la API
const API_URL = "http://localhost:3000";
const USUARIO_URL = `${API_URL}/usuarios/${CORREO_USUARIO}`;
const PRODUCTOS_URL = `${API_URL}/productos`;

// Función para cargar datos del usuario
async function cargarDatosUsuario() {
    try {
        const response = await fetch(USUARIO_URL, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        usuario = await response.json();
        
        // Actualizar UI con datos del usuario
        actualizarDatosUsuarioUI();
        
        return usuario;
    } catch (error) {
        console.error("Error cargando datos del usuario:", error);
        mostrarError("No se pudieron cargar los datos del usuario. Por favor, intenta nuevamente.");
        return null;
    }
}

// Función para cargar productos
async function cargarProductos() {
    try {
        const response = await fetch(PRODUCTOS_URL, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        productos = await response.json();
        return productos;
    } catch (error) {
        console.error("Error cargando productos:", error);
        mostrarError("No se pudieron cargar los productos. Por favor, intenta nuevamente.");
        return [];
    }
}

// Función para actualizar UI con datos del usuario
function actualizarDatosUsuarioUI() {
    if (!usuario) return;
    
    nombreUsuarioElement.textContent = usuario.nombre || "No disponible";
    correoUsuarioElement.textContent = usuario.correo || "No disponible";
    
    puntosDisponibles = usuario.puntosDisponibles || 0;
    const puntosCanjeados = usuario.puntosCanjeados || 0;
    const puntosTotales = puntosDisponibles + puntosCanjeados;
    
    puntosDisponiblesElement.textContent = puntosDisponibles;
    puntosCanjeadosElement.textContent = puntosCanjeados;
    puntosTotalesElement.textContent = puntosTotales;
    
}

// Función para determinar el color del producto según puntos disponibles
function determinarColorProducto(puntosRequeridos) {
    if (!usuario) return "rojo";
    
    const puntosDisponibles = usuario.puntosDisponibles || 0;
    
    if (puntosDisponibles >= puntosRequeridos) {
        return "verde"; // Disponible para canjear
    } else {
        const puntosFaltantes = puntosRequeridos - puntosDisponibles;
        const porcentajeFaltante = (puntosFaltantes / puntosRequeridos) * 100;
        
        if (porcentajeFaltante < 50) {
            return "naranja"; // Falta menos del 50%
        } else {
            return "rojo"; // Falta más del 50%
        }
    }
}

// Función para obtener el texto del estado según el color
function obtenerTextoEstado(color) {
    switch(color) {
        case "verde":
            return "Disponible";
        case "naranja":
            return "Cercano";
        case "rojo":
            return "Lejano";
        default:
            return "No disponible";
    }
}

// Función para renderizar productos
function renderizarProductos() {
    productosContainer.innerHTML = "";
    
    // Mostrar mensaje si no hay productos
    if (productos.length === 0) {
        productosContainer.innerHTML = `
            <div class="col-12">
                <div class="no-productos">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <h4>No hay productos disponibles</h4>
                    <p>No se encontraron productos para mostrar.</p>
                </div>
            </div>
        `;
        return;
    }
    
    // Crear cards para cada producto
    productos.forEach((producto, index) => {
        const colorProducto = determinarColorProducto(producto.puntosNecesarios || 0);
        const textoEstado = obtenerTextoEstado(colorProducto);
        const puedeCanjear = colorProducto === "verde";
        const puntosFaltantes = Math.max(0, (producto.puntosNecesarios || 0) - puntosDisponibles);
        const porcentajeCompletado = puntosDisponibles / (producto.puntosNecesarios || 1) * 100;
        
        // Crear elemento del producto
        const productoElement = document.createElement("div");
        productoElement.className = "col-md-6 col-lg-4 mb-4 producto-card-animado";
        productoElement.style.animationDelay = `${index * 0.05}s`;
        
        productoElement.innerHTML = `
            <div class="card card-producto producto-${colorProducto}">
                <div class="card-body">
                    <div class="producto-header">
                        <div class="d-flex justify-content-between align-items-start">
                            <h5 class="card-title mb-1">${producto.nombre || "Producto sin nombre"}</h5>
                            <span class="estado-producto estado-${colorProducto}">${textoEstado}</span>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <div class="d-flex align-items-center justify-content-between mb-2">
                            <span class="text-muted">Puntos requeridos:</span>
                            <span class="badge puntos-badge ${puedeCanjear ? 'bg-success' : 'bg-secondary'}">
                                ${producto.puntosNecesarios || 0} <i class="fas fa-coins ms-1"></i>
                            </span>
                        </div>
                        
                        <div class="progress mb-2" style="height: 10px;">
                            <div class="progress-bar ${puedeCanjear ? 'bg-success' : colorProducto === 'naranja' ? 'bg-warning' : 'bg-danger'}" 
                                 role="progressbar" 
                                 style="width: ${Math.min(100, porcentajeCompletado)}%;" 
                                 aria-valuenow="${porcentajeCompletado}" 
                                 aria-valuemin="0" 
                                 aria-valuemax="100">
                            </div>
                        </div>
                        
                        <div class="d-flex justify-content-between small">
                            <span>${puntosDisponibles} puntos disponibles</span>
                            <span>${producto.puntosNecesarios || 0} necesarios</span>
                        </div>
                    </div>
                    
                    ${!puedeCanjear ? `
                        <div class="alert alert-${colorProducto === 'naranja' ? 'warning' : 'danger'} py-2 mb-3">
                            <i class="fas ${colorProducto === 'naranja' ? 'fa-exclamation-triangle' : 'fa-times-circle'} me-2"></i>
                            Te faltan <strong>${puntosFaltantes} puntos</strong> para canjear este producto
                        </div>
                    ` : ''}
                    
                    <div class="comercio-info">
                        <p class="mb-0"><i class="fas fa-store me-2"></i><strong>Comercio:</strong> ${producto.comercio || "No especificado"}</p>
                    </div>
                </div>
            </div>
        `;
        
        productosContainer.appendChild(productoElement);
    });
}

// Función para mostrar error
function mostrarError(mensaje) {
    productosContainer.innerHTML = `
        <div class="col-12">
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>Error:</strong> ${mensaje}
            </div>
        </div>
    `;
}

// Función para actualizar todos los datos
async function actualizarDatos() {
    // Cargar datos
    await Promise.all([cargarDatosUsuario(), cargarProductos()]);
    
    // Renderizar productos
    renderizarProductos();
}

actualizarDatos();