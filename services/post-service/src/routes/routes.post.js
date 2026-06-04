const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');

router.post('/', postController.createPost);       // Créer un post principal OU une réponse
router.get('/', postController.getAllMainPosts);   // Avoir le flux (uniquement les posts racines)
router.get('/:id', postController.getPostWithReplies); // Avoir un post spécifique + ses commentaires
router.delete('/:id', postController.deletePost);  // Supprimer un post

module.exports = router;