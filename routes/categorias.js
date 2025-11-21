const express = require('express');
const router = express.Router();
const db = require('../db.js');

// Listar categorias
router.get('/', (req, res) => {
    db.query('SELECT id, nome, descricao FROM categorias ORDER BY nome', (err, results) => {
        if (err) return res.status(500).json({ erro: err.message });

        res.status(200).json({ total: results.length, categorias: results });
    });
});

// Criar categoria
router.post('/', (req, res) => {
    const { nome, descricao } = req.body;

    if (!nome) return res.status(400).json({ erro: 'Nome da categoria é obrigatório.' });

    db.query('INSERT INTO categorias (nome, descricao) VALUES (?, ?)', [nome, descricao || null], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ erro: 'Categoria já existe.' });
            return res.status(500).json({ erro: err.message });
        }

        res.status(201).json({ mensagem: 'Categoria criada com sucesso.', id: result.insertId });
    });
});

module.exports = router;
