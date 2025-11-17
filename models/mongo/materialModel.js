const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
    evento_id: Number,
    tipo: String,
    titulo: String,
    arquivo: String, // base64
    links: [String],
    downloads: { type: Number, default: 0 }
});

module.exports = mongoose.model('Material', materialSchema);