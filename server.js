const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Inicializa conexões (db.js conecta MySQL e Mongo)
const db = require('./db.js');

// Middlewares
const { authenticate, authorize, authorizeByType } = require('./middleware/auth');

// Rotas
const authRouter = require('./routes/auth');
const usuariosRouter = require('./routes/usuarios');
const eventosRouter = require('./routes/eventos');
const inscricoesRouter = require('./routes/inscricoes');
const feedbacksRouter = require('./routes/feedbacks');
const materialRouter = require('./routes/material');

const app = express();

app.use(cors());
app.use(express.json());

// Rota raiz (sem autenticação)
app.get('/', (req, res) => {
  res.json({ 
    message: 'API de Eventos - Sistema de Gerenciamento de Eventos de Programação',
    version: '1.0.0',
    endpoints: {
      auth: '/auth (register, login, me)',
      usuarios: '/usuarios',
      eventos: '/eventos',
      inscricoes: '/inscricoes',
      feedbacks: '/feedbacks',
      material: '/material'
    }
  });
});

// Rotas públicas (sem autenticação)
app.use('/auth', authRouter);

// Rotas protegidas (requerem autenticação)
app.use('/usuarios', authenticate, usuariosRouter);
app.use('/eventos', authenticate, eventosRouter);
app.use('/inscricoes', authenticate, inscricoesRouter);
app.use('/feedbacks', authenticate, feedbacksRouter);
app.use('/material', authenticate, materialRouter);

// Middleware de erro 404
app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada' });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(err.status || 500).json({ 
    erro: err.message || 'Erro interno do servidor' 
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
  console.log('MongoDB:', process.env.MONGO_URL ? 'Configurado' : 'Usando padrão local');
  console.log('MySQL:', process.env.MYSQL_DATABASE || 'eventosdb');
});

module.exports = app;
