const express = require('express');
const { login } = require('../controllers/authController');
const { validateLogin } = require('../middleware/validation');
const { loginLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/login', loginLimiter, validateLogin, login);

module.exports = router;