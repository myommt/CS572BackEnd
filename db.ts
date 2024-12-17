import mongoose from "mongoose";
//import dotenv from 'dotenv';

//dotenv.config();
//const url = process.env.DB_URL

export function connect_db() {
    if (process.env.DB_URL) {
        mongoose.connect(process.env.DB_URL)
            .then(_ => console.log(`connected to local db`))
            .catch(e => console.log(`failed to connect to DB`, e));
    }
    else {
        console.log(`no DB URL`);
    }
}


