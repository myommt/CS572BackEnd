import path from 'node:path';
import express, { json } from 'express';
import cors from 'cors';
import morgan from 'morgan';

import userRoutes from './users/users.router';
import budgetRoutes from './budget/budget.router';
import { routerNotFoundHandler, errorHandler } from './utils/common';
import { connect_db } from './db';
import expenseRoutes from './expense/expense.router';
import { combinedVectorAndAnalysis } from './utils/ai';
import { checkToken } from './users/users.middleware';


const app = express();
connect_db();

app.use(morgan('dev'));
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(json());

app.use('/users', userRoutes);
app.use('/budgets', budgetRoutes);

app.use('/expenses', expenseRoutes);

app.get('/openaianalyses', checkToken, combinedVectorAndAnalysis);

app.use(routerNotFoundHandler);
app.use(errorHandler);

app.listen(3000, () => console.log('listening on 3000'));