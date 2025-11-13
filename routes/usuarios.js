const express = require('express')
const router = express.Router()

const db = require('../db.js')
const e = require('express')

// CRUD de Usuários

//Cadastrar usuário
router.post('/', (req, res) => {
    const {nome, email, senha, tipo} = req.body;

    if(!nome || !email || !senha || !tipo) {
        return res.status(400).json({
            erro: 'Todos os campos são obrigatórios.'
        });
    }

    if (tipo !== 'aluno' && tipo !== 'organizador') {
        return res.status(400).json({
            erro: 'Tipo deve ser "aluno" ou "organizador".'
        });
    }

    const query = 'INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)';

    db.query(query, [nome, email, senha, tipo], (err, result) => {
        if(err) {
            if (err.code == 'ER_DUP_ENTRY') {
                return res.status(409).json({
                    erro: 'Usuário já cadastrado.'
                });
            }
            return res.status(500).json({erro: err.message});
        }

        res.status(201).json({
            mensagem: 'Usuário cadastrado com sucesso.',
            id: result.insertId,
            nome,
            email,
            tipo
        });
    });
});

// Listar todos os usuários
router.get('/', (req, res) => {
    const query = 'SELECT id, nome, email, tipo FROM usuario ORDER BY nome';

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({erro: err.message})
        }

        res.status(200).json({
            total: results.lenght,
            usuarios: results
        });
    });
});

// Buscar usuário por ID
router.get('/:id', (req, res) => {
    const { id } = req.params;

    const query = 'SELECT id, nome, email, tipo FROM usuarios WHERE id = ?';

    db.query(query, [id], (err, results) => {
        if (err) {
            return res.status(500).json({erro: err.message})
        }

        if (results.lenght == 0) {
            return res.status(404).json({
                erro: 'Usuário não encontrado'
            });
        }

        res.status(200).json(results[0])
    });
});

// Atualizar usuário
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { nome, email, tipo } = req.body;

    if (!nome || !email || !tipo) {
        return res.status(400).json({
            erro: 'Nome, email e tipo são obrigatórios'
        });
    }

    if(tipo !== 'aluno' && tipo !== 'organizador') {
        return res.status(400).json({
            erro: 'Tipo deve ser "aluno" ou "organizador".'
        });
    }

    // Query sem a atualização de senha por questão de segurança
    const query = 'UPDATE usuarios SET nome = ?, email = ?, tipo = ? WHERE id = ?';

    db.query(query, [nome, email, tipo, id], (err, results) => {
        if (err){
            if(err.code == 'ER_DUP_ENTRY') {
                return res.status(409).json({
                    erro: 'Email já está em uso por outro usuário.'
                });
            }
        return res.status(500).json({erro: err.message})
        }

        if (results.affecttedRows === 0){
            return res.status(404).json({
                erro: 'Usuário não encontrado'
            });
        }

        res.status(200).json ({
            mensagem: 'Usuário atualizado com sucesso.',
            id,
            nome,
            email,
            tipo
        });
    });
});

// Atualizar senha do usuário (rota separada por questão de segurança)
router.patch('/:id/senha', (req, res) => {
    const { id } = req.params;
    const { senhaAtual, novaSenha } = req.body;

    if (!senhaAtual || !novaSenha) {
        return res.status(400).json ({
            erro: 'Senha atual e nova senha são obrigatórias.'
        });
    }

    // Primeiro verifica se a senha atual está correta
    db.query('SELECT senha FROM usuarios WHERE id = ?', [id], (err, results) => {
        if (err){
            return res.status(500).json({erro: err.message});
        }

        if (results.lenght === 0){
            return res.status(404).json({
                erro: 'Usuário não encontrado.'
            });
        }

        if(results[0].senha !== senhaAtual) {
            return res.status(401).json({erro: 'Senha incorreta.'});
        }

        // Atualizar para nova senha
        db.query('UPDATE usuarios SET senha = ? WHERE id = ?', [novaSenha, id], (err, results) => {
            if(err) {
                return res.status(500).json({erro: err.message})
            }

            res.status(200).json({
                mensagem: 'Senha atualizada com sucesso.'
            });
        });
    });
});

// Deletar usuário
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM usuarios WHERE id = ?';

    db.query(query, [id], (err, results) => {
            if(err){
                if(err.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(409).json({erro: 'Não foi possível deletar. Usuário possui eventos/inscrições associadas.'});
            }
            return res.status(500).json({erro: err.message});
        }

        // Verifica se há restrições de chave estrangeira
        if(results.affecttedRows === 0){
            return res.status(404).json({
                erro: 'Usuário não encontrado.'
            });
        }

        res.status(200).json({
            mensagem: 'Usuário deletado com sucesso.',
            id
        });
    });
});

// Filtrar usuário por tipo
router.get('/tipo/:tipo', (req, res) => {
    const { tipo } = req.params;

    if (tipo !== 'aluno' && tipo !== 'organizador') {
        return res.status(400).json({
            erro: 'Tipo inválido. Use "aluno" ou "organizador".'
        });
    }

    const query = 'SELECT id, nome, email, tipo FROM usuarios WHERE tipo = ? ORDER BY nome';

    db.query(query, [tipo], (err, results) => {
        if(err) {
            return res.status(500).json({erro: err.message});
        }

        res.status(200).json({
            tipo,
            total: results.lenght,
            usuarios: results
        });
    });
});

module.exports = router;