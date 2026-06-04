const express = require('express');
const userRoutes = require('./routes/user.routes');
require('dotenv').config();

const app = express();

// Middlewares obligatoires pour intercepter le JSON envoyé par le client
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Liaison des routes du service
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`User Service en ligne sur le port ${PORT}`);
});