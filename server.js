const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Inicializa conexões (db.js conecta MySQL e Mongo)
const db = require('./db.js');

// Rotas
const usuariosRouter = require('./routes/usuarios');
const eventosRouter = require('./routes/eventos');
const inscricoesRouter = require('./routes/inscricoes');
const feedbacksRouter = require('./routes/feedbacks');
const materialRouter = require('./routes/material');

const app = express();

app.use(cors());
app.use(express.json());
// Servir arquivos estáticos do front-end
app.use(express.static('public'));

// Monta rotas
app.use('/usuarios', usuariosRouter);
app.use('/eventos', eventosRouter);
app.use('/inscricoes', inscricoesRouter);
app.use('/feedbacks', feedbacksRouter);
app.use('/material', materialRouter);

app.get('/', (req, res) => {
  res.json({ message: 'API de Eventos - servidor ativo' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Servidor rodando em http://localhost:${port}`));

module.exports = app;
