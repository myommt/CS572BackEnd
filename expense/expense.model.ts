import { Schema, model, InferSchemaType, pluralize } from 'mongoose';

pluralize(null);

const expenseSchema = new Schema({
    user_id: Schema.Types.ObjectId,
    title: String,
    category: String,
    date: Date,
    amount: Number,
    expenseEmbedding: [Number]
}, {
    timestamps: true
});

export type Expense = {
    expense_id: string,
    user_id: string,
    title: string,
    category: string,
    date: Date,
    amount: number,
    expenseEmbedding: number[];

};

export const ExpenseModel = model<Expense>('expense', expenseSchema);


export type ExpenseSummary = {
    category: string;
    totalAmount: number;
};