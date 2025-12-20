import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./ChatWidget.css";

const ChatWidget = ({ baseUrl, userType = "customer", context = {} }) => {
    const [open, setOpen] = useState(false);
    const [conversationId, setConversationId] = useState(null);
    const [typing, setTyping] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([
        {
            role: "kuddus",
            text: "Hi! I’m Kuddus 😄 Hungry or just browsing?",
        },
    ]);

    const endRef = useRef(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, typing, open]);

    const send = async () => {
        const text = input.trim();
        if (!text) return;

        setMessages((prev) => [...prev, { role: "user", text }]);
        setInput("");
        setTyping(true);

        try {
            const res = await axios.post(`${baseUrl}/api/chat/kuddus`, {
                message: text,
                userType,
                conversationId,
                context,
            });

            const reply = res.data?.reply || "Oops 😅";
            const cid = res.data?.conversationId || conversationId;

            setConversationId(cid);
            setMessages((prev) => [...prev, { role: "kuddus", text: reply }]);
        } catch (e) {
            setMessages((prev) => [
                ...prev,
                { role: "kuddus", text: "Network hiccup 😵 Please try again." },
            ]);
        } finally {
            setTyping(false);
        }
    };

    return (
        <>
            <button className="kuddus-fab" onClick={() => setOpen((v) => !v)}>
                <span className="kuddus-fab-icon">💬</span>
            </button>

            {open && (
                <div className="kuddus-panel">
                    <div className="kuddus-header">
                        <div className="kuddus-avatar">😄</div>
                        <div>
                            <div className="kuddus-title">Kuddus</div>
                            <div className="kuddus-subtitle">
                                {userType === "admin" ? "Admin Helper" : "Food Buddy"}
                            </div>
                        </div>
                        <button className="kuddus-close" onClick={() => setOpen(false)}>
                            ✕
                        </button>
                    </div>

                    <div className="kuddus-messages">
                        {messages.map((m, idx) => (
                            <div
                                key={idx}
                                className={
                                    m.role === "user" ? "bubble bubble-user" : "bubble bubble-bot"
                                }
                            >
                                {m.text}
                            </div>
                        ))}

                        {typing && <div className="bubble bubble-bot">Typing…</div>}
                        <div ref={endRef} />
                    </div>

                    <div className="kuddus-inputbar">
                        <input
                            className="kuddus-input"
                            value={input}
                            placeholder="Ask Kuddus…"
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => (e.key === "Enter" ? send() : null)}
                        />
                        <button className="kuddus-send" onClick={send}>
                            Send
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatWidget;
