const express = require('express');
const router = express.Router();
const db = require('../db.js');

// CRUD  de Eventos

// Criar novo evento
router.post('/', (req, res) => {
    const { titulo, descricao, data_evento, vagas, organizador_id, categoria_id } = req.body;

    console.log('📝 Criando evento:', { titulo, descricao, data_evento, vagas, organizador_id, categoria_id });

    // Validação dos campos obrigatórios
    if(!titulo || !data_evento || !vagas || !organizador_id){
        return res.status(400).json({
            erro: 'Título, data, vagas e organizador são obrigatórios.'
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

        // Gera ID customizado usando a function
        db.query('SELECT gerar_id_evento() as id', (err, idResult) => {
            if (err) return res.status(500).json({erro: err.message});

            const eventoId = idResult[0].id;
            
            // Inserir com vagas_disponiveis = vagas e status = 'aberto'
            const query = `
                INSERT INTO eventos 
                (id, titulo, descricao, data_evento, vagas, vagas_disponiveis, organizador_id, categoria_id, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'aberto')
            `;

            db.query(query, [eventoId, titulo, descricao || null, data_evento, vagas, vagas, organizador_id, categoria_id || null], (err, results) => {
                if (err) return res.status(500).json({erro: err.message});

                res.status(201).json({ 
                    mensagem: 'Evento criado com sucesso', 
                    id: eventoId, 
                    titulo, 
                    data_evento, 
                    vagas 
                });
            });
        });
    });
});

// Listar todos os eventos (usando view)
router.get('/', (req, res) => {
    const query = 'SELECT * FROM vw_eventos_completos ORDER BY data_evento DESC';
    
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({erro: err.message});

        // Mapear os nomes das colunas da view para o formato esperado pelo frontend
        const eventos = results.map(evento => ({
            id: evento.id,
            titulo: evento.titulo,
            descricao: evento.descricao,
            data_evento: evento.data_evento,
            vagas: evento.vagas,
            vagas_disponiveis: evento.vagas_disponiveis,
            status: evento.status,
            organizador: evento.organizador_nome,
            organizador_email: evento.organizador_email,
            categoria: evento.categoria_nome,
            inscritos: evento.inscricoes_confirmadas || 0,
            total_inscricoes: evento.total_inscricoes || 0,
            taxa_ocupacao: evento.taxa_ocupacao || 0
        }));

        res.status(200).json({
            total: eventos.length,
            eventos: eventos
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

        // Adicionar taxa de ocupação usando a função do banco
        const evento = results[0];
        
        db.query('SELECT calcular_taxa_ocupacao(?) as taxa_ocupacao', [id], (err, taxaResults) => {
            if (err) {
                // Se houver erro, retorna sem a taxa
                return res.status(200).json(evento);
            }

            evento.taxa_ocupacao = taxaResults[0].taxa_ocupacao;
            res.status(200).json(evento);
        });
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

// Eventos por organizador (usando procedure)
router.get('/organizador/:organizador_id', (req, res) => {
    const { organizador_id } = req.params;

    console.log('🔍 Buscando eventos do organizador:', organizador_id);

    db.query('CALL relatorio_eventos_organizador(?)', [organizador_id], (err, results) => {
        if (err) {
            console.error('❌ Erro na procedure:', err.message);
            return res.status(500).json({erro: err.message});
        }

        // Procedures retornam array de arrays
        const eventos = results[0];
        
        console.log('📊 Eventos encontrados:', eventos.length);
        console.log('📋 Dados:', eventos);

        // Mapear os campos para o formato esperado pelo frontend
        const eventosMapeados = eventos.map(evento => ({
            id: evento.id,
            titulo: evento.titulo,
            descricao: evento.descricao || null,
            data_evento: evento.data_evento,
            vagas: evento.vagas,
            vagas_totais: evento.vagas,
            vagas_disponiveis: evento.vagas_disponiveis,
            status: evento.status,
            total_inscricoes: evento.total_inscricoes || 0,
            total_presentes: evento.total_presentes || 0,
            taxa_ocupacao: evento.taxa_ocupacao_pct || 0
        }));

        console.log('✅ Enviando resposta com', eventosMapeados.length, 'eventos');

        res.status(200).json({
            total: eventosMapeados.length,
            eventos: eventosMapeados
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

    // Deletar evento (CASCADE vai remover as inscrições automaticamente se configurado)
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