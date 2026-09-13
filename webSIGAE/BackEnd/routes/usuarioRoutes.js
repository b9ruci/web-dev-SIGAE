const express = require('express');
const router = express.Router();

const usuarioController = require('../controllers/usuarioController');

const {
  verifyToken,
  verifyAdmin,
  verifySuperAdmin,
  verifyPuedeCrearRol,
} = require('../middleware/authMiddleware');

// CU2 y CU3: Visualizar y editar administradores — exclusivo del Super Administrador
router.get('/administradores', verifyToken, verifySuperAdmin, usuarioController.getAdministradores);
router.put('/administradores/:id', verifyToken, verifySuperAdmin, usuarioController.editarAdministrador);

const { validateCrearUsuario } = require('../middleware/validation');

// Búsqueda de usuario existente (CU 25) — debe estar ANTES de /:id
router.post('/buscar', verifyToken, verifyAdmin, usuarioController.buscarUsuario);

// Cualquier usuario autenticado puede leer su propio perfil
router.get('/', verifyToken, verifyAdmin, usuarioController.getUsuarios);

// CU29: Búsqueda de usuarios con filtros avanzados por rol y estado de cuenta — debe estar ANTES de /:id
router.get('/filtrar', verifyToken, verifyAdmin, usuarioController.getUsuariosPorFiltro);

// CU30 y CU31: Listado y filtros de docentes — Super Admin/Admin
router.get('/docentes', verifyToken, verifyAdmin, usuarioController.getDocentes);

// CU32 y CU33: Listado y filtros de apoderados — Super Admin/Admin
router.get('/apoderados', verifyToken, verifyAdmin, usuarioController.getApoderados);
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
