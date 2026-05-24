const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://31.97.128.204:3000/api';
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');

function resolveBaseUrl() {
    if (BASE_URL.startsWith('http://') || BASE_URL.startsWith('https://')) {
        return BASE_URL;
    }

    const backendOrigin = import.meta.env.VITE_API_PROXY_TARGET || 'http://31.97.128.204:3000';
    const normalizedOrigin = backendOrigin.replace(/\/+$/, '');
    return `${normalizedOrigin}${BASE_URL.startsWith('/') ? BASE_URL : `/${BASE_URL}`}`;
}

function getApiUrl(endpoint, params = {}) {
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const base = resolveBaseUrl();
    const url = new URL(`${base}${normalizedEndpoint}`);

    Object.keys(params).forEach((key) => {
        const value = params[key];
        if (value !== undefined && value !== null && value !== '') {
            url.searchParams.append(key, value);
        }
    });

    return url.toString();
}

// Obtener token del localStorage (se guarda después del login)
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
    };
}

// Manejo genérico de respuesta
async function handleResponse(response) {
    const contentType = response.headers.get('content-type') || '';
    const json = contentType.includes('application/json')
        ? await response.json()
        : null;

    if (!response.ok) {
        // El backend responde con { success: false, error: { message: "..." } }
        const mensaje = json?.error?.message || json?.mensaje || 'Error del servidor';
        throw new Error(mensaje);
    }
    return json || { success: true };
}

export async function post(endpoint, datos) {
    try {
        const respuesta = await fetch(getApiUrl(endpoint), {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(datos),
        });
        return handleResponse(respuesta);
    } catch (error) {
        if (error instanceof TypeError) {
            throw new Error('No se pudo conectar con el servidor. Verifica la URL del API o el proxy de Vite.');
        }
        throw error;
    }
}

export async function put(endpoint, datos) {
    try {
        const respuesta = await fetch(getApiUrl(endpoint), {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(datos),
        });
        return handleResponse(respuesta);
    } catch (error) {
        if (error instanceof TypeError) {
            throw new Error('No se pudo conectar con el servidor. Verifica la URL del API o el proxy de Vite.');
        }
        throw error;
    }
}

export async function get(endpoint, params = {}) {
    try {
        const respuesta = await fetch(getApiUrl(endpoint, params), {
            method: 'GET',
            headers: getAuthHeaders(),
        });
        return handleResponse(respuesta);
    } catch (error) {
        if (error instanceof TypeError) {
            throw new Error('No se pudo conectar con el servidor. Verifica la URL del API o el proxy de Vite.');
        }
        throw error;
    }
}