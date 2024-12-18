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
            email: user.email,
            picture_url: user.picture_url

        }, process.env.SECRET);

        res.status(200).json({ success: true, data: { token } });

    } catch (error) {
        next(error);
    }
};


export const signup: RequestHandler<unknown, StandardResponse<string>, User, unknown> = async (req, res, next) => {
    try {

        const new_user: User = req.body;
        console.log(new_user);
        //console.log(new_user.email + "just received from front end");
        if (!new_user.password) {
            throw new Error('Password is required');
        }
        console.log(new_user);
        const hashed_password = await hash(new_user.password, 10);
        const results = await UserModel.create(
            {
                ...req.body,
                password: hashed_password,
                picture_url: req.file?.path
            });

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

export const changePassword: RequestHandler<unknown, StandardResponse<string>, { oldPassword: string, newPassword: string; }, unknown> = async (req, res, next) => {
    try {
        const userId = req.user?._id;
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            throw new ErrorWithStatus('Both old and new passwords are required', 400);
        }

        const user = await UserModel.findById(userId);

        if (!user) throw new ErrorWithStatus('User not found', 404);

        const isMatch = await compare(oldPassword, user.password);

        if (!isMatch) throw new ErrorWithStatus('Old password is incorrect', 401);

        const hashedNewPassword = await hash(newPassword, 10);

        const result: User | null = await UserModel.findOneAndUpdate(
            { _id: userId },
            { $set: { password: hashedNewPassword } },
            { new: true });
        if (result) {
            res.status(200).json({ success: true, data: 'Password changed successfully' });
        }
        else {
            throw new ErrorWithStatus('Password changed unsuccessfully', 401);
        }
    } catch (error) {
        console.log(error);
        next(error);
    }
};
