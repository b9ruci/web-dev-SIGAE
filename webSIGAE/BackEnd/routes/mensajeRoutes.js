const express = require('express');

const router = express.Router();

const {
  obtenerConversaciones,
  obtenerMensajes,
  enviarMensaje,
  marcarMensajesLeidos
} = require('../controllers/mensajeController');

const { verifyToken } = require('../middleware/authMiddleware');


// Obtener las conversaciones del usuario autenticado
router.get(
  '/conversaciones',
  verifyToken,
  obtenerConversaciones
);


// Obtener los mensajes de una conversación
router.get(
  '/conversaciones/:id/mensajes',
  verifyToken,
  obtenerMensajes
);


// Enviar un mensaje
router.post(
  '/conversaciones/:id/mensajes',
  verifyToken,
  enviarMensaje
);


// Marcar mensajes como leídos
router.patch(
  '/conversaciones/:id/leidos',
  verifyToken,
  marcarMensajesLeidos
);


module.exports = router;