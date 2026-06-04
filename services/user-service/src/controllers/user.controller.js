const pool = require('../config/db');

// [CREATE] Initialiser un profil (Fx1)
exports.createUserProfile = async (req, res) => {
    const { id, username, email } = req.body;

    if (!id || !username || !email) {
        return res.status(400).json({ message: "Champs requis manquants (id, username, email)." });
    }

    try {
        const query = `
            INSERT INTO users (id, username, email) 
            VALUES ($1, $2, $3) 
            RETURNING *;
        `;
        const result = await pool.query(query, [id, username, email]);
        return res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
};

// [READ] Récupérer un profil par son ID (Fx10)
exports.getUserProfile = async (req, res) => {
    const { id } = req.params;

    try {
        const query = 'SELECT * FROM users WHERE id = $1;';
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }

        return res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
};

// [UPDATE] Modifier ses informations ou préférences (Fx10, Fx22, Fx23)
exports.updateUserProfile = async (req, res) => {
    const { id } = req.params;
    const { bio, avatar_url, language_preference, theme_preference } = req.body;

    try {
        const query = `
            UPDATE users 
            SET bio = COALESCE($1, bio), 
                avatar_url = COALESCE($2, avatar_url), 
                language_preference = COALESCE($3, language_preference), 
                theme_preference = COALESCE($4, theme_preference),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $5
            RETURNING *;
        `;
        const values = [bio, avatar_url, language_preference, theme_preference, id];
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }

        return res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
};

// [DELETE] Supprimer un compte
exports.deleteUserProfile = async (req, res) => {
    const { id } = req.params;

    try {
        const query = 'DELETE FROM users WHERE id = $1 RETURNING *;';
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }

        return res.status(200).json({ message: "Compte supprimé avec succès." });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
};