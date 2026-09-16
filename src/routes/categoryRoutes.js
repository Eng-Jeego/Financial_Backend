const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect } = require('../middleware/auth');
const { validateCategory } = require('../validators/categoryValidator');

// All category routes require authentication
router.use(protect);

router.get('/', categoryController.getCategories);
router.post('/', validateCategory, categoryController.createCategory);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
