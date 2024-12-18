import { Router } from 'express';
import { get_expenses, delete_expense, get_expense, post_expense, put_expense, get_expensesCount, getAllandgenerateEmbedding, get_expenseSummary } from './expense.controller';
import { checkToken } from '../users/users.middleware';
import { embeddingMiddleware } from './expense.middleware';

const router = Router();

router.get('/', checkToken, get_expenses);
router.post('/', checkToken, embeddingMiddleware, post_expense);
router.get('/gettotal', checkToken, get_expensesCount);
//router.put('/getallandgenerateembedding', getAllandgenerateEmbedding);//patching the embedding only
router.get('/getexpensesummary', checkToken, get_expenseSummary);
router.get('/:expense_id', checkToken, get_expense);
router.put('/:expense_id', checkToken, embeddingMiddleware, put_expense);
router.delete('/:expense_id', checkToken, delete_expense);

export default router;