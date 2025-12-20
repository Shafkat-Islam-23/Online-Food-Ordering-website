export function detectCriticalIssue(text) {
    const t = String(text || "").toLowerCase();

    // Keep it simple and conservative (better to route to support if uncertain)
    const keywords = [
        "complaint",
        "refund",
        "return",
        "charge dispute",
        "dispute",
        "chargeback",
        "legal",
        "lawsuit",
        "sue",
        "harassment",
        "threat",
        "unsafe",
        "safety",
        "medical",
        "emergency",
        "police",
        "scam",
        "fraud",
    ];

    return keywords.some((k) => t.includes(k));
}
