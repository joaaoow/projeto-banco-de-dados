const express = require('express');
const router = express.Router();
const db = require('../db.js');

// CRUD  de Eventos

// Criar novo evento
router.post('/', (req, res) => {
    const { titulo, descricao, data_evento, vagas, organizador_id, categoria_id } = req.body;

    // Validação
    if(!titulo || !descricao || !data_evento || !vagas || !organizador_id || !categoria_id){
        return res.status(400).json({
            erro: 'Titulo, data, vagas e organizador são obrigatórios.'
        });
    }

    // Verifica se o organizador existe
    db.query('SELECT id, tipo FROM usuarios WHERE id = ?', [organizador_id], (err, results) => {
        if(err) return res.status(500).json({erro: err.message});

        if (!results || results.length === 0){
            return res.status(404).json({erro: 'Organizador não encontrado'});
        }

        if (results[0].tipo !== 'organizador'){
            return res.status(403).json({erro: 'Usuário não é organizador'});
        }

        const query = 'INSERT INTO eventos (titulo, descricao, data_evento, vagas, organizador_id, categoria_id) VALUES (?, ?, ?, ?, ?, ?)';

        // Note: keep parameter order matching the INSERT columns
        db.query(query, [titulo, descricao, data_evento, vagas, organizador_id, categoria_id], (err, results) => {
            if (err) return res.status(500).json({erro: err.message});

            res.status(201).json({ mensagem: 'Evento criado com sucesso', id: results.insertId, titulo, data_evento, vagas });
        });
    });
});

// Listar todos os eventos
router.get('/', (req, res) => {
    const query = `SELECT e.id, e.titulo, e.descricao, e.data_evento, e.vagas, e.categoria_id, u.nome as organizador, u.id as organizador_id, (SELECT COUNT(*) FROM inscricoes WHERE evento_id = e.id AND status = 'confirmado') as inscritos FROM eventos e INNER JOIN usuarios u ON e.organizador_id = u.id ORDER BY e.data_evento DESC`;
    
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({erro: err.message});

        res.status(200).json({
            total: results.length,
            eventos: results
        });
    });
});

// Buscar por ID
router.get('/:id', (req, res) => {
    const { id } = req.params;

    const query = `
        SELECT 
            e.*,
            u.nome as organizador,
            u.email as organizador_email,
            (SELECT COUNT(*) FROM inscricoes WHERE evento_id = e.id AND status = 'confirmado') as inscritos
        FROM eventos e
        INNER JOIN usuarios u ON e.organizador_id = u.id
        WHERE e.id = ?
    `;

    db.query(query, [id], (err, results) => {
        if (err) return res.status(500).json({erro: err.message});

        if (!results || results.length === 0){
            return res.status(404).json({ erro: 'Evento não encontrado.' });
        }

        res.status(200).json(results[0]);
    });
});

// Eventos disponíveis (com vagas)
router.get('/disponiveis/lista', (req, res) => {
    const query = `
    SELECT 
        e.id,
        e.titulo,
        e.descricao,
        e.data_evento,
        e.vagas,
        u.nome as organizador,
        (SELECT COUNT(*) FROM inscricoes WHERE evento_id = e.id AND status = 'confirmado') as inscritos,
        (e.vagas - (SELECT COUNT(*) FROM inscricoes WHERE evento_id = e.id AND status = 'confirmado')) as vagas_disponiveis
    FROM eventos e
    INNER JOIN usuarios u ON e.organizador_id = u.id
    WHERE e.data_evento > NOW()
    HAVING vagas_disponiveis > 0
    ORDER BY e.data_evento ASC
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({erro: err.message});

        res.status(200).json({ total: results.length, eventos: results });
    });
});

// Eventos por organizador 
router.get('/organizador/:organizador_id', (req, res) => {
    const { organizador_id } = req.params;

    const query = `
    SELECT 
        e.*,
        (SELECT COUNT(*) FROM inscricoes WHERE evento_id = e.id AND status = 'confirmado') as inscritos
    FROM eventos e
    WHERE e.organizador_id = ?
    ORDER BY e.data_evento DESC
    `;

    db.query(query, [organizador_id], (err, results) => {
        if (err) return res.status(500).json({erro: err.message});

        res.status(200).json({
            total: results.length,
            eventos: results
        });
    });
});


// Atualizar evento
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { titulo, descricao, data_evento, vagas, categoria_id} = req.body;

    if(!titulo || !data_evento || !vagas) {
        return res.status(400).json({ erro: 'Título, data e vagas são obrigatórios.' });
    }

    const query = `
    UPDATE eventos 
    SET titulo = ?, descricao = ?, data_evento = ?, vagas = ?, categoria_id = ?
    WHERE id = ?;
    `;

    db.query(query, [titulo, descricao, data_evento, vagas, categoria_id, id], (err, results) => {
        if (err) return res.status(500).json({erro: err.message});

        if (results.affectedRows === 0) {
            return res.status(404).json({erro: 'Evento não encontrado.'});
        }

        res.status(200).json({
            mensagem: 'Evento atualizado com sucesso.',
            id,
            titulo,
            data_evento,
            vagas
        });
    });
});

// Deletar evento
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    // Verificazr se há inscrições
    db.query('SELECT COUNT(*) as total FROM inscricoes WHERE evento_id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({erro: err.message});

        if(results[0].total > 0){
            return res.status(409).json({
                erro: 'Não é possível deletar eventos com inscrições. Cancele as inscrições primeiro.'
            });
        }

        // Deletar evento
        db.query('DELETE FROM eventos WHERE id = ?', [id], (err, results) => {
            if (err) return res.status(500).json({erro: err.message});

            if (results.affectedRows === 0){
                return res.status(404).json({erro: 'Evento não encontrado.'});
            }

            res.status(200).json({
                mensagem: 'Evento deletado com sucesso.',
                id
            });
        });
    });
});

// Participantes do evento
router.get('/:id/participantes', (req, res) => {
    const { id } = req.params;

    const query = `
    SELECT 
        u.id,
        u.nome,
        u.email,
        i.data_inscricao,
        i.status
    FROM inscricoes i
    INNER JOIN usuarios u ON i.usuario_id = u.id
    WHERE i.evento_id = ?
    ORDER BY i.data_inscricao DESC
    `;

    db.query(query, [id], (err, results) => {
        if (err) return res.status(500).json({erro: err.message});

        res.status(200).json({
            total: results.length,
            participantes: results
        });
    });
});

module.exports = router;