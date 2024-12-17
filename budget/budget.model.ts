import { Schema, model, InferSchemaType, pluralize } from 'mongoose';

pluralize(null);

const budgetSchema = new Schema({
    user_id: Schema.Types.ObjectId,
    title: String,
    category: String,
    date: Date,
    amount: Number,
    budgetEmbedding: [Number]
}, {
    timestamps: true
});

export type budget = {
    budget_id: string;
    user_id: string,
    title: string,
    description: string,
    date: Date,
    amount: number;
    budgetEmbedding: number[];
};

export const budgetModel = model<budget>('budget', budgetSchema);
