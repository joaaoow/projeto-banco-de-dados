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
const url_mongo = (process.env.mongoURL)
mongoose.connect(url_mongo, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then (() => console.log('Conectado ao MongoDB Atlas'))
.catch (err => console.error('Erro ao conectar MongoDB: ', err));


export const mongo = mongoose;