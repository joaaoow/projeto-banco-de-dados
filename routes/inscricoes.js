const express = require('express');
const router = express.Router();
const db = require('../db.js');

// CRUD Inscrições

// Criar nova inscrição (usando procedure)
router.post('/', (req, res) => {
    const { usuario_id, evento_id } = req.body;

    if (!usuario_id || !evento_id) {
        return res.status(400).json({erro: 'Usuário e evento são obrigatórios'});
    }

    // Usa a procedure que já tem todas as validações
    db.query('CALL inscrever_usuario_evento(?, ?, @status)', [usuario_id, evento_id], (err, results) => {
        if (err) {
            return res.status(500).json({erro: err.message});
        }

        // Pega o status retornado pela procedure
        db.query('SELECT @status as status', (err, statusResult) => {
            if (err) return res.status(500).json({erro: err.message});

            const status = statusResult[0].status;

            // Verifica se houve erro
            if (status.startsWith('ERRO:')) {
                const errorMsg = status.replace('ERRO: ', '');
                
                // Determina o status code baseado no erro
                if (errorMsg.includes('não encontrado')) {
                    return res.status(404).json({erro: errorMsg});
                } else if (errorMsg.includes('não está aberto') || errorMsg.includes('sem vagas') || errorMsg.includes('já inscrito')) {
                    return res.status(400).json({erro: errorMsg});
                } else {
                    return res.status(500).json({erro: errorMsg});
                }
            }

            // Sucesso
            res.status(201).json({
                mensagem: status.replace('SUCESSO: ', ''),
                usuario_id,
                evento_id,
                status: 'confirmado'
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
            inscricoes: results
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