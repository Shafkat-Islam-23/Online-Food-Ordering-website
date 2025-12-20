import express from "express";
import rateLimit from "express-rate-limit";
import { kuddusChat } from "../controllers/chatController.js";

const router = express.Router();


const windowMs = Number(process.env.CHAT_RATE_LIMIT_WINDOW_MS || 60_000);
const max = Number(process.env.CHAT_RATE_LIMIT_MAX || 20);

const chatLimiter = rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { reply: "Too many messages. Please wait a bit and try again." },
});

router.post("/kuddus", chatLimiter, kuddusChat);

export default router;
