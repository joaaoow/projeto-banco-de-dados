const mysql = require('mysql2');
const mongoose = require('mongoose');
require('dotenv').config();

// MySQL pool (callback-style query compatible)
const mysqlPool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'eventosdb',
    waitForConnections: true,
    connectionLimit: parseInt(process.env.MYSQL_CONNECTION_LIMIT, 10) || 10,
    queueLimit: 0
});

// MongoDB (Atlas or local)
const mongoUrl = process.env.MONGO_URL || process.env.mongoURL || 'mongodb://localhost:27017/eventosdb';
mongoose.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Conectado ao MongoDB'))
.catch(err => console.error('Erro ao conectar MongoDB:', err));

// Exporta pool MySQL como o módulo principal para compatibilidade com código existente
module.exports = mysqlPool;
// Anexa mongoose para quem precisar do cliente Mongo
module.exports.mongo = mongoose;