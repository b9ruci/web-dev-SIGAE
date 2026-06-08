const { body, validationResult } = require('express-validator');

const validateLogin = [
  body('rut')
    .notEmpty()
    .withMessage('El RUT es requerido')
    .matches(/^\d{7,8}-[\dkK]$/)
    .withMessage('RUT inválido (formato: 12345678-9)'),
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

module.exports = { validateLogin };
