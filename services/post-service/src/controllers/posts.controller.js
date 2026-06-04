const Post = require('../models/post.model');

// [CREATE] Créer un post ou une réponse (Fx3)
exports.createPost = async (req, res) => {
    const { authorId, authorUsername, content, media, tags, parentPost } = req.body;

    try {
        const newPost = new Post({
            authorId,
            authorUsername,
            content,
            media: media || { type: null, url: null },
            tags: tags || [],
            parentPost: parentPost || null
        });

        const savedPost = await newPost.save();

        // Si c'est une réponse à un autre post, on incrémente le compteur du parent
        if (parentPost) {
            await Post.findByIdAndUpdate(parentPost, { $inc: { commentsCount: 1 } });
        }

        return res.status(201).json(savedPost);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

// [READ] Récupérer tous les posts principaux (Flux global Fx5)
// On filtre pour ne pas afficher les réponses au milieu du flux principal
exports.getAllMainPosts = async (req, res) => {
    try {
        const posts = await Post.find({ parentPost: null }).sort({ createdAt: -1 });
        return res.status(200).json(posts);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

// [READ] Récupérer un post et toutes ses réponses / commentaires (Fx7 & Fx8)
exports.getPostWithReplies = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: "Post introuvable" });

        // On cherche toutes les réponses qui ont ce post comme parent
        const replies = await Post.find({ parentPost: req.params.id }).sort({ createdAt: 1 });

        return res.status(200).json({
            post,
            replies
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

// [DELETE] Supprimer un post (Fx21)
exports.deletePost = async (req, res) => {
    try {
        const postToDelete = await Post.findById(req.params.id);
        if (!postToDelete) return res.status(404).json({ message: "Post introuvable" });

        // Si c'était une réponse, on décrémente le compteur du parent avant de la supprimer
        if (postToDelete.parentPost) {
            await Post.findByIdAndUpdate(postToDelete.parentPost, { $inc: { commentsCount: -1 } });
        }

        await Post.findByIdAndDelete(req.params.id);
        return res.status(200).json({ message: "Post supprimé avec succès." });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};