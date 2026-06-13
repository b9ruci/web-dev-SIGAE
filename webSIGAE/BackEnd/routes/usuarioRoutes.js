const express = require('express');
const router = express.Router();

const usuarioController = require('../controllers/usuarioController');

const {
  verifyToken,
  verifyAdmin,
  verifySuperAdmin,
  verifyPuedeCrearRol,
} = require('../middleware/authMiddleware');

// Cualquier usuario autenticado puede leer su propio perfil
router.get('/', verifyToken, verifyAdmin, usuarioController.getUsuarios);
router.get('/:id', verifyToken, usuarioController.getUsuarioById);

// Solo Administrador puede crear, modificar estado o eliminar usuarios
router.post('/', verifyToken, verifyAdmin, verifyPuedeCrearRol, usuarioController.createUsuario);
router.put('/:id',       verifyToken, verifyAdmin, usuarioController.updateUsuario);
router.put('/:id/estado', verifyToken, verifySuperAdmin, usuarioController.toggleEstado);
router.delete('/:id',    verifyToken, verifyAdmin, usuarioController.deleteUsuario);

// Solo SuperAdmin puede cambiar roles
router.put('/:id/roles', verifyToken, verifySuperAdmin, usuarioController.updateRoles);

module.exports = router;
