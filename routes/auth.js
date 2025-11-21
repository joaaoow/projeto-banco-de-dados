const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db.js');
const { JWT_SECRET } = require('../middleware/auth');


router.post('/register', async (req, res) => {
    const { nome, email, senha, tipo, grupo_id } = req.body;

    console.log('Dados recebidos:', { nome, email, tipo, grupo_id });

    if (!nome || !email || !senha || !tipo || !grupo_id) {
        return res.status(400).json({ erro: 'Todos os campos são obrigatórios' });
    }

    if (!['aluno', 'organizador'].includes(tipo)) {
        return res.status(400).json({ erro: 'Tipo deve ser "aluno" ou "organizador"' });
    }

    try {
        // Hash da senha
        const senhaHash = await bcrypt.hash(senha, 10);

        // Gerar ID customizado
        const userId = await new Promise((resolve, reject) => {
            db.query('SELECT gerar_id_usuario() as id', (err, results) => {
                if (err) reject(err);
                else resolve(results[0].id);
            });
        });

        // Inserir usuário
        const query = 'INSERT INTO usuarios (id, nome, email, senha, grupo_id, tipo) VALUES (?, ?, ?, ?, ?, ?)';
        
        db.query(query, [userId, nome, email, senhaHash, grupo_id, tipo], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ erro: 'Email já cadastrado' });
                }
                return res.status(500).json({ erro: err.message });
            }

            res.status(201).json({
                mensagem: 'Usuário registrado com sucesso',
                usuario: { id: userId, nome, email, tipo }
            });
        });
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});


router.post('/login', (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
    }

    // Buscar usuário com informações do grupo
    const query = `
        SELECT u.id, u.nome, u.email, u.senha, u.tipo, u.ativo, 
               u.grupo_id, g.nome as grupo_nome, g.nivel_acesso
        FROM usuarios u
        INNER JOIN grupos_usuarios g ON u.grupo_id = g.id
        WHERE u.email = ?
    `;

    db.query(query, [email], async (err, results) => {
        if (err) {
            return res.status(500).json({ erro: err.message });
        }

        if (!results || results.length === 0) {
            return res.status(401).json({ erro: 'Email ou senha incorretos' });
        }

        const usuario = results[0];

        if (!usuario.ativo) {
            return res.status(403).json({ erro: 'Usuário inativo. Contate o administrador.' });
        }

        try {
            // Verificar senha
            const senhaValida = await bcrypt.compare(senha, usuario.senha);

            if (!senhaValida) {
                return res.status(401).json({ erro: 'Email ou senha incorretos' });
            }

            // Gerar token JWT
            const token = jwt.sign(
                {
                    id: usuario.id,
                    email: usuario.email,
                    tipo: usuario.tipo,
                    grupo_id: usuario.grupo_id,
                    nivel_acesso: usuario.nivel_acesso
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                mensagem: 'Login realizado com sucesso',
                token,
                usuario: {
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email,
                    tipo: usuario.tipo,
                    grupo: usuario.grupo_nome,
                    nivel_acesso: usuario.nivel_acesso
                }
            });
        } catch (err) {
            res.status(500).json({ erro: err.message });
        }
    });
});


router.get('/me', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ erro: 'Token não fornecido' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Buscar dados atualizados do usuário
        const query = `
            SELECT u.id, u.nome, u.email, u.tipo, u.ativo,
                   g.nome as grupo_nome, g.nivel_acesso
            FROM usuarios u
            INNER JOIN grupos_usuarios g ON u.grupo_id = g.id
            WHERE u.id = ?
        `;

        db.query(query, [decoded.id], (err, results) => {
            if (err) {
                return res.status(500).json({ erro: err.message });
            }

            if (!results || results.length === 0) {
                return res.status(404).json({ erro: 'Usuário não encontrado' });
            }

            res.json({ usuario: results[0] });
        });
    } catch (err) {
        res.status(401).json({ erro: 'Token inválido ou expirado' });
    }
});

module.exports = router;
