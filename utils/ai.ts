import { RequestHandler } from 'express';
import OpenAI from 'openai';
import { Expense, ExpenseModel } from '../expense/expense.model';
import { budget, budgetModel } from '../budget/budget.model';
import { CombinedResults, generateEmbedding, StandardResponse, SummaryResponse } from './common';
import mongoose from 'mongoose';
const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

export const combinedVectorAndAnalysis: RequestHandler<unknown, StandardResponse<SummaryResponse>, unknown, { year: string; month: string; }> = async (req, res, next) => {
    try {
        if (!req.user?._id) { throw new Error('User ID is missing'); }

        const userId = new mongoose.Types.ObjectId(req.user._id);
        const year = +req.query.year || new Date().getFullYear();
        const month = +req.query.month || new Date().getMonth() + 1;
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 1);

        const expenseCount = await get_expensesCount(startOfMonth, endOfMonth, userId) || 0;
        const budgetCount = await get_budgetCount(startOfMonth, endOfMonth, userId) || 0;

        if (expenseCount > 0 && budgetCount > 0) {
            // Define query vectors for expenses and budgets
            const queryEmbeddingExpense = await generateEmbedding(`Query vector for expenses between ${startOfMonth} and ${endOfMonth}`);
            const queryEmbeddingBudget = await generateEmbedding(`Query vector for budget between ${startOfMonth} and ${endOfMonth}`);

            // Vector search for expenses
            const expenseResults: Expense[] = await ExpenseModel.aggregate([
                {
                    "$vectorSearch": {
                        "index": "v_expense_index",
                        "limit": expenseCount,
                        "numCandidates": expenseCount,
                        "path": "expenseEmbedding",
                        "queryVector": queryEmbeddingExpense,
                        "filter": {}
                    }
                },
                {
                    "$match": { user_id: userId, date: { $gte: startOfMonth, $lt: endOfMonth } }
                },
                {
                    '$project': { '_id': 0, 'expenseEmbedding': 0 }
                }
            ]);

            // Vector search for budgets
            const budgetResults: budget[] = await budgetModel.aggregate([
                {
                    "$vectorSearch": {
                        "index": "v_budget_index",
                        "limit": budgetCount,
                        "numCandidates": budgetCount,
                        "path": "budgetEmbedding",
                        "queryVector": queryEmbeddingBudget,
                        "filter": {}
                    }
                },
                {
                    "$match": { user_id: userId, date: { $gte: startOfMonth, $lt: endOfMonth } }
                },
                {
                    '$project': { '_id': 0, 'budgetEmbedding': 0 }
                }
            ]);

            const combinedResults: CombinedResults = {
                expenses: expenseResults,
                budgets: budgetResults
            };
            // Summarize using GPT-4
            const prompt = `Provide a summary of the trends of ${month}, ${year} based on the following data:\n${JSON.stringify(combinedResults)}
        and advise 5 points with listing to aware in next month. Send your answer in HTML format, using mainly headers <h1> <h2>, lists <li>, and paragraphs <p>, but <html><body> tags are not required`;


            const completion = await openaiClient.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: "system", content: "You are a helpful assistant." },
                    { role: "user", content: prompt },
                ],
            });

            let summary = completion.choices[0].message?.content || "No summary generated.";
            summary = summary.replace(/```html/g, '').replace(/```/g, '');//remove the code block

            res.json({ success: true, data: { combinedResults, summary } });
        }
        else if (budgetCount > 0) {
            const queryEmbeddingBudget = await generateEmbedding(`Query vector for budget between ${startOfMonth} and ${endOfMonth}`);
            const expenseResults: Expense[] = [];
            const budgetResults: budget[] = await budgetModel.aggregate([
                {
                    "$vectorSearch": {
                        "index": "v_budget_index",
                        "limit": budgetCount,
                        "numCandidates": budgetCount,
                        "path": "budgetEmbedding",
                        "queryVector": queryEmbeddingBudget,
                        "filter": {}
                    }
                },
                {
                    "$match": { user_id: userId, date: { $gte: startOfMonth, $lt: endOfMonth } }
                },
                {
                    '$project': { '_id': 0, 'budgetEmbedding': 0 }
                }
            ]);
            const combinedResults: CombinedResults = {
                expenses: expenseResults,
                budgets: budgetResults
            };

            // Summarize using GPT-4
            const prompt = `Based on the following budget data of ${month}, ${year} :\n${JSON.stringify(budgetResults)}
        and advise 5 points with listing to aware in this month. Send your answer in HTML format, using mainly headers <h1> <h2>, lists <li>, and paragraphs <p>, but <html><body> tags are not required`;


            const completion = await openaiClient.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: "system", content: "You are a helpful assistant." },
                    { role: "user", content: prompt },
                ],
            });

            let summary = completion.choices[0].message?.content || "No summary generated.";
            summary = summary.replace(/```html/g, '').replace(/```/g, '');//remove the code block

            res.json({ success: true, data: { combinedResults, summary } });

        }
        else {
            const expenseResults: Expense[] = [];
            const budgetResults: budget[] = [];
            let summary = "No summary generated.";
            const combinedResults: CombinedResults = {
                expenses: expenseResults,
                budgets: budgetResults
            };

            res.json({ success: true, data: { combinedResults, summary } });
        }
    } catch (error) {
        console.error('Error during vector search or summary generation:', error);
        next(error);
    }
};



async function get_expensesCount(startOfMonth: Date, endOfMonth: Date, userid: mongoose.Types.ObjectId) {
    try {
        const total = await ExpenseModel.aggregate([
            {
                $match: {
                    user_id: userid,
                    date: { $gte: startOfMonth, $lt: endOfMonth }
                }
            }, { $group: { _id: null, total: { $sum: 1 } } }
        ]);

        const totalCount: number = total.length > 0 ? total[0].total : 0;
        return totalCount;
    } catch (err) {
        if (err instanceof Error) {
            throw new Error(err.message);
        }
    }
}

async function get_budgetCount(startOfMonth: Date, endOfMonth: Date, userid: mongoose.Types.ObjectId) {
    try {

        const total = await budgetModel.aggregate([
            {
                $match: {
                    user_id: userid,
                    date: { $gte: startOfMonth, $lt: endOfMonth }
                }
            }, { $group: { _id: null, total: { $sum: 1 } } }
        ]);

        const totalCount: number = total.length > 0 ? total[0].total : 0;
        return totalCount;
    } catch (err) {
        if (err instanceof Error) {
            throw new Error(err.message);
        }
    }
}
