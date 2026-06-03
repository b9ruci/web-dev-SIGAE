require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();

/* CORS */

const corsOptions = {
  origin:
    process.env.FRONTEND_URL ||
    'http://localhost:3000',
  credentials: true,
};

app.use(cors(corsOptions));

/* JSON */

app.use(express.json());

/* RUTAS */

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const usuarioRoutes = require('./routes/usuarioRoutes');
app.use('/api/usuarios', usuarioRoutes);

const dashboardRoutes = require('./routes/dashboardRoutes');
app.use('/api/dashboard', dashboardRoutes);

/* 404 */

app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada'
  });
});

/* ERRORES */

app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(500).json({
    error: 'Error interno del servidor'
  });
});

/* SERVER */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(
    `Servidor corriendo en puerto ${PORT}`
  );
});