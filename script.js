// ==========================================
// 1. CONFIGURACIÓN Y DATOS DE PRODUCTOS
// ==========================================

// Usamos let para poder reasignar los valores cuando llegue el JSON
let misProductos = [];
let productosFiltrados = [];

async function cargarProductos() {
    try {
        const respuesta = await fetch('./productos.json');
        
        // Verificamos que el fetch haya sido exitoso
        if (!respuesta.ok) throw new Error('Error al cargar el JSON');
        
        // Guardamos los datos base del JSON
        const productosBase = await respuesta.json();
        
        // CREAMOS ID ÚNICOS PARA TODOS 
        misProductos = Array.from({ length: (productosBase.length) }, (_, index) => {
            const productoBase = productosBase[index % productosBase.length];
            return { 
                ...productoBase,
                id: index + 1 
            };
        });

        // Inicializamos los productos filtrados con todos los productos
        productosFiltrados = [...misProductos];
        
        // Una vez que tenemos los datos procesados, dibujamos la página
        renderizarPagina();
    } catch (error) {
        console.error("Hubo un problema cargando los productos:", error);
        if (DOM.recipeGrid) {
            DOM.recipeGrid.innerHTML = '<p style="text-align:center; padding: 2rem;">Error al cargar los productos. Asegúrate de estar usando un servidor local (Live Server).</p>';
        }
    }
}


// ==========================================
// 2. REFERENCIAS AL DOM
// ==========================================

const DOM = {
    recipeGrid: document.getElementById('recipeGrid'),
    searchInput: document.getElementById('searchInput'),
    emptyState: document.getElementById('emptyState'),
    paginationContainer: document.getElementById('paginationContainer'),
    openCartBtn: document.getElementById('openCartBtn'),
    closeCartBtn: document.getElementById('closeCartBtn'),
    cartDrawer: document.getElementById('cartDrawer'),
    cartOverlay: document.getElementById('cartOverlay'),
    cartCount: document.getElementById('cartCount'),
    cartItemsContainer: document.getElementById('cartItemsContainer'),
    cartTotalAmount: document.getElementById('cartTotalAmount'),
};


// ==========================================
// 3. ESTADO GLOBAL
// ==========================================

let paginaActual = 1;
const itemsPorPagina = 12;
let carrito = JSON.parse(localStorage.getItem('carritoCapibara')) || [];


// ==========================================
// 4. RENDERIZADO DE PRODUCTOS
// ==========================================

function crearTarjetaProducto(producto) {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'card';
    // AQUÍ ES IMPORTANTE QUE EL ID SEA EL QUE CORRESPONDE
    tarjeta.setAttribute('data-product-id', producto.id);
    tarjeta.setAttribute('data-product-name', producto.nombre);

    tarjeta.innerHTML = `
        <div class="card-image-wrapper">
            <img src="${producto.img || './assets/LogoCapibaraSF.png'}" alt="${producto.nombre}">
            <div class="card-gradient"></div>
        </div>
        <div class="card-content">
            <span class="card-brand">${producto.marca || ''}</span>
            <h2 class="card-title">${producto.nombre}</h2>
            <div class="card-specs">
                <span class="spec-tag"><strong>Modelo:</strong> ${producto.modelo || 'N/D'}</span>
                <span class="spec-tag"><strong>Capacidad:</strong> ${producto.capacidad || 'N/D'}</span>
                <span class="spec-tag"><strong>Otros:</strong> ${producto.otros || 'N/D'}</span>
            </div>
            <p class="card-description-text">${producto.descripcion || ''}</p>
            <p class="card-price">$${producto.precio}</p>
            <div class="card-footer">
                <p class="card-price">$${producto.precio}</p>
                <button class="card-button" data-id="${producto.id}">Comprar</button>
            </div>
        </div>
    `;

    const btnComprar = tarjeta.querySelector('.card-button');
    btnComprar.addEventListener('click', (e) => {
        e.stopPropagation();
        agregarAlCarro(producto.id);
    });

    return tarjeta;
}

function renderizarProductos(productos = []) {
    if (!DOM.recipeGrid) return;
    
    DOM.recipeGrid.innerHTML = '';
    const isEmpty = productos.length === 0;

    if (DOM.emptyState) {
        DOM.emptyState.style.display = isEmpty ? 'block' : 'none';
    }
    if (isEmpty) return;

    const fragment = document.createDocumentFragment();
    productos.forEach(producto => {
        fragment.appendChild(crearTarjetaProducto(producto));
    });

    DOM.recipeGrid.appendChild(fragment);
}


// ==========================================
// 5. LÓGICA DE PAGINACIÓN
// ==========================================

const crearBotonPaginacion = (texto, claseExtra, onClick, isDisabled = false) => {
    const btn = document.createElement('button');
    btn.textContent = texto;
    btn.className = `pCbutton ${claseExtra}`;
    btn.disabled = isDisabled;
    if (onClick) btn.addEventListener('click', onClick);
    return btn;
};

function renderizarBotonesPaginacion() {
    if (!DOM.paginationContainer) return;
    
    DOM.paginationContainer.innerHTML = ''; 
    const totalPaginas = Math.ceil(productosFiltrados.length / itemsPorPagina);
    
    if (totalPaginas <= 1) return;
    
    const fragment = document.createDocumentFragment();
    const esMovil = window.innerWidth <= 557.8;

    // Botón Anterior
    fragment.appendChild(crearBotonPaginacion('<', 'nav-btn', () => {
        if (paginaActual > 1) {
            paginaActual--;
            renderizarPagina();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, paginaActual === 1));

    // Cálculo de páginas a mostrar
    let paginas = [];
    if (esMovil && totalPaginas > 4) {
        if (paginaActual <= 2) {
            paginas = [1, 2, '...', totalPaginas];
        } else if (paginaActual >= totalPaginas - 1) {
            paginas = [1, '...', totalPaginas - 1, totalPaginas];
        } else {
            paginas = [1, '...', paginaActual, '...', totalPaginas];
        }
    } else {
        paginas = Array.from({ length: totalPaginas }, (_, i) => i + 1);
    }

    // Renderizado de números y elipses
    paginas.forEach(p => {
        if (p === '...') {
            fragment.appendChild(crearBotonPaginacion('...', 'ellipsis', null, true));
        } else {
            const isActive = p === paginaActual;
            const btn = crearBotonPaginacion(p, isActive ? 'active' : '', () => {
                paginaActual = p;
                renderizarPagina();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            if (isActive) btn.id = 'pCbutton-ActiveAndPrev';
            fragment.appendChild(btn);
        }
    });

    // Botón Siguiente
    fragment.appendChild(crearBotonPaginacion('>', 'nav-btn', () => {
        if (paginaActual < totalPaginas) {
            paginaActual++;
            renderizarPagina();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, paginaActual === totalPaginas));

    DOM.paginationContainer.appendChild(fragment);
}

function renderizarPagina() {
    const inicio = (paginaActual - 1) * itemsPorPagina;
    const fin = inicio + itemsPorPagina;
    const productosParaMostrar = productosFiltrados.slice(inicio, fin);
    
    renderizarProductos(productosParaMostrar);
    renderizarBotonesPaginacion();
}


// ==========================================
// 6. FILTROS Y BÚSQUEDA
// ==========================================

const fieldIncludes = (fieldValue, query) =>
    fieldValue ? String(fieldValue).toLowerCase().includes(query) : false;

function handleSearch(e) {
    const query = e.target.value.toLowerCase().trim();

    productosFiltrados = misProductos.filter(producto =>
        fieldIncludes(producto.nombre, query) ||
        fieldIncludes(producto.precio, query) ||
        fieldIncludes(producto.marca, query)
    );

    paginaActual = 1; 
    renderizarPagina();
}


// ==========================================
// 7. GESTIÓN DEL CARRITO DE COMPRAS
// ==========================================

function agregarAlCarro(id) {
    const productoEncontrado = misProductos.find(item => item.id == id);
    if (!productoEncontrado) return;

    const existe = carrito.find(item => item.id == id);

    if (existe) {
        existe.cantidad += 1;
    } else {
        carrito.push({
            id: productoEncontrado.id,
            nombre: productoEncontrado.nombre,
            precio: Number(productoEncontrado.precio) || 0,
            img: productoEncontrado.img || './assets/LogoCapibaraSF.png',
            cantidad: 1
        });
    }

    actualizarCarritoUI();
}

function eliminarDelCarro(id) {
    carrito = carrito.filter(item => item.id != id);
    actualizarCarritoUI();
}

function actualizarCarritoUI() {
    localStorage.setItem('carritoCapibara', JSON.stringify(carrito));

    // Contador flotante
    const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);
    if (DOM.cartCount) DOM.cartCount.textContent = totalItems;

    // Renderizado en el Drawer
    if (DOM.cartItemsContainer) {
        if (carrito.length === 0) {
            DOM.cartItemsContainer.innerHTML = '<p class="empty-cart-text">Tu carrito está vacío.</p>';
        } else {
            DOM.cartItemsContainer.innerHTML = carrito.map(item => `
                <div class="cart-item">
                    <img src="${item.img}" alt="${item.nombre}" class="cart-item-img">
                    <div class="cart-item-details">
                        <span class="cart-item-title">${item.nombre}</span>
                        <span class="cart-item-price">$${item.precio} x ${item.cantidad}</span>
                    </div>
                    <button class="cart-item-remove" data-id="${item.id}">&times;</button>
                </div>
            `).join('');

            // Asignar eventos de eliminación dinámicamente
            DOM.cartItemsContainer.querySelectorAll('.cart-item-remove').forEach(btn => {
                btn.addEventListener('click', () => eliminarDelCarro(btn.dataset.id));
            });
        }
    }

    // Monto Total
    if (DOM.cartTotalAmount) {
        const total = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
        DOM.cartTotalAmount.textContent = `$${total.toLocaleString('es-AR')}`;
    }
}

function abrirPanelCarrito() {
    DOM.cartDrawer?.classList.add('active');
    DOM.cartOverlay?.classList.add('active');
}

function cerrarPanelCarrito() {
    DOM.cartDrawer?.classList.remove('active');
    DOM.cartOverlay?.classList.remove('active');
}


// ==========================================
// 8. INICIALIZACIÓN Y EVENTOS GLOBALES
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
    actualizarCarritoUI();

    // Evento de búsqueda
    if (DOM.searchInput) {
        DOM.searchInput.addEventListener('input', handleSearch);
    }

    // Redirección al detalle de producto al hacer clic en la tarjeta
    if (DOM.recipeGrid) {
        DOM.recipeGrid.addEventListener('click', (e) => {
            if (e.target.closest('.card-button')) return;

            const card = e.target.closest('.card');
            if (!card) return;

            //  Extraemos el Name y lo pasamos por la URL
            const productName = card.getAttribute('data-product-name');
            if (productName) {
                window.location.href = `producto.html?name=${encodeURIComponent(productName)}`;
            }
        });
    }

    // Controles del Carrito
    DOM.openCartBtn?.addEventListener('click', abrirPanelCarrito);
    DOM.closeCartBtn?.addEventListener('click', cerrarPanelCarrito);

    // Ajuste responsivo de paginación por cambio de tamaño
    window.addEventListener('resize', () => {
        clearTimeout(window.resizeTimer);
        window.resizeTimer = setTimeout(renderizarBotonesPaginacion, 200);
    });
});