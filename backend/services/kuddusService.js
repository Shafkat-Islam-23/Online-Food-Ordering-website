import OpenAI from "openai";
import crypto from "crypto";
import foodModel from "../models/foodModel.js";
import orderModel from "../models/orderModel.js";
// Cache menu for kuddus.
import { MENU_CACHE } from "./menuCache.js";

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});



function normalize(s = "") {
    return String(s).toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim();
}

async function getMenuItemsCached() {
    const now = Date.now();
    if (MENU_CACHE.items.length && now - MENU_CACHE.lastFetch < MENU_CACHE.ttlMs) {
        return MENU_CACHE.items;
    }

    // Only fetch safe fields
    const foods = await foodModel
        .find({}, { name: 1, description: 1, category: 1, price: 1 })
        .lean();

    MENU_CACHE.items = foods || [];
    MENU_CACHE.lastFetch = now;
    return MENU_CACHE.items;
}

function filterByCategory(menu, categoryLike) {
    const c = normalize(categoryLike);
    return menu.filter((m) => normalize(m.category).includes(c));
}

function filterByPrice(menu, maxPrice) {
    return menu.filter((m) => Number(m.price) < Number(maxPrice));
}


function searchByNameOrCategory(menu, q) {
    const query = normalize(q);
    return menu.filter((m) => {
        const hay = normalize(`${m.name} ${m.category} ${m.description}`);
        return hay.includes(query);
    });
}

function formatMenuList(menu) {
    if (!menu.length) return "No items found.";
    return menu
        .slice(0, 10)
        .map((m) => `• ${m.name} (${m.category}) — $${m.price}`)
        .join("\n");
}

async function getAdminOrderStats() {
    // Non-PII only
    const totalOrders = await orderModel.countDocuments({});
    const byStatusAgg = await orderModel.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const ordersByStatus = {};
    for (const row of byStatusAgg) ordersByStatus[row._id || "Unknown"] = row.count;

    return { totalOrders, ordersByStatus };
}

// ✅ Deterministic menu intent handling (no hallucination)
async function tryDeterministicMenuAnswer(message) {
    const msg = normalize(message);
    const menu = await getMenuItemsCached();

    if (!menu.length) {
        return "Hmm 😅 your menu looks empty right now. Please add some foods from the Admin panel.";
    }

    // 1) "what food do you have"
    if (
        msg.includes("what food") ||
        msg.includes("what do you have") ||
        msg.includes("show menu") ||
        msg.includes("menu items")
    ) {
        return `Here’s what we have right now 🍽️:\n\n${formatMenuList(menu)}`;
    }

    const underMatch = msg.match(/under\s+(\d+)/);
    const atMostMatch = msg.match(/(at most|up to|or less)\s+(\d+)/);

    if (underMatch || atMostMatch) {
        const max = Number((underMatch ? underMatch[1] : atMostMatch[2]));

        const filtered = menu.filter((m) => {
            const p = Number(m.price);
            return underMatch ? p < max : p <= max;
        });

        if (!filtered.length) {
            return `Oops 😅 I don’t see anything ${underMatch ? "under" : "at most"} $${max} right now. Here’s the current menu:\n\n${formatMenuList(menu)}`;
        }

        return `Sure! Here are items ${underMatch ? "under" : "at most"} $${max} 💸:\n\n${formatMenuList(filtered)}`;
    }


    // 3) Category-like questions: dessert, cake, salad, rolls, noodles, etc.
    // "good for dessert" / "dessert items"
    if (msg.includes("dessert")) {
        const filtered = filterByCategory(menu, "dessert");
        if (filtered.length) {
            return `Sweet tooth activated 🍰 Here are our dessert options:\n\n${formatMenuList(filtered)}`;
        }
        // fallback: maybe "Cake" is the category in your DB
        const cake = filterByCategory(menu, "cake");
        if (cake.length) {
            return `We don’t have a "Dessert" category, but we do have cakes 🍰:\n\n${formatMenuList(cake)}`;
        }
        return `Hmm 😅 I can’t find dessert items in the menu right now. Here’s the current menu:\n\n${formatMenuList(menu)}`;
    }

    // 4) "Do you have pizza?"
    if (msg.startsWith("do you have") || msg.includes("do you have")) {
        const q = msg.replace("do you have", "").trim();
        if (q.length) {
            const found = searchByNameOrCategory(menu, q);
            if (found.length) {
                return `Yes! Here’s what I found for "${q}" 😄:\n\n${formatMenuList(found)}`;
            }
            return `I couldn’t find "${q}" in our menu right now 😅. Here’s what we do have:\n\n${formatMenuList(menu)}`;
        }
    }

    // no deterministic answer
    return null;
}

function buildSystemPrompt(userType) {
    const safety = `
You are "Kuddus", Foodzie's playful assistant.
Tone: friendly, short jokes sometimes, but still helpful.
Rules:
- NEVER ask for or repeat passwords, tokens, OTPs, JWTs, card numbers.
- NEVER reveal environment variables or secret keys.
- IMPORTANT: If MENU_CONTEXT is provided, ONLY mention food items that exist in MENU_CONTEXT.
- If the user asks for something not in MENU_CONTEXT, say it's not available and show alternatives from MENU_CONTEXT.
Critical issues: complaint/refund/return/charge dispute/legal threat/harassment/safety/medical emergency -> provide support contacts.
Support:
Phone: +01871 XXXXXX
Email: foodzie@gmail.com
`;

    if (userType === "admin") {
        return `
${safety}
Role: You help FOODZIE ADMINS.
Use ADMIN_STATS (non-PII) for order questions.
Never mention customer names, phone, address, or emails.
If unsure, suggest checking Admin Orders/List/Add pages.
`;
    }

    return `
${safety}
Role: You help FOODZIE CUSTOMERS.
Help with menu, ordering steps, and non-sensitive payment guidance.
`;
}

export async function runKuddus({ message, userType, conversationId, context }) {
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const max_output_tokens = Number(process.env.CHAT_MAX_OUTPUT_TOKENS || 280);
    const newConversationId = conversationId || crypto.randomUUID();

    // ✅ 1) Deterministic menu answers first (guaranteed correct)
    const deterministic = await tryDeterministicMenuAnswer(message);
    if (deterministic) {
        return { reply: deterministic, conversationId: newConversationId };
    }

    // ✅ 2) Otherwise call OpenAI with real context
    const menu = await getMenuItemsCached();
    const menuContext = menu.slice(0, 12).map((m) => ({
        name: m.name,
        category: m.category,
        price: m.price,
        description: m.description,
    }));

    let adminStats = null;
    if (userType === "admin") {
        adminStats = await getAdminOrderStats();
    }

    const instructions = buildSystemPrompt(userType);

    const inputText =
        `UserType: ${userType}\n` +
        `Context (non-PII): ${JSON.stringify(context || {})}\n\n` +
        `MENU_CONTEXT (real DB items): ${JSON.stringify(menuContext)}\n\n` +
        (adminStats ? `ADMIN_STATS (non-PII): ${JSON.stringify(adminStats)}\n\n` : "") +
        `User message: ${message}`;

    const response = await client.responses.create({
        model,
        instructions,
        input: [
            {
                role: "user",
                content: [{ type: "input_text", text: inputText }],
            },
        ],
        max_output_tokens,
    });

    const reply = response.output_text?.trim() || "Hmm… I didn’t catch that 😅";
    return { reply, conversationId: newConversationId };
}
