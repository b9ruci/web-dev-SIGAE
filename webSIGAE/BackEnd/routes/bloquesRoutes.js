const express = require('express');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const {
  getParametros, updateParametros,
  getBloques, createBloque, updateBloque, deleteBloque,
  getEventos, createEvento, updateEvento, deleteEvento,
  getBloquesAfectadosPorEvento,
} = require('../controllers/bloquesController');

const router = express.Router();

router.use(verifyToken);

// Parámetros institucionales (CU53) — solo admin
router.get('/parametros',       getParametros);
router.put('/parametros',       verifyAdmin, updateParametros);

// Bloques horarios (CU49) — solo admin para escritura
router.get('/',                 getBloques);
router.post('/',                verifyAdmin, createBloque);
router.put('/:id',              verifyAdmin, updateBloque);
router.delete('/:id',           verifyAdmin, deleteBloque);

// Eventos institucionales (CU70, CU71, CU72) — solo admin para escritura
router.get('/eventos',                    getEventos);
router.get('/eventos/:id/afectados',      getBloquesAfectadosPorEvento);
router.post('/eventos',                   verifyAdmin, createEvento);
router.put('/eventos/:id',                verifyAdmin, updateEvento);
router.delete('/eventos/:id',             verifyAdmin, deleteEvento);

module.exports = router;