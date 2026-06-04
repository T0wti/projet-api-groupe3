const express = require('express');
const mongoose = require('mongoose');
const postRoutes = require('./routes/post.routes');
require('dotenv').config();

const app = express();
app.use(express.json());

// Connexion MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('🍃 Connecté à MongoDB pour le Post Service'))
    .catch(err => console.error('❌ Erreur de connexion MongoDB:', err));

app.use('/api/posts', postRoutes);

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
    console.log(`Post Service en ligne sur le port ${PORT}`);
});