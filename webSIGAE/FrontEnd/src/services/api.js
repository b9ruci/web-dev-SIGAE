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

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.mensaje || `Error ${res.status}`);
  return data;
}

// ── ADMINISTRADOR ────────────────────────────
// Correo va a Administrador_Correo_Institucional
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
// Correo va a Docente_Correo_Institucional
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
// Correo va a Apoderado_Correo_Natural
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
// No es usuario del sistema — tabla `estudiante`
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
