import { runKuddus } from "../services/kuddusService.js";
import { detectCriticalIssue } from "../utils/detectCriticalIssue.js";
import { sanitizeUserMessage } from "../utils/sanitizeContext.js";

export const kuddusChat = async (req, res) => {
    try {
        const { message, userType, conversationId, context } = req.body || {};

        // 1) Basic validation
        if (typeof message !== "string" || message.trim().length === 0) {
            return res.status(400).json({ reply: "Please type a message 🙂" });
        }
        if (userType !== "customer" && userType !== "admin") {
            return res.status(400).json({ reply: "Invalid userType." });
        }

        const maxChars = Number(process.env.CHAT_MAX_INPUT_CHARS || 800);
        const safeMessage = sanitizeUserMessage(message, maxChars);

        // 2) Critical issue routing (hard stop)
        if (detectCriticalIssue(safeMessage)) {
            const reply =
                "I’m really sorry you’re dealing with that. 🙏\n\n" +
                "For urgent/critical issues (complaints, refunds/returns, charge disputes, legal/safety concerns), please contact our service team directly:\n" +
                "📞 +01871 XXXXXX\n" +
                "✉️ foodzie@gmail.com\n\n" +
                "They’ll help you as quickly as possible.";
            return res.json({ reply, conversationId: conversationId || "support" });
        }

        // 3) Sanitize context (non-PII only)
        // Keeping only a small allowed subset to avoid accidental leaks
        const safeContext = {};
        if (context && typeof context === "object") {
            const allowedKeys = [
                "cartCount",
                "cartTotal",
                "orderId",
                "orderStatus",
                "page",            
                "selectedCategory"
            ];

            for (const k of allowedKeys) {
                if (k in context) safeContext[k] = context[k];
            }
        }

        // 4) Ask the model
        const result = await runKuddus({
            message: safeMessage,
            userType,
            conversationId,
            context: safeContext,
        });

        return res.json(result);
    } catch (err) {
        console.error("Kuddus error:", err?.message || err);
        return res.status(500).json({
            reply: "Oops 😅 Kuddus got confused. Please try again in a moment.",
        });
    }
};
