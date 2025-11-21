const express = require('express');
const router = express.Router();
const Feedback = require('../models/mongo/feedbackModel.js')

// CRUD Feedbacks

// Cria novo feedback
router.post('/', async(req, res) => {
    try{
        console.log('📝 Recebendo feedback:', req.body);
        
        const { evento_id, usuario_id, nota, comentario, tags } = req.body;
        
        console.log('Valores extraídos:', { evento_id, usuario_id, nota, comentario, tags });
        
        if(!evento_id || !usuario_id || !nota) {
            console.log('❌ Validação falhou:', { evento_id, usuario_id, nota });
            return res.status(400).json({erro: 'Evento, usuário e nota são obrigatórios.'});
        }

        const novoFeedback = new Feedback({ evento_id, usuario_id, nota, comentario, tags });
        await novoFeedback.save();

        console.log('✅ Feedback salvo:', novoFeedback);

        res.status(201).json({
            mensagem: 'Feedback registrado com sucesso.', 
            data: novoFeedback
        });
    } catch (err){
        console.error('❌ Erro ao salvar feedback:', err);
        return res.status(500).json({ erro: err.message });
    }
});

// Lista todos os feedbacks
router.get('/', async(req,res) => {
    try{
        const feedbacks = await Feedback.find();
        res.status(200).json({success: true, data: feedbacks});
    } catch(err){
        return res.status(500).json({success: false, error: err.message});
    }
});

// Listar feedbacks de um evento
router.get('/evento/:evento_id', async(req, res) => {
    try{
        const { evento_id } = req.params;
        const feedbacks = await Feedback.find({ evento_id });

        res.status(200).json({
            total: feedbacks.length,
            feedbacks
        });
    } catch (err){
        res.status(500).json({erro: err.message})
    }
});

// Média de avaliações por evento
router.get('/evento/:evento_id/media', async(req, res) => {
    try{
        const { evento_id } = req.params;

        const resultado = await Feedback.aggregate([
            { $match: { evento_id: Number(evento_id) } },
            { $group: { _id: '$evento_id', media: { $avg: '$nota' }, total: { $sum: 1} } }
        ]);
        if (resultado.length === 0) return res.status(404).json({erro: 'Sem avaliações.'});

        res.status(200).json(resultado[0]);
    } catch (err){
        res.status(500).json({erro: err.message});
    }
});

// Atualizar comentário ou nota
router.put('/:id', async(req, res) => {
    try{
        const feedback = await Feedback.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if(!feedback) return res.status(404).json({
            mensagem: 'Feedback não encontrado.'
        });

        res.status(200).json({
            mensagem: 'Feedback atualizado com sucesso.',
            feedback
        });
    } catch (err){
        res.status(500).json({erro: err.message});
    }
});

// Deletar feedback
router.delete('/:id', async(req, res) => {
    try{
        const feedback = await Feedback.findByIdAndDelete(req.params.id);

        if (!feedback) return res.status(404).json({mensagem: 'feedback não encontrado.'});

        res.status(200).json({
            mensagem: 'Feedback deletado com sucesso.'
        });
    } catch(err){
        res.status(500).json({erro: err.message});
    }
});

module.exports = router;