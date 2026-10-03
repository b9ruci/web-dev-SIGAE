const express = require('express');

const router = express.Router();

const {
  obtenerConversaciones,
  obtenerMensajes,
  enviarMensaje,
  marcarMensajesLeidos,
  obtenerContactos,
  iniciarConversacion
} = require('../controllers/mensajeController');

const { verifyToken } = require('../middleware/authMiddleware');

// CU73 / RF47 — la autorización por rol (Docente/Apoderado) y por
// participación en la conversación se resuelve dentro del controlador.
router.use(verifyToken);


// Contactos válidos según la relación docente-apoderado (?rol=)
router.get('/contactos', obtenerContactos);


// Obtener las conversaciones del usuario autenticado (?rol=)
router.get('/conversaciones', obtenerConversaciones);


// Iniciar (o reutilizar) una conversación con un contacto válido
router.post('/conversaciones', iniciarConversacion);


// Obtener los mensajes de una conversación
router.get('/conversaciones/:id/mensajes', obtenerMensajes);


// Enviar un mensaje
router.post('/conversaciones/:id/mensajes', enviarMensaje);


// Marcar mensajes como leídos
router.patch('/conversaciones/:id/leidos', marcarMensajesLeidos);


module.exports = router;
