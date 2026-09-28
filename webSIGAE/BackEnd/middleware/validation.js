const { body, validationResult } = require('express-validator');

const DOMINIO_INSTITUCIONAL = '@jacquescousteau.edu';

function validarRut(rutCompleto) {
  if (!/^\d{7,8}-[\dkK]$/.test(rutCompleto)) return false;
  const [cuerpo, dvIngresado] = rutCompleto.split('-');
  let suma = 0;
  let multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }
  const dvEsperado = 11 - (suma % 11);
  const dv = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'k' : String(dvEsperado);
  return dv === dvIngresado.toLowerCase();
}

function validarCorreoInstitucional(correo) {
  return correo.toLowerCase().endsWith(DOMINIO_INSTITUCIONAL);
}

// Formato chileno: 9 dígitos, opcionalmente con prefijo internacional +56 (o 56).
// Solo números: sin espacios, guiones ni letras.
function validarTelefonoChileno(telefono) {
  return /^(\+?56)?\d{9}$/.test(String(telefono).trim());
}

// Deja el teléfono siempre como 9 dígitos (quita el prefijo +56/56 si viene)
function normalizarTelefono(telefono) {
  const digitos = String(telefono).trim().replace(/^\+/, '');
  return digitos.length === 11 ? digitos.slice(2) : digitos;
}

// Nombre completo: solo letras (incluye tildes y ñ) y espacios, al menos dos palabras, máx. 100
function validarNombreCompleto(nombre) {
  const limpio = String(nombre).trim();
  return limpio.length <= 100 && /^\p{L}+(\s+\p{L}+)+$/u.test(limpio);
}

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validarCorreo(correo) {
  return REGEX_CORREO.test(String(correo).trim());
}

// Contraseña: mínimo 8 caracteres, al menos una mayúscula y un número.
// Devuelve el mensaje de error o null si es válida.
function validarFortalezaContrasena(pwd) {
  if (typeof pwd !== 'string' || pwd.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
  if (!/[A-Z]/.test(pwd)) return 'La contraseña debe contener al menos una mayúscula';
  if (!/[0-9]/.test(pwd)) return 'La contraseña debe contener al menos un número';
  return null;
}

// Dirección particular del apoderado: calle, número y comuna obligatorios; depto/casa opcional.
// Con { parcial: true } solo se validan los campos presentes (edición campo a campo).
// Devuelve el mensaje de error o null si es válida.
const CAMPOS_DIRECCION = {
  calle : 'Apoderado_Direccion_Calle',
  numero: 'Apoderado_Direccion_Numero',
  depto : 'Apoderado_Direccion_Depto',
  comuna: 'Apoderado_Direccion_Comuna',
};

function validarDireccion({ calle, numero, depto, comuna } = {}, { parcial = false } = {}) {
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';

  if (!parcial || calle !== undefined) {
    if (vacio(calle)) return 'La calle es obligatoria';
    if (String(calle).trim().length > 100) return 'La calle no puede superar los 100 caracteres';
  }
  if (!parcial || numero !== undefined) {
    if (vacio(numero)) return 'El número de la dirección es obligatorio';
    if (!/^\d{1,6}[A-Za-z]?$/.test(String(numero).trim())) return 'El número de la dirección debe ser numérico (ej: 134 o 134B)';
  }
  if (!vacio(depto) && String(depto).trim().length > 20) {
    return 'El departamento/casa no puede superar los 20 caracteres';
  }
  if (!parcial || comuna !== undefined) {
    if (vacio(comuna)) return 'La comuna es obligatoria';
    if (String(comuna).trim().length > 60 || !/^\p{L}+(\s+\p{L}+)*$/u.test(String(comuna).trim())) {
      return 'La comuna solo puede contener letras y espacios';
    }
  }
  return null;
}

// Extrae la dirección desde un objeto con las columnas de la BD
function direccionDesdeColumnas(obj = {}) {
  return {
    calle : obj.Apoderado_Direccion_Calle,
    numero: obj.Apoderado_Direccion_Numero,
    depto : obj.Apoderado_Direccion_Depto,
    comuna: obj.Apoderado_Direccion_Comuna,
  };
}

const validateLogin = [
  body('rut')
    .notEmpty()
    .withMessage('El RUT es requerido')
    .custom((value) => {
      if (!validarRut(value)) throw new Error('RUT inválido');
      return true;
    }),
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
    .isLength({ min: 1 })
    .withMessage('La contraseña no puede estar vacía'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

const validateCrearUsuario = [
  body('Usuario_RUT')
    .notEmpty().withMessage('El RUT es requerido')
    .custom((value) => {
      if (!validarRut(value)) throw new Error('RUT inválido (verifique el dígito verificador)');
      return true;
    }),
  body('Usuario_Nombre_Completo')
    .notEmpty().withMessage('El nombre completo es requerido')
    .custom((value) => {
      if (!validarNombreCompleto(value)) {
        throw new Error('El nombre completo debe contener solo letras y espacios (nombre y apellido, máx. 100 caracteres)');
      }
      return true;
    }),
  body('Usuario_Telefono')
    .notEmpty().withMessage('El teléfono es requerido')
    .custom((value) => {
      if (!validarTelefonoChileno(value)) {
        throw new Error('El número telefónico debe tener 9 dígitos, opcionalmente con prefijo +56');
      }
      return true;
    }),
  body('Usuario_Contraseña')
    .notEmpty().withMessage('La contraseña es requerida')
    .custom((value) => {
      const error = validarFortalezaContrasena(value);
      if (error) throw new Error(error);
      return true;
    }),
  body('Apoderado_Correo_Natural')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value, { req }) => {
      if (req.body.Es_Apoderado && !validarCorreo(value)) {
        throw new Error('El correo del apoderado debe tener el formato usuario@dominio');
      }
      return true;
    }),
  body('Es_Apoderado')
    .custom((value, { req }) => {
      if (value) {
        const error = validarDireccion(direccionDesdeColumnas(req.body));
        if (error) throw new Error(error);
      }
      return true;
    }),
  body('Docente_Correo_Institucional')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value, { req }) => {
      if (req.body.Es_Docente && value && !validarCorreoInstitucional(value)) {
        throw new Error(`El correo institucional del docente debe pertenecer al dominio ${DOMINIO_INSTITUCIONAL}`);
      }
      return true;
    }),
  body('Administrador_Correo_Institucional')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value, { req }) => {
      if (req.body.Es_Administrador && value && !validarCorreoInstitucional(value)) {
        throw new Error(`El correo institucional del administrador debe pertenecer al dominio ${DOMINIO_INSTITUCIONAL}`);
      }
      return true;
    }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // `mensaje` con el primer error para que el frontend lo muestre en lenguaje natural
      return res.status(400).json({ mensaje: errors.array()[0].msg, errors: errors.array() });
    }
    next();
  }
];

module.exports = {
  validateLogin,
  validateCrearUsuario,
  validarRut,
  validarCorreoInstitucional,
  validarTelefonoChileno,
  normalizarTelefono,
  validarNombreCompleto,
  validarCorreo,
  validarFortalezaContrasena,
  validarDireccion,
  direccionDesdeColumnas,
  CAMPOS_DIRECCION,
};
