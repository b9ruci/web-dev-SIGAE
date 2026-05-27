require('dotenv').config();
const express = require('express');
const authRoutes = require('./routes/authRoutes');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

app.listen(process.env.PORT || 3000);