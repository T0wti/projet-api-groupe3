const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// Fonction pour initialiser la table (Le Modèle)
const initDatabase = async () => {
    let retries = 5;
    while (retries) {
        try {
            const sqlPath = path.join(__dirname, '../models/user.model.sql');
            const sql = fs.readFileSync(sqlPath, 'utf8');
            
            await pool.query(sql);
            console.log('Table "users" vérifiée / créée avec succès.');
            break; // Succès ! On sort de la boucle.
        } catch (error) {
            console.log('⏳ La base de données n\'est pas encore prête, nouvelle tentative dans 3 secondes...');
            retries -= 1;
            // On attend 3 secondes avant la prochaine tentative
            await new Promise(res => setTimeout(res, 3000));
            
            if (retries === 0) {
                console.error('❌ Impossible de se connecter à la base de données après plusieurs tentatives :', error);
            }
        }
    }
};

pool.on('connect', () => {
    console.log('Connecté à la base PostgreSQL du User Service');
});

// On lance l'initialisation dès que ce fichier est requis
initDatabase();

module.exports = pool;