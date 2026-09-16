const express = require('express');
const router = express.Router();
const incomeController = require('../controllers/incomeController');
const { protect } = require('../middleware/auth');
const { validateIncome } = require('../validators/incomeValidator');

// All income routes require authentication
router.use(protect);

router.post('/', validateIncome, incomeController.createIncome);
router.get('/', incomeController.getIncomes);
router.get('/:id', incomeController.getIncomeById);
router.put('/:id', incomeController.updateIncome);
router.delete('/:id', incomeController.deleteIncome);

module.exports = router;
