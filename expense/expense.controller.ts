import { RequestHandler } from "express";
import { generateEmbedding, StandardResponse } from "../utils/common";
import { Expense, ExpenseModel, ExpenseSummary } from "./expense.model";
import mongoose from "mongoose";

export const get_expenses: RequestHandler<unknown, StandardResponse<Expense[]>, unknown, { page: string, pageSize: string; year: string; month: string; }>
    = async (req, res, next) => {
        try {
            const page = +req.query.page || 1;
            const pageSize = +req.query.pageSize || 20;
            const year = +req.query.year || new Date().getFullYear();
            const month = +req.query.month || new Date().getMonth() + 1;

            const startOfMonth = new Date(year, month - 1, 1);
            const endOfMonth = new Date(year, month, 1);
            const results: Expense[] = await ExpenseModel.aggregate([{
                $match: {
                    user_id: req.user?._id,
                    date: { $gte: startOfMonth, $lt: endOfMonth }
                }
            },
            { $sort: { date: -1 } },
            { $skip: (page - 1) * pageSize },
            { $limit: pageSize },
            {
                $project: {
                    _id: 0,
                    expense_id: '$_id',
                    title: 1,
                    category: 1,
                    date: 1,
                    amount: 1,
                    user_id: 1,
                }
            }]);
            res.json({ success: true, data: results });
        } catch (err) {
            next(err);
        }
    };

export const get_expensesCount: RequestHandler<unknown, StandardResponse<number>, unknown, { year: string; month: string; }>
    = async (req, res, next) => {
        try {
            const year = +req.query.year || new Date().getFullYear();
            const month = +req.query.month || new Date().getMonth() + 1;

            const startOfMonth = new Date(year, month - 1, 1);
            const endOfMonth = new Date(year, month, 1);

            const total: { _id: null, total: number; }[] = await ExpenseModel.aggregate([
                {
                    $match: {
                        user_id: req.user?._id,
                        date: { $gte: startOfMonth, $lt: endOfMonth }
                    }
                }, { $group: { _id: null, total: { $sum: 1 } } }
            ]);

            const totalCount: number = total.length > 0 ? total[0].total : 0;
            res.json({ success: true, data: totalCount });
        } catch (err) {
            next(err);
        }
    };

export const get_expense: RequestHandler<{ expense_id: string; }, StandardResponse<Expense | null>, unknown, unknown>
    = async (req, res, next) => {
        try {
            const { expense_id } = req.params;
            const result: Expense | null = await ExpenseModel.findOne(
                {
                    _id: expense_id,
                    user_id: req.user?._id
                });
            res.json({ success: true, data: result });

        } catch (err) {
            next(err);
        }
    };

export const post_expense: RequestHandler<unknown, StandardResponse<Expense>, Expense, unknown> =
    async (req, res, next) => {
        try {
            const results = await ExpenseModel.create({
                ...req.body,
                user_id: req.user?._id,
                expenseEmbedding: req.body.expenseEmbedding
            });
            res.json({ success: true, data: results });
        } catch (err) {
            next(err);
        }
    };

export const put_expense: RequestHandler<{ expense_id: string; }, StandardResponse<number>, Partial<Expense>, unknown> = async (req, res, next) => {
    try {
        const { expense_id } = req.params;
        const results = await ExpenseModel.updateOne(
            {
                _id: expense_id,
                user_id: req.user?._id
            },
            { $set: req.body }
        );
        res.status(200).json({ success: true, data: results.modifiedCount });
    } catch (err) {
        next(err);
    }
};

export const delete_expense: RequestHandler<{ expense_id: string; }, StandardResponse<number>> = async (req, res, next) => {
    try {
        const { expense_id } = req.params;
        const results = await ExpenseModel.deleteOne(
            {
                _id: expense_id,
                user_id: req.user?._id
            });
        res.status(200).json({ success: true, data: results.deletedCount });
    } catch (err) {
        next(err);
    }
};

export const getAllandgenerateEmbedding: RequestHandler = async (req, res, next) => {
    try {
        const results: Expense[] = await ExpenseModel.aggregate([
            {
                $match: {
                    expenseEmbedding: { $exists: false }
                }
            },
            {
                $project: {
                    _id: 0,
                    expense_id: '$_id',
                    title: 1,
                    category: 1,
                    date: 1,
                    amount: 1
                }
            }
        ]);
        let i = 0;
        for (const expense of results) {
            const expenseEmbedding = await generateEmbedding(JSON.stringify(expense));
            await ExpenseModel.updateOne(
                { _id: expense.expense_id },
                {
                    $set: { expenseEmbedding: expenseEmbedding }
                });
        }

    } catch (error) {
        next(error);
    }

};


export const get_expenseSummary: RequestHandler<unknown, StandardResponse<ExpenseSummary[]>, unknown, { year: string; month: string; }>
    = async (req, res, next) => {
        try {

            const year = +req.query.year || new Date().getFullYear();
            const month = +req.query.month || new Date().getMonth() + 1;

            const startOfMonth = new Date(year, month - 1, 1);
            const endOfMonth = new Date(year, month, 1);

            const expensesSummary: ExpenseSummary[] = await ExpenseModel.aggregate([
                {
                    $match: {
                        user_id: req.user?._id,
                        date: { $gte: startOfMonth, $lt: endOfMonth }
                    }
                },
                {
                    $group: {
                        _id: '$category',
                        totalAmount: { $sum: '$amount' }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        category: '$_id',
                        totalAmount: 1
                    }
                },
                {
                    $sort: {
                        totalAmount: -1
                    }
                }]);

            res.status(200).json({ success: true, data: expensesSummary });
        } catch (error) {
            next(error);
        }
    };
