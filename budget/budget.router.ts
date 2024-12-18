import { Router } from 'express';
import { get_budget, post_budget, put_budget, delete_budget, get_budgetCount, get_budgets } from './budget.controller';
import { embeddingMiddleware } from './budget.middleware';
import { checkToken } from '../users/users.middleware';

const router = Router();

router.get('/', checkToken, get_budgets);
router.post('/', checkToken, embeddingMiddleware, post_budget);
router.get('/gettotal', checkToken, get_budgetCount);
router.get('/:budget_id', checkToken, get_budget);
router.put('/:budget_id', checkToken, embeddingMiddleware, put_budget);
router.delete('/:budget_id', checkToken, delete_budget);

export default router;