const express = require('express');
const router = express.Router();

const usuarioController = require('../controllers/usuarioController');

const {
  verifyToken,
  verifySuperAdmin
} = require('../middleware/authMiddleware');

router.get(
  '/',
  verifyToken,
  usuarioController.getUsuarios
);

router.get(
  '/:id',
  verifyToken,
  usuarioController.getUsuarioById
);

router.post(
  '/',
  verifyToken,
  usuarioController.createUsuario
);

router.put(
  '/:id',
  verifyToken,
  usuarioController.updateUsuario
);

router.put(
  '/:id/roles',
  verifyToken,
  verifySuperAdmin,
  usuarioController.updateRoles
);

router.delete(
  '/:id',
  verifyToken,
  usuarioController.deleteUsuario
);

module.exports = router;