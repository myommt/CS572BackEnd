import { Router } from 'express';
import { get_budget, post_budget, put_budget, delete_budget, get_budgetCount, get_budgets } from './budget.controller';
import { embeddingMiddleware } from './budget.middleware';

const router = Router();

router.get('/', get_budgets);
router.post('/', embeddingMiddleware, post_budget);
router.get('/gettotal', get_budgetCount);
router.get('/:budget_id', get_budget);
router.put('/:budget_id', embeddingMiddleware, put_budget);
router.delete('/:budget_id', delete_budget);

export default router;