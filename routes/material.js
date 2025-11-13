const express = require('express');
const router = express.Router();
const Material = require('../models/mongo/materialModel.js')

// CRUD Material

// Criar material
router.put('/materiais', async(req, res) => {
    try{
        const { evento_id, tipo, titulo, arquivo, links, downloads } = req.body;
        
        const novoMaterial = new Material({
            evento_id,
            tipo,
            titulo,
            arquivo,
            links,
            downloads: 0 // Default zero.
        });

        await novoMaterial.save(); // Espera salvar o material no banco NoSql MongoDB

        res.status(201).json({
            success: true,
            data: novoMaterial
        });
    } catch(err){
        res.status(400).json({
            success: false,
            error: err.message
        });
    }
});

// Listar materiais
router.get('/materiais', async (req, res) => {
    try{
        const materiais = await Material.find(); // Espera o Mongo fazer a busca
        res.status(200).json({
            success: true,
            data: materiais
        });
    } catch(err){
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

// Buscar material por evento
router.get('/materiais/evento/:evento_id', async (req, res) => {
    try{
        const materiais = await Material.find({ evento_id: req.params.evento_id})
        res.status(200).json({
            success: true,
            data: materiais
        });
    }catch(err){
        res.status(500).json({success: false, error: err.message});
    }
});

router.put('/materiais/:id/download', async(req, res) => {
    try{
        const material = await Material.findByIdAndUpdate(
            req.params.id,
            { $inc: {downloads: 1} },
            { new: true }
        );
        if (!material){
            return res.status(404).json({success: false, error: "Material não encontrado."});
        }
        res.status(200).json({success: true, data: material});
    } catch(err){
        res.status(500).json({success: false, error: err.message});
    }
});

module.exports = router;