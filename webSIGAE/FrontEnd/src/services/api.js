// src/services/api.js
const BASE_URL = '/api';

function getToken() {
  return localStorage.getItem('token');
}

function authHeaders() {
  return {
    'Content-Type' : 'application/json',
    'Authorization': `Bearer ${getToken()}`,
  };
}

function clearSessionAndRedirect() {
  localStorage.removeItem('usuario');
  localStorage.removeItem('token');
  localStorage.removeItem('rolActivo');
  window.location.href = '/session-expired';
}

export async function apiFetch(url, options = {}) {
  const token = getToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    const data = await res.json().catch(() => ({}));
    if (data.codigo === 'TOKEN_EXPIRADO' || data.codigo === 'SESION_INACTIVA') {
      clearSessionAndRedirect();
      return null;
    }
  }

  return res;
}

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // CU 13: token expirado o sesión invalidada → limpiar y redirigir
    if (res.status === 401 && (data.codigo === 'TOKEN_EXPIRADO' || data.codigo === 'SESION_INACTIVA')) {
      clearSessionAndRedirect();
      return;
    }
    const error = new Error(
  data.mensaje ||
  data.error ||
  `Error ${res.status}`
);

error.data = data;

throw error;
  }
  return data;
}

// ── ADMINISTRADOR ────────────────────────────
export async function registrarAdmin({ nombre, rut, correo, telefono, password, estado }) {
  const res = await fetch(`${BASE_URL}/usuarios`, {
    method : 'POST',
    headers: authHeaders(),
    body   : JSON.stringify({
      Usuario_Nombre_Completo            : nombre,
      Usuario_RUT                        : rut,
      Usuario_Telefono                   : telefono,
      Usuario_Contraseña                 : password,
      Usuario_Estado_Cuenta              : estado === 'Activo' ? 1 : 0,
      Es_Administrador                   : 1,
      Administrador_Tipo                 : 'Administrador Normal',
      Administrador_Correo_Institucional : correo,
      Es_Docente                         : 0,
      Es_Apoderado                       : 0,
    }),
  });
  return handleResponse(res);
}

// ── DOCENTE ──────────────────────────────────
export async function registrarDocente({ nombre, rut, correo, telefono, password, especialidad, cargaHoraria, estado }) {
  const res = await fetch(`${BASE_URL}/usuarios`, {
    method : 'POST',
    headers: authHeaders(),
    body   : JSON.stringify({
      Usuario_Nombre_Completo      : nombre,
      Usuario_RUT                  : rut,
      Usuario_Telefono             : telefono,
      Usuario_Contraseña           : password,
      Usuario_Estado_Cuenta        : estado === 'Activo' ? 1 : 0,
      Es_Docente                   : 1,
      Docente_Especialidad         : especialidad,
      Docente_Carga_Horaria_Maxima : parseInt(cargaHoraria, 10),
      Docente_Correo_Institucional : correo,
      Es_Administrador             : 0,
      Es_Apoderado                 : 0,
    }),
  });
  return handleResponse(res);
}

// ── APODERADO ────────────────────────────────
export async function registrarApoderado({ nombre, rut, correo, telefono, direccion, password, estado }) {
  const res = await fetch(`${BASE_URL}/usuarios`, {
    method : 'POST',
    headers: authHeaders(),
    body   : JSON.stringify({
      Usuario_Nombre_Completo : nombre,
      Usuario_RUT             : rut,
      Usuario_Telefono        : telefono,
      Usuario_Contraseña      : password,
      Usuario_Estado_Cuenta   : estado === 'Activo' ? 1 : 0,
      Es_Apoderado            : 1,
      Apoderado_Direccion     : direccion,
      Apoderado_Correo_Natural: correo,
      Es_Docente              : 0,
      Es_Administrador        : 0,
    }),
  });
  return handleResponse(res);
}

// ── ESTUDIANTE ───────────────────────────────
export async function verificarRutEstudiante(rut) {
  const res = await fetch(`${BASE_URL}/estudiantes/verificar-rut?rut=${encodeURIComponent(rut)}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function registrarEstudiante({ nombre, rut, curso, estadoAcademico }) {
  const res = await fetch(`${BASE_URL}/estudiantes`, {
    method : 'POST',
    headers: authHeaders(),
    body   : JSON.stringify({
      Estudiante_Nombre_Completo  : nombre,
      Estudiante_RUT              : rut,
      Curso_Id                    : curso,
      Estudiante_Estado_Academico : estadoAcademico,
      Apoderado_Usuario_Id        : null,
    }),
  });
  return handleResponse(res);
}

// ── CU34 y CU35: Listado y filtros de estudiantes ──

export async function getEstudiantes({ curso, estado } = {}) {
  const params = new URLSearchParams();
  if (curso) params.set('curso', curso);
  if (estado) params.set('estado', estado);
  const query = params.toString();
  const res = await fetch(`${BASE_URL}/estudiantes${query ? `?${query}` : ''}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// ── CU36: Búsqueda de estudiantes por nombre completo o RUT ──

export async function buscarEstudiantes(criterio) {
  const params = new URLSearchParams({ criterio: criterio ?? '' });
  const res = await fetch(`${BASE_URL}/estudiantes/buscar?${params.toString()}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// ── CU38: Editar curso asociado y estado académico de un estudiante ──

export async function getCursos() {
  const res = await fetch(`${BASE_URL}/cursos`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function editarEstudiante(id, datos) {
  const res = await fetch(`${BASE_URL}/estudiantes/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(datos),
  });
  return handleResponse(res);
}

// ── CU29: Búsqueda de usuarios con filtros avanzados por rol y estado de cuenta ──

export async function getUsuariosPorFiltro({ rol, estado } = {}) {
  const params = new URLSearchParams();
  if (rol) params.set('rol', rol);
  if (estado !== undefined && estado !== '') params.set('estado', estado);
  const query = params.toString();
  const res = await fetch(`${BASE_URL}/usuarios/filtrar${query ? `?${query}` : ''}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// ── CU30 y CU31: Listado y filtros de docentes ──

export async function getDocentes({ especialidad, estado } = {}) {
  const params = new URLSearchParams();
  if (especialidad) params.set('especialidad', especialidad);
  if (estado !== undefined && estado !== '') params.set('estado', estado);
  const query = params.toString();
  const res = await fetch(`${BASE_URL}/usuarios/docentes${query ? `?${query}` : ''}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// ── ASOCIACIÓN APODERADO-ESTUDIANTE ──────────

// CU32 y CU33: Listado y filtros de apoderados (incluye roles y estudiantes vinculados)
export async function getApoderados({ operador, cantidadEstudiantes } = {}) {
  const params = new URLSearchParams();
  if (cantidadEstudiantes !== undefined && cantidadEstudiantes !== '') {
    params.set('cantidadEstudiantes', cantidadEstudiantes);
    if (operador) params.set('operador', operador);
  }
  const query = params.toString();
  const res = await fetch(`${BASE_URL}/usuarios/apoderados${query ? `?${query}` : ''}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// Obtener estudiantes que aún no tienen apoderado asignado
export async function getEstudiantesSinApoderado() {
  const res = await fetch(`${BASE_URL}/estudiantes/sin-apoderado`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// Asignar apoderado a uno o más estudiantes
export async function asignarApoderado({ apoderadoId, estudianteIds }) {
  const res = await fetch(`${BASE_URL}/estudiantes/asignar-apoderado`, {
    method : 'POST',
    headers: authHeaders(),
    body   : JSON.stringify({ apoderadoId, estudianteIds }),
  });
  return handleResponse(res);
}

// CU9: eliminar todas las asociaciones activas de un apoderado con sus estudiantes
export async function eliminarTodasAsociaciones(apoderadoId) {
  const res = await fetch(`${BASE_URL}/estudiantes/apoderado/${apoderadoId}/todas`, {
    method : 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(res);
}
// ── ADMINISTRADORES (CU2 y CU3) ───────────────

// Obtener el listado de administradores registrados
export async function getAdministradores() {
  const res = await fetch(`${BASE_URL}/usuarios/administradores`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// Editar correo institucional, teléfono y/o estado de cuenta de un administrador
export async function editarAdministrador(id, datos) {
  const res = await fetch(`${BASE_URL}/usuarios/administradores/${id}`, {
    method : 'PUT',
    headers: authHeaders(),
    body   : JSON.stringify(datos),
  });
  return handleResponse(res);
}

// ── CU42: Cursos y asignaturas de un docente ──

export async function getAsignacionesDocente(docenteId) {
  const res = await fetch(`${BASE_URL}/horarios/docente/${docenteId}/asignaciones`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// ── CU43: Horario semanal de un docente a partir de sus cursos asociados ──

export async function getHorarioDocente(docenteId) {
  const res = await fetch(`${BASE_URL}/horarios/docente/${docenteId}/horario`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// Listado simple de docentes activos, usado para el selector de "Mi Horario" (Admin/Super Admin)
export async function getListaDocentes() {
  const res = await fetch(`${BASE_URL}/horarios/docentes`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// ── CU40: Estudiantes asociados a un apoderado ──

export async function getEstudiantesAsociados(apoderadoId) {
  const res = await fetch(`${BASE_URL}/estudiantes/apoderado/${apoderadoId}/asociados`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// ── CU41: Detalle de un estudiante desde la lista de asociados ──

export async function getDetalleEstudiante(apoderadoId, estudianteId) {
  const res = await fetch(`${BASE_URL}/estudiantes/apoderado/${apoderadoId}/asociados/${estudianteId}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// ── CU39: Editar (reasignar/quitar) el apoderado de un estudiante ──

export async function editarAsociacionEstudiante(estudianteId, apoderadoId, confirmarEliminacion = false) {
  const res = await fetch(`${BASE_URL}/estudiantes/${estudianteId}/apoderado`, {
    method : 'PUT',
    headers: authHeaders(),
    body   : JSON.stringify({ apoderadoId, confirmarEliminacion }),
  });
  return handleResponse(res);
}

// CU10: eliminar la asociación específica entre un apoderado y un estudiante
export async function eliminarAsociacionEspecifica(estudianteId) {
  const res = await fetch(`${BASE_URL}/estudiantes/${estudianteId}/apoderado`, {
    method : 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// Buscar usuario existente por RUT, nombre o correo
export async function buscarUsuarioExistente({ rut, nombre, correo }) {

  const res = await fetch(
    `${BASE_URL}/usuarios/buscar`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        rut,
        nombre,
        correo
      })
    }
  );

  return handleResponse(res);
}