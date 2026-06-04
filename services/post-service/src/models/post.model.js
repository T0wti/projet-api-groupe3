const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    authorId: { type: String, required: true }, // UUID de l'Auth/User Service
    authorUsername: { type: String, required: true },
    content: { type: String, required: true, maxlength: 280 }, 
        media: {
        type: { type: String, enum: ['image', 'video'], default: null },
        url: { type: String, default: null }
    },
    
    tags: [{ type: String }],
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    
    parentPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null }
}, {
    timestamps: true // Génère automatiquement createdAt et updatedAt au format ISODate
});

module.exports = mongoose.model('Post', PostSchema);