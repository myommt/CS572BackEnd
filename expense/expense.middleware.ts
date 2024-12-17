import { Request, Response, NextFunction, RequestHandler } from 'express';
import { generateEmbedding, StandardResponse } from '../utils/common';
import { Expense, ExpenseModel } from '../expense/expense.model';

export const embeddingMiddleware: RequestHandler = async (req, res, next) => {
    try {
        if (req.body) {
            const expense: Expense = req.body;
            const expenseEmbedding = await generateEmbedding(JSON.stringify(expense));
            expense.expenseEmbedding = expenseEmbedding;
            req.body = expense;
            next();

        }
    } catch (error) {
        next(error);
    }
};