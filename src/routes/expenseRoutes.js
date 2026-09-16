const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');
const { validateExpense } = require('../validators/expenseValidator');

// All expense routes require authentication
router.use(protect);

router.post('/', validateExpense, expenseController.createExpense);
router.get('/', expenseController.getExpenses);
router.get('/:id', expenseController.getExpenseById);
router.put('/:id', expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;
