import { Request, Response, NextFunction, RequestHandler } from 'express';
import { generateEmbedding, StandardResponse } from '../utils/common';
import { budget, budgetModel } from './budget.model';

export const embeddingMiddleware: RequestHandler = async (req, res, next) => {
    try {
        if (req.body) {
            const budget: budget = req.body;
            const budgetEmbedding = await generateEmbedding(JSON.stringify(budget));
            budget.budgetEmbedding = budgetEmbedding;
            req.body = budget;
            next();

        }
    } catch (error) {
        next(error);
    }
};