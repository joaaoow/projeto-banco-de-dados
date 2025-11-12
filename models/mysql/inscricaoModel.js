import { mysqlPool } from '../../db.js';

export const InscricaoModel = {
  async inscrever(usuario_id, evento_id) {
    const [result] = await mysqlPool.query(
      'INSERT INTO inscricoes (usuario_id, evento_id, status) VALUES (?, ?, ?)',
      [usuario_id, evento_id, 'confirmado']
    );

    // Decrementa vaga no evento
    await mysqlPool.query('UPDATE eventos SET vagas = vagas - 1 WHERE id = ?', [evento_id]);
    return result.insertId;
  },

  async listarPorEvento(evento_id) {
    const [rows] = await mysqlPool.query(`
      SELECT i.*, u.nome AS usuario_nome, u.email 
      FROM inscricoes i
      JOIN usuarios u ON i.usuario_id = u.id
      WHERE i.evento_id = ?
    `, [evento_id]);
    return rows;
  }
};