import { mysqlPool } from '../../db.js';

export const UsuarioModel = {
  async criar(nome, email, senha, tipo = 'aluno') {
    const [result] = await mysqlPool.query(
      'INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)',
      [nome, email, senha, tipo]
    );
    return result.insertId;
  },

  async listar() {
    const [rows] = await mysqlPool.query('SELECT id, nome, email, tipo FROM usuarios');
    return rows;
  },

  async buscarPorEmail(email) {
    const [rows] = await mysqlPool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    return rows[0];
  }
};