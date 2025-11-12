import { mysqlPool } from '../../db.js';

export const EventoModel = {
  async criar(titulo, descricao, data_evento, vagas, organizador_id) {
    const [result] = await mysqlPool.query(
      'INSERT INTO eventos (titulo, descricao, data_evento, vagas, organizador_id) VALUES (?, ?, ?, ?, ?)',
      [titulo, descricao, data_evento, vagas, organizador_id]
    );
    return result.insertId;
  },

  async listar() {
    const [rows] = await mysqlPool.query(`
      SELECT e.*, u.nome AS organizador_nome 
      FROM eventos e
      JOIN usuarios u ON e.organizador_id = u.id
    `);
    return rows;
  },

  async buscarPorId(id) {
    const [rows] = await mysqlPool.query('SELECT * FROM eventos WHERE id = ?', [id]);
    return rows[0];
  }
};