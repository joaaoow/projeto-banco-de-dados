const express = require('express');
const router = express.Router();
const db = require('../db.js');

/**
 * GET /relatorios/usuarios - Estatísticas de usuários por grupo (usando view)
 */
router.get('/usuarios', (req, res) => {
    const query = 'SELECT * FROM vw_estatisticas_usuarios ORDER BY nivel_acesso';
    
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({erro: err.message});

        res.status(200).json({
            total_grupos: results.length,
            estatisticas: results
        });
    });
});

/**
 * GET /relatorios/auditoria - Log de auditoria (últimos 100 registros)
 * Query params: ?tabela=eventos&operacao=UPDATE&usuario_id=USR-xxx&limit=50
 */
router.get('/auditoria', (req, res) => {
    const { tabela, operacao, usuario_id, limit } = req.query;
    
    let query = 'SELECT * FROM auditoria WHERE 1=1';
    const params = [];

    if (tabela) {
        query += ' AND tabela = ?';
        params.push(tabela);
    }

    if (operacao) {
        query += ' AND operacao = ?';
        params.push(operacao);
    }

    if (usuario_id) {
        query += ' AND usuario_id = ?';
        params.push(usuario_id);
    }

    query += ' ORDER BY data_operacao DESC LIMIT ?';
    params.push(parseInt(limit) || 100);

    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json({erro: err.message});

        res.status(200).json({
            total: results.length,
            registros: results
        });
    });
});

/**
 * GET /relatorios/eventos/:id/ocupacao - Taxa de ocupação de um evento
 * Usa a function calcular_taxa_ocupacao()
 */
router.get('/eventos/:id/ocupacao', (req, res) => {
    const { id } = req.params;

    db.query('SELECT calcular_taxa_ocupacao(?) as taxa_ocupacao', [id], (err, results) => {
        if (err) return res.status(500).json({erro: err.message});

        const taxa = results[0].taxa_ocupacao;

        // Busca dados básicos do evento
        db.query('SELECT id, titulo, vagas, vagas_disponiveis FROM eventos WHERE id = ?', [id], (err, evento) => {
            if (err) return res.status(500).json({erro: err.message});
            
            if (!evento || evento.length === 0) {
                return res.status(404).json({erro: 'Evento não encontrado'});
            }

            res.status(200).json({
                evento_id: evento[0].id,
                titulo: evento[0].titulo,
                vagas_totais: evento[0].vagas,
                vagas_disponiveis: evento[0].vagas_disponiveis,
                vagas_ocupadas: evento[0].vagas - evento[0].vagas_disponiveis,
                taxa_ocupacao_percentual: parseFloat(taxa),
                status_ocupacao: taxa >= 100 ? 'Lotado' : taxa >= 80 ? 'Quase lotado' : taxa >= 50 ? 'Meia ocupação' : 'Disponível'
            });
        });
    });
});

/**
 * GET /relatorios/eventos/disponiveis - Eventos disponíveis com taxa de ocupação
 */
router.get('/eventos/disponiveis', (req, res) => {
    const query = `
        SELECT 
            id, 
            titulo, 
            data_evento, 
            vagas, 
            vagas_disponiveis,
            calcular_taxa_ocupacao(id) as taxa_ocupacao
        FROM eventos 
        WHERE vagas_disponiveis > 0 
        AND data_evento > NOW()
        AND status = 'aberto'
        ORDER BY data_evento ASC
    `;

    db.query(query, (err, results) => {
        if (err) return res.status(500).json({erro: err.message});

        res.status(200).json({
            total: results.length,
            eventos: results.map(e => ({
                ...e,
                taxa_ocupacao: parseFloat(e.taxa_ocupacao)
            }))
        });
    });
});

/**
 * GET /relatorios/categorias - Estatísticas por categoria
 */
router.get('/categorias', (req, res) => {
    const query = `
        SELECT 
            c.id,
            c.nome,
            c.descricao,
            COUNT(e.id) as total_eventos,
            SUM(e.vagas) as total_vagas,
            SUM(e.vagas - e.vagas_disponiveis) as vagas_ocupadas,
            ROUND(AVG(calcular_taxa_ocupacao(e.id)), 2) as taxa_ocupacao_media
        FROM categorias c
        LEFT JOIN eventos e ON c.id = e.categoria_id
        GROUP BY c.id, c.nome, c.descricao
        ORDER BY total_eventos DESC
    `;

    db.query(query, (err, results) => {
        if (err) return res.status(500).json({erro: err.message});

        res.status(200).json({
            total_categorias: results.length,
            categorias: results
        });
    });
});

module.exports = router;
