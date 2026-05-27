const express = require('express');
const router = express.Router();
const usuarioController = require('../Controllers/usuarioController');

// Definir los endpoints
router.get('/', usuarioController.getUsuarios);          // Obtener todos
router.get('/:id', usuarioController.getUsuarioById);    // Obtener uno
router.post('/', usuarioController.createUsuario);       // Crear
router.put('/:id', usuarioController.updateUsuario);     // Actualizar
router.delete('/:id', usuarioController.deleteUsuario);  // Eliminar

module.exports = router;