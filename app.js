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
    
    // Botones de cancelar
    document.getElementById('cancelar-producto')?.addEventListener('click', () => resetForm('producto'));
    document.getElementById('cancelar-categoria')?.addEventListener('click', () => resetForm('categoria'));
    document.getElementById('cancelar-proveedor')?.addEventListener('click', () => resetForm('proveedor'));
    document.getElementById('cancelar-usuario')?.addEventListener('click', () => resetForm('usuario'));
}

// Función para resetear formularios
function resetForm(type) {
    const form = document.getElementById(`${type}-form`);
    if (!form) return;
    
    form.reset();
    form.style.display = 'none';
    delete form.dataset.editingId;
    document.getElementById(`toggle-${type}-form`).setAttribute('aria-expanded', 'false');
    
    // Restaurar texto del botón de guardar
    const saveButton = form.querySelector('.btn-submit');
    if (saveButton) {
        saveButton.textContent = type === 'producto' ? 'Guardar Producto' : `Guardar ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    }
}

// Carga inicial de datos
async function loadInitialData() {
    try {
        showLoading('productos');
        showLoading('categorias');
        showLoading('proveedores');
        showLoading('usuarios');

        console.log('Iniciando carga de datos...');
        
        // 1. Primero cargar categorías (necesarias para el select de productos)
        const categorias = await fetchData('categorias');
        console.log('Categorías cargadas:', categorias);
        
        // Poblar el select de categorías en productos
        const categoriaSelect = document.getElementById('categoria_id');
        if (categoriaSelect) {
            if (categorias && categorias.length > 0) {
                categoriaSelect.innerHTML = categorias.map(cat => 
                    `<option value="${cat.id_categoria}">${cat.nombre}</option>`
                ).join('');
            } else {
                categoriaSelect.innerHTML = '<option value="">No hay categorías disponibles</option>';
                console.warn('No se encontraron categorías');
            }
        }

        // 2. Luego cargar el resto de datos en paralelo
        await Promise.all([
            fetchData('productos'),
            fetchData('proveedores'),
            fetchData('usuarios')
        ]);
        
        console.log('Todos los datos cargados correctamente');
    } catch (error) {
        console.error('Error en loadInitialData:', error);
        showError('Error al cargar datos iniciales', error);
    }
}

// Función mejorada para obtener datos con más depuración
async function fetchData(endpoint) {
    try {
        const url = `${API_BASE_URL}/${endpoint}`;
        console.log(`Fetching data from: ${url}`);
        
        const response = await fetch(url, {
            headers: DEFAULT_HEADERS
        });
        
        console.log(`Response for ${endpoint}:`, response);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
        }
        
        const data = await response.json();
        console.log(`Data received for ${endpoint}:`, data);
        
        renderData(endpoint, data);
        hideLoading(endpoint);
        return data;
    } catch (error) {
        console.error(`Error in fetchData for ${endpoint}:`, error);
        showError(`Error al cargar ${endpoint}`, error);
        hideLoading(endpoint);
        return [];
    }
}

// Renderizar datos en la UI con más validaciones
function renderData(type, data) {
    console.log(`Rendering data for ${type}:`, data);
    const container = document.getElementById(`lista-${type}`);
    if (!container) {
        console.error(`Container not found for ${type}`);
        return;
    }

    container.innerHTML = '';

    if (!data || data.length === 0) {
        console.warn(`No data available for ${type}`);
        container.innerHTML = `<p class="no-data">No hay ${type} disponibles</p>`;
        return;
    }

    data.forEach(item => {
        const element = createListItem(type, item);
        if (element) {
            container.appendChild(element);
        }
    });
}

// Crear elemento de lista con más robustez
function createListItem(type, item) {
    if (!item) {
        console.error('Invalid item:', item);
        return null;
    }

    const div = document.createElement('div');
    div.className = 'list-item';
    
    // Contenido específico para cada tipo
    let content = '';
    
    // Manejo especial para el ID según el tipo
    let itemId;
    switch(type) {
        case 'productos':
            itemId = item.id_producto || item.id;
            break;
        case 'categorias':
            itemId = item.id_categoria || item.id;
            break;
        case 'proveedores':
            itemId = item.id_proveedor || item.id;
            break;
        case 'usuarios':
            itemId = item.id_usuario || item.id;
            break;
        default:
            itemId = item.id;
    }
    
    if (!itemId) {
        console.error(`Missing ID for ${type} item:`, item);
        return null;
    }

    switch(type) {
        case 'productos':
            content = `
                <div class="item-content">
                    <h3>${item.nombre || 'Sin nombre'}</h3>
                    <p>${item.descripcion || 'Sin descripción'}</p>
                    <p class="price">$${item.precio_venta ? Number(item.precio_venta).toFixed(2) : '0.00'}</p>
                </div>
            `;
            break;
        case 'categorias':
            content = `
                <div class="item-content">
                    <h3>${item.nombre || 'Sin nombre'}</h3>
                </div>
            `;
            break;
        case 'proveedores':
            content = `
                <div class="item-content">
                    <h3>${item.nombre || 'Sin nombre'}</h3>
                    <p>${item.contacto || 'Sin contacto'}</p>
                    <p>${item.telefono || 'Sin teléfono'}</p>
                    ${item.email ? `<p>${item.email}</p>` : ''}
                </div>
            `;
            break;
        case 'usuarios':
            content = `
                <div class="item-content">
                    <h3>${item.nombre || 'Sin nombre'}</h3>
                    <p>${item.email || 'Sin email'}</p>
                    <span class="badge ${item.rol || 'visor'}">${item.rol || 'Sin rol'}</span>
                </div>
            `;
            break;
        default:
            console.error('Unknown type:', type);
            return null;
    }

    div.innerHTML = content + `
        <div class="item-actions">
            <button class="btn btn-edit" data-id="${itemId}" data-type="${type}">
                <i class="fas fa-edit"></i> Editar
            </button>
            <button class="btn btn-delete" data-id="${itemId}" data-type="${type}">
                <i class="fas fa-trash"></i> Eliminar
            </button>
        </div>
    `;

    // Agregar event listeners a los botones
    div.querySelector('.btn-edit')?.addEventListener('click', handleEdit);
    div.querySelector('.btn-delete')?.addEventListener('click', handleDelete);

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
    const section = document.getElementById(sectionId);
    if (section) {
        section.hidden = false;
    } else {
        console.error(`Section not found: ${sectionId}`);
    }

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

    if (!toggleBtn || !form) {
        console.error(`Elements not found for type: ${type}`);
        return;
    }

    toggleBtn.addEventListener('click', () => {
        const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
        toggleBtn.setAttribute('aria-expanded', !isExpanded);
        form.style.display = isExpanded ? 'none' : 'block';
        form.setAttribute('aria-hidden', isExpanded);
        
        // Si estamos mostrando el formulario, asegurarnos de que esté limpio
        if (!isExpanded) {
            form.reset();
            delete form.dataset.editingId;
            const saveButton = form.querySelector('.btn-submit');
            if (saveButton) {
                saveButton.textContent = type === 'producto' ? 'Guardar Producto' : `Guardar ${type.charAt(0).toUpperCase() + type.slice(1)}`;
            }
        }
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

    await saveData('productos', formData, 'producto');
}

async function saveCategory() {
    const formData = {
        nombre: document.getElementById('categoria-nombre').value
    };

    await saveData('categorias', formData, 'categoria');
}

async function saveSupplier() {
    const formData = {
        nombre: document.getElementById('proveedor-nombre').value,
        contacto: document.getElementById('proveedor-contacto').value,
        telefono: document.getElementById('proveedor-telefono').value
    };

    await saveData('proveedores', formData, 'proveedor');
}

async function saveUser() {
    const formData = {
        nombre: document.getElementById('usuario-nombre').value,
        email: document.getElementById('usuario-email').value,
        contraseña: document.getElementById('usuario-contraseña').value, // Añadir esto
        rol: document.getElementById('usuario-rol').value
    };

    await saveData('usuarios', formData, 'usuario');
}

// Función mejorada para guardar datos
async function saveData(apiType, data, formType = apiType.slice(0, -1)) {
    const form = document.getElementById(`${formType}-form`);
    if (!form) {
        console.error(`Form not found for type: ${formType}`);
        return;
    }

    const isEditing = form.dataset.editingId;
    const url = isEditing ? `${API_BASE_URL}/${apiType}/${form.dataset.editingId}` : `${API_BASE_URL}/${apiType}`;
    const method = isEditing ? 'PUT' : 'POST';

    console.log(`Saving data to ${url}`, data);

    try {
        const response = await fetch(url, {
            method: method,
            headers: DEFAULT_HEADERS,
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
        }

        const result = await response.json();
        console.log('Save successful:', result);

        showSuccess(`${formType} ${isEditing ? 'actualizado' : 'guardado'} correctamente`);

        // Resetear el formulario
        resetForm(formType);

        // Recargar los datos
        await fetchData(apiType);
    } catch (error) {
        console.error(`Error saving ${apiType}:`, error);
        showError(`Error al ${isEditing ? 'actualizar' : 'guardar'} ${formType}`, error);
    }
}

// Manejar edición
async function handleEdit(e) {
    const button = e.currentTarget;
    const id = button.dataset.id;
    const type = button.dataset.type;    
    const singularMap = {
    productos: 'producto',
    categorias: 'categoria',
    proveedores: 'proveedor',
    usuarios: 'usuario'
};

const singularType = singularMap[type] || type.slice(0, -1);

    console.log(`Editing ${type} with ID: ${id}`);

    try {
        const response = await fetch(`${API_BASE_URL}/${type}/${id}`, {
            headers: DEFAULT_HEADERS
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
        }
        
        const data = await response.json();
        console.log(`Data received for editing ${type}:`, data);
        
        const form = document.getElementById(`${singularType}-form`);
        if (!form) {
            throw new Error(`Form not found for ${singularType}`);
        }

        // Llenar formulario con datos
        for (const key in data) {
            // Buscar input por name, id, o id con prefijo
            const input = form.querySelector(`[name="${key}"]`) || 
                         form.querySelector(`#${key}`) || 
                         form.querySelector(`#${singularType}-${key}`);
            if (input) {
                input.value = data[key];
            } else {
                console.warn(`Input not found for key: ${key}`);
            }
        }

        // Configurar el formulario para edición
        form.dataset.editingId = id;
        form.style.display = 'block';
        document.getElementById(`toggle-${singularType}-form`).setAttribute('aria-expanded', 'true');
        
        // Cambiar el texto del botón de guardar
        const saveButton = form.querySelector('.btn-submit');
        if (saveButton) {
            saveButton.textContent = `Actualizar ${singularType.charAt(0).toUpperCase() + singularType.slice(1)}`;
        }
        
        form.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error(`Error editing ${type}:`, error);
        showError(`Error al cargar ${singularType} para edición`, error);
    }
}

// Manejar eliminación
async function handleDelete(e) {
    const button = e.currentTarget;
    const id = button.dataset.id;
    const type = button.dataset.type;
    const singularType = type.slice(0, -1);

    if (!confirm(`¿Estás seguro de eliminar este ${singularType}?`)) return;

    console.log(`Deleting ${type} with ID: ${id}`);

    try {
        const response = await fetch(`${API_BASE_URL}/${type}/${id}`, {
            method: 'DELETE',
            headers: DEFAULT_HEADERS
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
        }

        console.log('Delete successful');
        showSuccess(`${singularType} eliminado correctamente`);
        await fetchData(type);
    } catch (error) {
        console.error(`Error deleting ${type}:`, error);
        showError(`Error al eliminar ${singularType}`, error);
    }
}

// Helpers
function showLoading(type) {
    const container = document.getElementById(`lista-${type}`);
    if (container) {
        container.innerHTML = '<div class="loading-indicator">Cargando...</div>';
    } else {
        console.error(`Container not found for loading: ${type}`);
    }
}

function hideLoading(type) {
    const loadingElement = document.querySelector(`#lista-${type} .loading-indicator`);
    if (loadingElement) {
        loadingElement.remove();
    }
}

function showSuccess(message) {
    console.log(`Success: ${message}`);
    const alert = document.createElement('div');
    alert.className = 'alert alert-success';
    alert.textContent = message;
    document.body.prepend(alert);
    setTimeout(() => alert.remove(), 3000);
}

function showError(message, error) {
    console.error(`${message}:`, error);
    const alert = document.createElement('div');
    alert.className = 'alert alert-error';
    alert.textContent = `${message}: ${error.message || error}`;
    document.body.prepend(alert);
    setTimeout(() => alert.remove(), 5000);
}

function setCurrentYear() {
    document.getElementById('current-year').textContent = new Date().getFullYear();
}