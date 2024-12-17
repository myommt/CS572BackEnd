import { RequestHandler } from "express";
import { ErrorWithStatus, StandardResponse } from "../utils/common";
import { User, UserModel } from "./users.model";
import { compare, hash } from 'bcrypt';
import { sign } from "jsonwebtoken";
import { UpdateWriteOpResult } from "mongoose";


export const signin: RequestHandler<unknown, StandardResponse<{ token: string; }>, User, unknown> = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await UserModel.findOne({ email });

        if (!user) throw new ErrorWithStatus('User not found', 404);

        if (!password) throw new ErrorWithStatus('password not found', 404);
        const match = await compare(password, user.password);
        if (!match) throw new ErrorWithStatus('Passwords do not match', 401);
        if (!process.env.SECRET) throw new ErrorWithStatus('Secret not found', 404);
        const token = sign({
            _id: user.id,
            fullname: user.fullname,
            email: user.email
        }, process.env.SECRET);

        res.status(200).json({ success: true, data: { token } });

    } catch (error) {
        next(error);
    }
};


export const signup: RequestHandler<unknown, StandardResponse<string>, User, unknown> = async (req, res, next) => {
    try {

        const new_user = req.body;
        if (!new_user.password) throw new Error('Password in required');

        const hashed_password = await hash(new_user.password, 10);
        const results = await UserModel.create({ ...req.body, password: hashed_password });

        res.status(201).json({ success: true, data: results._id.toString() });

    } catch (error) {
        next(error);
    }
};


export const upload_picture: RequestHandler<unknown, StandardResponse<UpdateWriteOpResult>> = async (req, res, next) => {
    try {

        const results: UpdateWriteOpResult = await UserModel.updateOne(
            { _id: req.user?._id },
            { $set: { picture_url: req.file?.path } });
        res.json({ success: true, data: results });
    } catch (e) {
        next(e);
    }
};