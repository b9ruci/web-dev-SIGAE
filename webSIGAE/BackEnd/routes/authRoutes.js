const express = require('express');
const { login, logout } = require('../controllers/authController');
const {
  checkRecoveryEmails,
  forgotPassword,
  resetPassword,
  validateResetToken,
  cambiarContrasena,
} = require('../controllers/passwordController');
const { validateLogin } = require('../middleware/validation');
const { loginLimiter } = require('../middleware/rateLimiter');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Autenticación
router.post('/login', loginLimiter, validateLogin, login);
router.post('/logout', logout);

// Recuperación de contraseña
router.post('/check-recovery-emails', checkRecoveryEmails);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/validate-reset-token', validateResetToken);

// Cambio de contraseña con sesión activa
router.put('/cambiar-contrasena', verifyToken, cambiarContrasena);

module.exports = router;
