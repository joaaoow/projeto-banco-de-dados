import mysql from 'mysql2/promise';
import mongoose from 'mongoose';

// MySql
export const mysqlPool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: eventosdb
});

// MongoDB Atlas
const mongoURL = 'mongodb+srv://admin:2025#1090@eventosdb.a4hlxhw.mongodb.net/?appName=eventosDB'
mongoose.connect(mongoURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then (() => console.log('Conectado ao MongoDB Atlas'))
.catch (err => console.error('Erro ao conectar MongoDB: ', err));


export const mongo = mongoose;