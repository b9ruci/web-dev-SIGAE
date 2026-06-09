const express = require('express');
const { login } = require('../controllers/authController');
const { validateLogin } = require('../middleware/validation');
const { loginLimiter } = require('../middleware/rateLimiter');
const { cambiarContrasena } = require('../controllers/passwordController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', loginLimiter, validateLogin, login);
router.put('/cambiar-contrasena', verifyToken, cambiarContrasena);

module.exports = router;