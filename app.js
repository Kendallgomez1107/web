document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

// Configuración global
const API_BASE_URL = 'https://sistema-inaventario-render.onrender.com/api';
const DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
};

// Inicialización de la aplicación
function initApp() {
    setupEventListeners();
    loadInitialData();
    setCurrentYear();
}

// Configurar event listeners
function setupEventListeners() {
    // Navegación
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', handleNavClick);
    });

    // Formularios
    setupFormToggle('producto');
    setupFormToggle('categoria');
    setupFormToggle('proveedor');
    setupFormToggle('usuario');

    // Botones de acción
    document.getElementById('guardar-producto')?.addEventListener('click', saveProduct);
    document.getElementById('guardar-categoria')?.addEventListener('click', saveCategory);
    document.getElementById('guardar-proveedor')?.addEventListener('click', saveSupplier);
    document.getElementById('guardar-usuario')?.addEventListener('click', saveUser);
}

// Carga inicial de datos
function loadInitialData() {
    showLoading('productos');
    showLoading('categorias');
    showLoading('proveedores');
    showLoading('usuarios');

    Promise.all([
        fetchData('productos'),
        fetchData('categorias'),
        fetchData('proveedores'),
        fetchData('usuarios')
    ]).then(() => {
        console.log('Todos los datos cargados');
    }).catch(error => {
        showError('Error al cargar datos iniciales', error);
    });
}

// Función genérica para obtener datos
async function fetchData(endpoint) {
    try {
        const response = await fetch(`${API_BASE_URL}/${endpoint}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        renderData(endpoint, data);
        hideLoading(endpoint);
        return data;
    } catch (error) {
        showError(`Error al cargar ${endpoint}`, error);
        hideLoading(endpoint);
        return [];
    }
}

// Renderizar datos en la UI
function renderData(type, data) {
    const container = document.getElementById(`lista-${type}`);
    if (!container) return;

    container.innerHTML = '';

    if (data.length === 0) {
        container.innerHTML = `<p class="no-data">No hay ${type} disponibles</p>`;
        return;
    }

    data.forEach(item => {
        const element = createListItem(type, item);
        container.appendChild(element);
    });
}

// Crear elemento de lista
function createListItem(type, item) {
    const div = document.createElement('div');
    div.className = 'list-item';
    
    // Contenido específico para cada tipo
    let content = '';
    switch(type) {
        case 'productos':
            content = `
                <div class="item-content">
                    <h3>${item.nombre}</h3>
                    <p>${item.descripcion || 'Sin descripción'}</p>
                    <p class="price">$${Number(item.precio_venta)?.toFixed(2) || '0.00'}</p>
                </div>
            `;
            break;
        case 'categorias':
            content = `
                <div class="item-content">
                    <h3>${item.nombre}</h3>
                </div>
            `;
            break;
        case 'proveedores':
            content = `
                <div class="item-content">
                    <h3>${item.nombre}</h3>
                    <p>${item.contacto || 'Sin contacto'}</p>
                    <p>${item.telefono || 'Sin teléfono'}</p>
                </div>
            `;
            break;
        case 'usuarios':
            content = `
                <div class="item-content">
                    <h3>${item.nombre}</h3>
                    <p>${item.email}</p>
                    <span class="badge ${item.rol}">${item.rol}</span>
                </div>
            `;
            break;
    }

    div.innerHTML = content + `
        <div class="item-actions">
            <button class="btn btn-edit" data-id="${item[`id_${type.slice(0, -1)}`]}" data-type="${type}">
                <i class="fas fa-edit"></i> Editar
            </button>
            <button class="btn btn-delete" data-id="${item[`id_${type.slice(0, -1)}`]}" data-type="${type}">
                <i class="fas fa-trash"></i> Eliminar
            </button>
        </div>
    `;

    // Agregar event listeners a los botones
    div.querySelector('.btn-edit').addEventListener('click', handleEdit);
    div.querySelector('.btn-delete').addEventListener('click', handleDelete);

    return div;
}

// Manejar navegación
function handleNavClick(e) {
    e.preventDefault();
    const sectionId = e.target.getAttribute('href').substring(1);
    
    // Ocultar todas las secciones
    document.querySelectorAll('.management-section').forEach(section => {
        section.hidden = true;
    });

    // Mostrar la sección seleccionada
    document.getElementById(sectionId).hidden = false;

    // Actualizar estado activo de navegación
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    e.target.classList.add('active');
}

// Configurar toggle de formularios
function setupFormToggle(type) {
    const toggleBtn = document.getElementById(`toggle-${type}-form`);
    const form = document.getElementById(`${type}-form`);

    if (!toggleBtn || !form) return;

    toggleBtn.addEventListener('click', () => {
        const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
        toggleBtn.setAttribute('aria-expanded', !isExpanded);
        form.style.display = isExpanded ? 'none' : 'block';
        form.setAttribute('aria-hidden', isExpanded);
    });
}

// Manejar guardado de datos
async function saveProduct() {
    const formData = {
        nombre: document.getElementById('nombre').value,
        descripcion: document.getElementById('descripcion').value,
        precio_venta: parseFloat(document.getElementById('precio_venta').value),
        categoria_id: parseInt(document.getElementById('categoria_id').value)
    };

    await saveData('productos', formData);
}

async function saveCategory() {
    const formData = {
        nombre: document.getElementById('categoria-nombre').value
    };

    await saveData('categorias', formData);
}

async function saveSupplier() {
    const formData = {
        nombre: document.getElementById('proveedor-nombre').value,
        contacto: document.getElementById('proveedor-contacto').value,
        telefono: document.getElementById('proveedor-telefono').value
    };

    await saveData('proveedores', formData);
}

async function saveUser() {
    const formData = {
        nombre: document.getElementById('usuario-nombre').value,
        email: document.getElementById('usuario-email').value,
        rol: document.getElementById('usuario-rol').value
    };

    await saveData('usuarios', formData);
}

// Función genérica para guardar datos
async function saveData(type, data) {
    try {
        const response = await fetch(`${API_BASE_URL}/${type}`, {
            method: 'POST',
            headers: DEFAULT_HEADERS,
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error(`Error al guardar ${type}`);

        const result = await response.json();
        showSuccess(`${type.slice(0, -1)} guardado correctamente`);
        await fetchData(type);
        document.getElementById(`${type}-form`).style.display = 'none';
        document.getElementById(`toggle-${type}-form`).setAttribute('aria-expanded', 'false');
    } catch (error) {
        showError(`Error al guardar ${type.slice(0, -1)}`, error);
    }
}

// Manejar edición
async function handleEdit(e) {
    const id = e.target.dataset.id;
    const type = e.target.dataset.type;
    const singularType = type.slice(0, -1); // Convierte 'productos' a 'producto'

    try {
        const data = await fetch(`${API_BASE_URL}/${type}/${id}`).then(res => res.json());
        const form = document.getElementById(`${singularType}-form`);

        // Llenar formulario con datos
        for (const key in data) {
            const input = form.querySelector(`[name="${key}"]`) || form.querySelector(`#${singularType}-${key}`);
            if (input) {
                input.value = data[key];
            }
        }

        // Mostrar formulario
        form.style.display = 'block';
        document.getElementById(`toggle-${singularType}-form`).setAttribute('aria-expanded', 'true');
        form.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        showError(`Error al cargar ${singularType} para edición`, error);
    }
}

// Manejar eliminación
async function handleDelete(e) {
    const id = e.target.dataset.id;
    const type = e.target.dataset.type;
    const singularType = type.slice(0, -1);

    if (!confirm(`¿Estás seguro de eliminar este ${singularType}?`)) return;

    try {
        const response = await fetch(`${API_BASE_URL}/${type}/${id}`, {
            method: 'DELETE',
            headers: DEFAULT_HEADERS
        });

        if (!response.ok) throw new Error(`Error al eliminar ${singularType}`);

        showSuccess(`${singularType} eliminado correctamente`);
        await fetchData(type);
    } catch (error) {
        showError(`Error al eliminar ${singularType}`, error);
    }
}

// Helpers
function showLoading(type) {
    const container = document.getElementById(`lista-${type}`);
    if (container) {
        container.innerHTML = '<div class="loading-indicator">Cargando...</div>';
    }
}

function hideLoading(type) {
    const loadingElement = document.querySelector(`#lista-${type} .loading-indicator`);
    if (loadingElement) {
        loadingElement.remove();
    }
}

function showSuccess(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-success';
    alert.textContent = message;
    document.body.prepend(alert);
    setTimeout(() => alert.remove(), 3000);
}

function showError(message, error) {
    console.error(message, error);
    const alert = document.createElement('div');
    alert.className = 'alert alert-error';
    alert.textContent = `${message}: ${error.message || error}`;
    document.body.prepend(alert);
    setTimeout(() => alert.remove(), 5000);
}

function setCurrentYear() {
    document.getElementById('current-year').textContent = new Date().getFullYear();
}