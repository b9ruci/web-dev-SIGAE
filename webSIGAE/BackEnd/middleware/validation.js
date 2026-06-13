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
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

module.exports = { validateLogin, validateCrearUsuario, validarRut, validarCorreoInstitucional };
