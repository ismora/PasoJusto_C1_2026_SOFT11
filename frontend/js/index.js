// Configuración
const API_URL = "http://localhost:3000";
let currentUser = null; // { correo, nombre }

// Elementos DOM
const loginBtn = document.getElementById("loginBtn");
const correoInput = document.getElementById("correoInput");
const nombreInput = document.getElementById("nombreInput");
const userNameSpan = document.getElementById("userNameDisplay");
const requestBtn = document.getElementById("requestCourtesyBtn");
const ubicacionInput = document.getElementById("ubicacionInput");
const productosContainer = document.getElementById("productos-container");

// Helper toast (simple)
function showToast(msg, isError = false) {
    const toastDiv = document.createElement("div");
    toastDiv.className = `alert alert-${isError ? 'danger' : 'success'} position-fixed bottom-0 end-0 m-3`;
    toastDiv.style.zIndex = 9999;
    toastDiv.innerHTML = msg;
    document.body.appendChild(toastDiv);
    setTimeout(() => toastDiv.remove(), 3000);
}

// Login / registro
async function loginOrRegister() {
    const correo = correoInput.value.trim();
    const nombre = nombreInput.value.trim();
    if (!correo || !nombre) return showToast("Correo y nombre requeridos", true);
    try {
        const res = await fetch(`${API_URL}/usuarios/rose@test.ac.cr`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        if (res.ok) {
            currentUser = { correo: data.correo, nombre: data.nombre };
            userNameSpan.innerText = data.nombre;
            showToast(`Bienvenido ${data.nombre}`);
            loadAllData();
        } else {
            showToast(data.msj || "Error", true);
        }
    } catch (err) {
        showToast("Error de conexión", true);
    }
}

// Carga completa
async function loadAllData() {
    if (!currentUser) return;
    await Promise.all([loadPoints(), loadPendingRequests(), loadProductsAndCommerce(), loadRedemptionHistory()]);
}

// Puntos
async function loadPoints() {
    try {
        const res = await fetch(`${API_URL}/usuarios/rose@test.ac.cr`);
        const data = await res.json();
        document.getElementById("asignadosPoints").innerText = data.puntosDisponibles + data.puntosDisponibles;
        document.getElementById("canjeadosPoints").innerText = data.puntosCanjeados;
        document.getElementById("disponiblesPoints").innerText = data.puntosDisponibles;
    } catch (err) { console.error(err); }
}

// Solicitudes activas
async function loadPendingRequests() {
    try {
        const res = await fetch(`${API_URL}/cortesia`);
        const requests = await res.json();
        const container = document.getElementById("pendingRequestsList");
        if (!requests.length) {
            container.innerHTML = '<p class="text-muted"> No hay solicitudes activas.</p>';
            return;
        }
        container.innerHTML = "";
        requests.forEach(req => {
            const div = document.createElement("div");
            div.className = "request-item";
            div.innerHTML = `
                <div><strong>${req.ubicacion}</strong></div>
                <div class="small text-secondary">Solicitante: ${req.usuarioId?.nombre || 'Anónimo'}</div>
                <button class="btn btn-sm btn-success mt-2" data-id="${req._id}">Ceder el paso → +10 pts</button>
            `;
            const btn = div.querySelector("button");
            btn.addEventListener("click", () => respondToRequest(req._id));
            container.appendChild(div);
        });
    } catch (err) { console.error(err); }
}

async function respondToRequest(requestId) {
    if (!currentUser) return showToast("Inicia sesión", true);
    try {
        const res = await fetch(`${API_URL}/cortesia/${requestId}/responder`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ correoRespuesta: currentUser.correo })
        });
        const data = await res.json();
        if (res.ok) {
            showToast(`¡Cedió el paso! Ganó ${data.puntosEarned} puntos.`);
            loadPoints();
            loadPendingRequests();
        } else {
            showToast(data.msj || "Error", true);
        }
    } catch (err) { showToast("Error al responder", true); }
}

async function createCourtesyRequest() {
    if (!currentUser) return showToast("Iniciar sesión", true);
    const ubicacion = ubicacionInput.value.trim() || "Intersección no especificada";
    try {
        const res = await fetch(`${API_URL}/cortesia`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ubicacion, correoUsuario: currentUser.correo })
        });
        if (res.ok) {
            showToast("Solicitud enviada a conductores cercanos");
            ubicacionInput.value = "";
            loadPendingRequests();
        } else {
            const err = await res.json();
            showToast(err.msj || "Error", true);
        }
    } catch (err) { showToast("Error al crear solicitud", true); }
}

// Productos con colores (usando tu lógica)
async function loadProductsAndCommerce() {
    try {
        const [prodRes, userRes] = await Promise.all([
            fetch(`${API_URL}/productos`),
            fetch(`${API_URL}/usuarios/rose@test.ac.cr`)
        ]);
        const productos = await prodRes.json();
        const usuario = await userRes.json();
        const puntosDisponibles = usuario.puntosDisponibles || 0;

        if (!productos.length) {
            productosContainer.innerHTML = `<div class="col-12"><div class="alert alert-warning">No hay productos registrados.</div></div>`;
            return;
        }

        productosContainer.innerHTML = "";
        productos.forEach((producto, idx) => {
            const puntosReq = producto.puntosNecesarios;
            let colorClass = "";
            let estadoTexto = "";
            if (puntosDisponibles >= puntosReq) {
                colorClass = "verde";
                estadoTexto = "Disponible";
            } else {
                const faltante = puntosReq - puntosDisponibles;
                const porcentajeFaltante = (faltante / puntosReq) * 100;
                if (porcentajeFaltante < 50) {
                    colorClass = "naranja";
                    estadoTexto = "Cercano";
                } else {
                    colorClass = "rojo";
                    estadoTexto = "Lejano";
                }
            }
            const puedeCanjear = colorClass === "verde";
            const porcentajeCompletado = (puntosDisponibles / puntosReq) * 100;

            const col = document.createElement("div");
            col.className = "col-md-6 col-lg-4 mb-4 producto-card-animado";
            col.style.animationDelay = `${idx * 0.05}s`;
            col.innerHTML = `
                <div class="card card-producto producto-${colorClass} h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start">
                            <h5 class="card-title">${producto.nombre}</h5>
                            <span class="estado-producto estado-${colorClass}">${estadoTexto}</span>
                        </div>
                        <div class="my-3">
                            <div class="d-flex justify-content-between">
                                <span>Puntos requeridos:</span>
                                <span class="badge puntos-badge ${puedeCanjear ? 'bg-success' : 'bg-secondary'}">${puntosReq} <i class="fas fa-coins"></i></span>
                            </div>
                            <div class="progress mt-2" style="height: 8px;">
                                <div class="progress-bar ${puedeCanjear ? 'bg-success' : (colorClass === 'naranja' ? 'bg-warning' : 'bg-danger')}" 
                                     style="width: ${Math.min(100, porcentajeCompletado)}%"></div>
                            </div>
                            <div class="d-flex justify-content-between small mt-1">
                                <span>${puntosDisponibles} disponibles</span>
                                <span>${puntosReq} necesarios</span>
                            </div>
                        </div>
                        ${!puedeCanjear ? `
                            <div class="alert alert-${colorClass === 'naranja' ? 'warning' : 'danger'} py-2">
                                <i class="fas ${colorClass === 'naranja' ? 'fa-exclamation-triangle' : 'fa-times-circle'} me-2"></i>
                                Le faltan <strong>${puntosReq - puntosDisponibles} puntos</strong>
                            </div>
                        ` : ''}
                        <div class="comercio-info">
                            <i class="fas fa-store me-2"></i><strong>Comercio:</strong> ${producto.comercio}
                        </div>
                        <button class="btn btn-sm btn-primary mt-3 w-100 generate-qr-btn" 
                                data-id="${producto._id}" data-name="${producto.nombre}" data-cost="${puntosReq}">
                            <i class="fas fa-qrcode me-1"></i> Generar QR para canje
                        </button>
                    </div>
                </div>
            `;
            productosContainer.appendChild(col);
        });

        // Eventos QR
        document.querySelectorAll(".generate-qr-btn").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const prodId = btn.getAttribute("data-id");
                const prodName = btn.getAttribute("data-name");
                const prodCost = parseInt(btn.getAttribute("data-cost"));
                await generarQR(prodId, prodName, prodCost);
            });
        });
    } catch (err) {
        console.error(err);
        productosContainer.innerHTML = `<div class="col-12"><div class="alert alert-danger">Error cargando productos</div></div>`;
    }
}

// QR y canje
let currentToken = null;
let qrModal;
async function generarQR(productoId, productName, productCost) {
    if (!currentUser) return showToast("Inicia sesión", true);
    try {
        const res = await fetch(`${API_URL}/canje/generar-qr`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ correo: currentUser.correo, productoId })
        });
        const data = await res.json();
        if (res.ok && data.token) {
            currentToken = data.token;
            mostrarModalQR(currentToken, productName, productCost);
        } else {
            showToast(data.msj || "No se pudo generar QR", true);
        }
    } catch (err) {
        showToast("Error al generar QR", true);
    }
}

function mostrarModalQR(token, productName, productCost) {
    if (!qrModal) qrModal = new bootstrap.Modal(document.getElementById("qrModal"));
    const qrContainer = document.getElementById("qrCodeContainer");
    qrContainer.innerHTML = "";
    new QRCode(qrContainer, { text: token, width: 200, height: 200 });
    const confirmBtn = document.getElementById("confirmRedeemBtn");
    const newConfirm = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);
    newConfirm.addEventListener("click", async () => {
        if (!currentToken) return;
        const res = await fetch(`${API_URL}/canje/canjear`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: currentToken })
        });
        const result = await res.json();
        if (res.ok) {
            showToast(`Canje exitoso! Se descontaron ${result.puntosSpent} puntos.`);
            qrModal.hide();
            loadPoints();
            loadProductsAndCommerce();
            loadRedemptionHistory();
            currentToken = null;
        } else {
            showToast(result.msj || "Error al canjear", true);
        }
    });
    qrModal.show();
}

async function loadRedemptionHistory() {
    if (!currentUser) return;
    try {
        const res = await fetch(`${API_URL}/canje/historial/${currentUser.correo}`);
        const history = await res.json();
        const container = document.getElementById("redemptionHistoryList");
        if (!history.length) {
            container.innerHTML = '<p class="text-muted">✖️ Aún no ha canjeado productos.</p>';
            return;
        }
        container.innerHTML = history.map(h => `
            <div class="border-bottom py-2">
                <i class="fas fa-gift text-success me-2"></i>
                <strong>${h.productName}</strong> - ${h.pointsSpent} pts - ${new Date(h.date).toLocaleDateString()}
            </div>
        `).join('');
    } catch (err) { console.error(err); }
}

// Event listeners
loginBtn.addEventListener("click", loginOrRegister);
requestBtn.addEventListener("click", createCourtesyRequest);

// Inicializar sesión guardada
const savedCorreo = localStorage.getItem("pasoJusto_correo");
const savedNombre = localStorage.getItem("pasoJusto_nombre");
if (savedCorreo && savedNombre) {
    correoInput.value = savedCorreo;
    nombreInput.value = savedNombre;
    loginOrRegister().then(() => {
        if (currentUser) {
            localStorage.setItem("pasoJusto_correo", currentUser.correo);
            localStorage.setItem("pasoJusto_nombre", currentUser.nombre);
        }
    });
} else {
    loginOrRegister().then(() => {
        if (currentUser) {
            localStorage.setItem("pasoJusto_correo", currentUser.correo);
            localStorage.setItem("pasoJusto_nombre", currentUser.nombre);
        }
    });
}