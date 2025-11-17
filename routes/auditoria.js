const express = require('express');
const router = express.Router();
const db = require('../db.js');

// Obter logs de auditoria (com paginação opcional)
router.get('/', (req, res) => {
    const { tabela, limite = 100, offset = 0 } = req.query;

    let query = 'SELECT * FROM auditoria';
    let params = [];

    // Filtrar por tabela específica se fornecido
    if (tabela) {
        query += ' WHERE tabela_afetada = ?';
        params.push(tabela);
    }

    query += ' ORDER BY data_hora DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limite), parseInt(offset));

    db.query(query, params, (err, results) => {
        if (err) {
            return res.status(500).json({ erro: err.message });
        }

        // Contar total de registros para paginação
        let countQuery = 'SELECT COUNT(*) as total FROM auditoria';
        let countParams = [];

        if (tabela) {
            countQuery += ' WHERE tabela_afetada = ?';
            countParams.push(tabela);
        }

        db.query(countQuery, countParams, (err, countResults) => {
            if (err) {
                return res.status(500).json({ erro: err.message });
            }

            res.status(200).json({
                total: countResults[0].total,
                limite: parseInt(limite),
                offset: parseInt(offset),
                logs: results
            });
        });
    });
});

// Obter logs de auditoria por usuário específico
router.get('/usuario/:usuario_id', (req, res) => {
    const { usuario_id } = req.params;
    const { limite = 50, offset = 0 } = req.query;

    const query = `
        SELECT * FROM auditoria 
        WHERE usuario = ? 
        ORDER BY data_hora DESC 
        LIMIT ? OFFSET ?
    `;

    db.query(query, [usuario_id, parseInt(limite), parseInt(offset)], (err, results) => {
        if (err) {
            return res.status(500).json({ erro: err.message });
        }

        // Contar total
        db.query('SELECT COUNT(*) as total FROM auditoria WHERE usuario = ?', [usuario_id], (err, countResults) => {
            if (err) {
                return res.status(500).json({ erro: err.message });
            }

            res.status(200).json({
                usuario_id,
                total: countResults[0].total,
                limite: parseInt(limite),
                offset: parseInt(offset),
                logs: results
            });
        });
    });
});

// Obter logs de auditoria por tipo de operação
router.get('/operacao/:operacao', (req, res) => {
    const { operacao } = req.params;
    const { limite = 50, offset = 0 } = req.query;

    // Validar operação
    if (!['INSERT', 'UPDATE', 'DELETE'].includes(operacao.toUpperCase())) {
        return res.status(400).json({
            erro: 'Operação inválida. Use INSERT, UPDATE ou DELETE.'
        });
    }

    const query = `
        SELECT * FROM auditoria 
        WHERE operacao = ? 
        ORDER BY data_hora DESC 
        LIMIT ? OFFSET ?
    `;

    db.query(query, [operacao.toUpperCase(), parseInt(limite), parseInt(offset)], (err, results) => {
        if (err) {
            return res.status(500).json({ erro: err.message });
        }

        // Contar total
        db.query('SELECT COUNT(*) as total FROM auditoria WHERE operacao = ?', [operacao.toUpperCase()], (err, countResults) => {
            if (err) {
                return res.status(500).json({ erro: err.message });
            }

            res.status(200).json({
                operacao: operacao.toUpperCase(),
                total: countResults[0].total,
                limite: parseInt(limite),
                offset: parseInt(offset),
                logs: results
            });
        });
    });
});

module.exports = router;
