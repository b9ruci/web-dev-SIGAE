// server.js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app = express();

const corsOptions = {
  origin     : process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// ── RUTAS ────────────────────────────────────────────
const authRoutes        = require('./routes/authRoutes');
const usuarioRoutes     = require('./routes/usuarioRoutes');
const estudianteRoutes  = require('./routes/estudianteRoutes');
const cursoRoutes       = require('./routes/cursoRoutes');

app.use('/api/auth',        authRoutes);
app.use('/api/usuarios',    usuarioRoutes);
app.use('/api/estudiantes', estudianteRoutes);
app.use('/api/cursos',      cursoRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Error global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
