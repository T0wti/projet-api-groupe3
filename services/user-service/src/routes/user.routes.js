const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

router.post('/', userController.createUserProfile);
router.get('/:id', userController.getUserProfile);
router.put('/:id', userController.updateUserProfile);
router.delete('/:id', userController.deleteUserProfile);

module.exports = router;