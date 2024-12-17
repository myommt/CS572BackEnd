import { Router } from "express";
import { signin, signup, upload_picture } from "./users.controller";
import { checkToken } from './users.middleware';
import multer from 'multer';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.post('/signin',signin);
router.post('/signup',signup);
router.post('/pictures', checkToken, upload.single('profile_picture'), upload_picture);
export default router;