const mongoose = require('mongoose')

const feedbackSchema = new mongoose.Schema({
    evento_id: Number,
    usuario_id: Number,
    nota: { type: Number, min: 1, max: 5 },
    comentario: String,
    tags: [String],
    data: { type: Date, default: Date.now}
});

module.exports = mongoose.model('Feedback', feedbackSchema)