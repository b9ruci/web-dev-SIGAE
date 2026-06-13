const express = require('express');
const router = express.Router();

const usuarioController = require('../controllers/usuarioController');

const {
  verifyToken,
  verifyAdmin,
  verifySuperAdmin,
  verifyPuedeCrearRol,
} = require('../middleware/authMiddleware');

const { validateCrearUsuario } = require('../middleware/validation');

// Cualquier usuario autenticado puede leer su propio perfil
router.get('/', verifyToken, verifyAdmin, usuarioController.getUsuarios);
router.get('/:id', verifyToken, usuarioController.getUsuarioById);

// Solo Administrador puede crear, modificar estado o eliminar usuarios
router.post('/', verifyToken, verifyAdmin, verifyPuedeCrearRol, validateCrearUsuario, usuarioController.createUsuario);
router.put('/:id',       verifyToken, verifyAdmin, usuarioController.updateUsuario);
router.put('/:id/estado', verifyToken, verifyAdmin, usuarioController.toggleEstado);
router.delete('/:id',    verifyToken, verifyAdmin, usuarioController.deleteUsuario);

// Asignar un nuevo rol a usuario existente (Admin puede asignar Docente/Apoderado; solo SuperAdmin puede asignar Admin)
router.post('/:id/asignar-rol', verifyToken, verifyAdmin, usuarioController.asignarRol);

// Solo SuperAdmin puede cambiar/revocar roles libremente
router.put('/:id/roles', verifyToken, verifySuperAdmin, usuarioController.updateRoles);

module.exports = router;
