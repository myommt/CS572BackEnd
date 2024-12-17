import { Router } from 'express';
import { get_expenses, delete_expense, get_expense, post_expense, put_expense, get_expensesCount, getAllandgenerateEmbedding, get_expenseSummary } from './expense.controller';
import { checkToken } from '../users/users.middleware';
import { embeddingMiddleware } from './expense.middleware';

const router = Router();

router.get('/', get_expenses);
router.post('/', embeddingMiddleware, post_expense);
router.get('/gettotal', get_expensesCount);
//router.put('/getallandgenerateembedding', getAllandgenerateEmbedding);//patching the embedding only
router.get('/getexpensesummary', get_expenseSummary);
router.get('/:expense_id', get_expense);
router.put('/:expense_id', embeddingMiddleware, put_expense);
router.delete('/:expense_id', delete_expense);

export default router;