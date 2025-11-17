const express = require('express');
const router = express.Router();
const db = require('../db.js');

// CRUD Inscrições

// Criar nova inscrição
router.post('/', (req, res) => {
    const { usuario_id, evento_id } = req.body;

    if (!usuario_id || !evento_id) {
        return res.status(400).json({erro: 'Usuário e evento são obrigatórios'});
    }

    // verifica se o evento possui e existe vagas
    db.query('SELECT vagas FROM eventos WHERE id = ?', [evento_id], (err, eventos) => {
        if(err) return res.status(500).json({erro: err.message});
        if(eventos.length === 0) return res.status(404).json({erro: 'Evento não encontrado.'});

        // Verifica se o usuário já está inscrito
        db.query('SELECT * FROM inscricoes WHERE usuario_id = ? AND evento_id = ?', [usuario_id, evento_id], (err, inscricoes) => {
            if (err) return res.status(500).json({erro: err.message});
            if (inscricoes.length > 0) return res.status(409).json({erro: 'Usuário já inscrito neste evento.'});

            // Conta quantos confirmados já existem
            db.query('SELECT COUNT(*) AS total FROM inscricoes WHERE evento_id = ? AND status = "confirmado"', [evento_id], (err, count) => {
                if (err) return res.status(500).json({erro: err.message});

                const ocupadas = count[0].total;
                if (ocupadas >= eventos[0].vagas) {
                    return res.status(400).json({erro: 'Evento sem vagas disponíveis.'});
                }

                // Inserir inscrição
                const query = 'INSERT INTO inscricoes (usuario_id, evento_id, status) VALUES (?, ?, "confirmado")';
                db.query(query, [usuario_id, evento_id], (err, results) => {
                    if (err) return res.status(500).json({erro: err.message});

                    res.status(201).json({
                        mensagem: 'Inscrição realizada com sucesso.',
                        id: results.insertId,
                        usuario_id,
                        evento_id,
                        status: 'confirmado'
                    });
                });
            });
        });
    });
});

// Listar todas as inscrições
router.get('/', (req, res) => {
    const query = `
    SELECT i.id, u.nome AS usuario, e.titulo AS evento, i.data_inscricao, i.status
    FROM inscricoes i
    INNER JOIN usuarios u ON i.usuario_id = u.id
    INNER JOIN eventos e ON i.evento_id = e.id
    ORDER BY i.data_inscricao DESC
    `;
    db.query(query, (err, results) => {
        if(err) return res.status(500).json({erro: err.message});
        res.status(200).json({
            total: results.length,
            inscricoes: results
        });
    });
});

// Listar inscrições de um usuário
router.get('/usuario/:usuario_id', (req, res) => {
    const{ usuario_id } = req.params;
    const query = `
    SELECT i.id, e.titulo, e.data_evento, i.status, i.data_inscricao
    FROM inscricoes i
    INNER JOIN eventos e ON i.evento_id = e.id
    WHERE i.usuario_id = ?
    ORDER BY e.data_evento DESC
    `;

    db.query(query, [usuario_id], (err, results) => {
        if (err) return res.status(500).json({erro: err.message});

        res.status(200).json({
            total: results.length,
            eventos: results
        });
    });
});

// Cancelar inscrição
router.put('/:id/cancelar', (req, res) => {
    const { id } = req.params;

    db.query('UPDATE inscricoes SET status = "cancelado" WHERE id = ?', [id], (err, results) => {
        if(err) return res.status(500).json({erro: err.message});
        if (results.affectedRows === 0) return res.status(404).json({erro: 'Inscrição não encontrada'});

        res.status(200).json({
            mensagem: 'Inscrição cancelada com sucesso.'
        });
    });
});

// Marcar presença
router.patch('/:id/presenca', (req, res) => {
    const { id } = req.params;

    db.query('UPDATE inscricoes SET status = "presente" WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({erro: err.message});
        if(results.affectedRows === 0) return res.status(404).json({erro: 'Inscrição não encontrada'});

        res.status(200).json({ mensagem: 'Presença confirmada' });
    });
});

// Deletar inscrição
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM inscricoes WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ erro: err.message });
        if (results.affectedRows === 0) return res.status(404).json({ erro: 'Inscrição não encontrada.' });
        res.status(200).json({ mensagem: 'Inscrição deletada com sucesso.' });
    });
});

module.exports = router;