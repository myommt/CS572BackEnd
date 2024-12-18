import { RequestHandler } from "express";
import { StandardResponse } from "../utils/common";
import { budget, budgetModel } from "./budget.model";
import mongoose, { DeleteResult, UpdateWriteOpResult } from "mongoose";

export const get_budgets: RequestHandler<unknown, StandardResponse<budget[]>, unknown, { page: string, pageSize: string; year: string; month: string; }>
    = async (req, res, next) => {
        try {
            if (!req.user?._id) { throw new Error('User ID is missing'); }
            console.log(req.user?._id);
            const page = +req.query.page || 1;
            const pageSize = +req.query.pageSize || 10;

            const year = +req.query.year || new Date().getFullYear();
            const month = +req.query.month || new Date().getMonth() + 1;

            const startOfMonth = new Date(year, month - 1, 1);
            const endOfMonth = new Date(year, month, 1);
            const results: budget[] = await budgetModel.aggregate([{
                $match: {
                    user_id: new mongoose.Types.ObjectId(req.user._id),
                    date: { $gte: startOfMonth, $lt: endOfMonth }
                }
            },
            { $sort: { date: -1 } },
            { $skip: (page - 1) * pageSize },
            { $limit: pageSize },
            {
                $project: {
                    _id: 0,
                    budget_id: '$_id',
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

export const get_budget: RequestHandler<{ budget_id: string; }, StandardResponse<budget | null>, unknown, unknown>
    = async (req, res, next) => {
        try {
            if (!req.user?._id) { throw new Error('User ID is missing'); }
            const { budget_id } = req.params;
            const result: budget | null = await budgetModel.findOne(
                {
                    _id: budget_id,
                    user_id: new mongoose.Types.ObjectId(req.user._id),
                });
            res.json({ success: true, data: result });

        } catch (err) {
            next(err);
        }
    };
export const get_budgetCount: RequestHandler<unknown, StandardResponse<number>, unknown, { year: string; month: string; }>
    = async (req, res, next) => {
        try {
            if (!req.user?._id) { throw new Error('User ID is missing'); }

            const year = +req.query.year || new Date().getFullYear();
            const month = +req.query.month || new Date().getMonth() + 1;

            const startOfMonth = new Date(year, month - 1, 1);
            const endOfMonth = new Date(year, month, 1);
            console.log(req.user?._id);
            console.log(startOfMonth);
            console.log(endOfMonth);
            const total: { _id: null, total: number; }[] = await budgetModel.aggregate([
                {
                    $match: {
                        user_id: new mongoose.Types.ObjectId(req.user._id),
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
export const post_budget: RequestHandler<unknown, StandardResponse<budget>, budget, unknown> =
    async (req, res, next) => {
        try {
            if (!req.user?._id) { throw new Error('User ID is missing'); }
            const results: budget = await budgetModel.create({
                ...req.body,
                user_id: new mongoose.Types.ObjectId(req.user._id),
            });
            res.json({ success: true, data: results });
        } catch (err) {
            next(err);
        }
    };

export const put_budget: RequestHandler<{ budget_id: string; }, StandardResponse<number>, budget, unknown> = async (req, res, next) => {
    try {
        if (!req.user?._id) { throw new Error('User ID is missing'); }

        const { budget_id } = req.params;
        const results: UpdateWriteOpResult = await budgetModel.updateOne(
            {
                _id: budget_id,
                user_id: new mongoose.Types.ObjectId(req.user._id),
            },
            { $set: req.body }
        );
        res.status(200).json({ success: true, data: results.modifiedCount });
    } catch (err) {
        next(err);
    }
};

export const delete_budget: RequestHandler<{ budget_id: string; }, StandardResponse<number>> = async (req, res, next) => {
    try {
        if (!req.user?._id) { throw new Error('User ID is missing'); }

        const { budget_id } = req.params;
        const results: DeleteResult = await budgetModel.deleteOne(
            {
                _id: budget_id,
                user_id: new mongoose.Types.ObjectId(req.user._id),
            });
        res.status(200).json({ success: true, data: results.deletedCount });
    } catch (err) {
        next(err);
    }
};