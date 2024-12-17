import { ErrorRequestHandler, RequestHandler } from "express";
import OpenAI from 'openai';
import { Expense } from "../expense/expense.model";
import { budget } from "../budget/budget.model";

const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

export type Token = {
    _id: string,
    email: string,
    fullname: string;
};

export interface CombinedResults {
    expenses: Expense[];
    budgets: budget[];
}

export interface SummaryResponse {
    combinedResults: CombinedResults;
    summary: string;
}


export interface StandardResponse<T> {
    success: boolean;
    data: T;
}
export class ErrorWithStatus extends Error {
    constructor(public message: string, public status: number) {
        super(message);
    };
}

export const routerNotFoundHandler: RequestHandler = (req, res, next) => {
    next(new ErrorWithStatus('route not found', 404));
};


export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
    if (error instanceof ErrorWithStatus) {
        res.status(error.status).json({ error: error.message });
    } else {
        res.status(500).json({ error: error.message });
    }
};

export async function generateEmbedding(text: string) {
    try {
        const response = await openaiClient.embeddings.create({
            model: 'text-embedding-3-small',
            input: [text],
        });
        return response.data[0].embedding;
    } catch (error) {
        console.error('Error generating embedding:', error);
        return [];
    }
}


