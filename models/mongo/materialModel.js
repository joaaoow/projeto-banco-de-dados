import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema({
    evento_id: Number,
    tipo: String,
    titulo: String,
    arquivo: String, // base64
    links: [String],
    downloads: { type: Number, default: 0 }
});

export const Material = mongoose.model('Material', materialSchema);