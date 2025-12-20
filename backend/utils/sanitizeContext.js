export function sanitizeUserMessage(message, maxChars = 800) {
    let text = String(message || "").trim();

    // Hard cap length for cost + safety
    if (text.length > maxChars) text = text.slice(0, maxChars);

    text = text.replace(/\b\d{12,19}\b/g, "[REDACTED_NUMBER]"); // possible card-like number
    text = text.replace(/bearer\s+[a-z0-9\-\._]+/gi, "bearer [REDACTED_TOKEN]");
    text = text.replace(/jwt\s+[a-z0-9\-\._]+/gi, "jwt [REDACTED_TOKEN]");
    text = text.replace(/otp\s*[:=]?\s*\d{4,8}/gi, "otp: [REDACTED]");

    return text;
}
