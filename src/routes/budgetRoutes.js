const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const { protect } = require('../middleware/auth');
const { validateBudget } = require('../validators/budgetValidator');

// All budget routes require authentication
router.use(protect);

router.post('/', validateBudget, budgetController.createBudget);
router.get('/', budgetController.getBudgets);
router.get('/:id', budgetController.getBudgetById);
router.put('/:id', budgetController.updateBudget);
router.delete('/:id', budgetController.deleteBudget);

module.exports = router;
