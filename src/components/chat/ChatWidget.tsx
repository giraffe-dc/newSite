"use client";

import { Bot, Headset, MessageCircle, Send, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "@/styles/ChatWidget.module.css";

type Role = "user" | "assistant" | "operator";
type ChatMode = "ai" | "admin";

interface Message {
  id: string;
  role: Role;
  content: string;
  adminName?: string;
}

function getDeviceId(): string {
  const key = "giraffe_chat_device_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id =
      "dev_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 8);
    localStorage.setItem(key, id);
  }
  return id;
}

function getDeviceInfo() {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    screenWidth: screen.width,
    screenHeight: screen.height,
    platform: navigator.platform || "unknown",
  };
}

const POLL_INTERVAL = 60_000;

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>("ai");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Привіт! Це чат виїзної команди «Жирафик». Питання про дату, адресу, програму чи обладнання — пишіть тут або залиште заявку на виїзд.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string>("");
  const hasInteracted = useRef(false);

  useEffect(() => {
    sessionIdRef.current =
      "ses_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 8);
  }, []);

  // Скролимо вниз і при відкритті, і при кожному новому повідомленні.
  // biome-ignore lint/correctness/useExhaustiveDependencies: messages змінює вміст чату
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, messages]);

  // Poll for operator messages
  const pollForOperatorMessages = useCallback(async () => {
    if (!hasInteracted.current || !sessionIdRef.current) return;
    try {
      const deviceId = getDeviceId();
      const res = await fetch(
        `/api/chat/poll?sessionId=${encodeURIComponent(sessionIdRef.current)}&deviceId=${encodeURIComponent(deviceId)}`,
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data.messages && data.messages.length > 0) {
        const newMsgs: Message[] = data.messages.map(
          (m: { content?: string; adminName?: string }, i: number) => ({
            id: `op_${Date.now()}_${i}`,
            role: "operator" as Role,
            content: m.content ?? "",
            adminName: m.adminName,
          }),
        );
        setMessages((prev) => [...prev, ...newMsgs]);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(pollForOperatorMessages, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [pollForOperatorMessages]);

  // Switch mode handler
  const handleModeSwitch = (mode: ChatMode) => {
    if (mode === chatMode) return;
    setChatMode(mode);
    const systemMsg: Message = {
      id: `sys_${Date.now()}`,
      role: "assistant",
      content:
        mode === "admin"
          ? "Ви переключились на зв'язок із командою. Повідомлення передано, відповідь може надійти протягом декількох хвилин."
          : "Ви повернулись до помічника. Чим можу допомогти?",
    };
    setMessages((prev) => [...prev, systemMsg]);
  };

  // Send to AI
  const sendToAI = async (userMsg: Message) => {
    try {
      const deviceId = getDeviceId();
      const deviceInfo = getDeviceInfo();
      const body = {
        messages: [...messages, userMsg].map((m) => ({
          role: m.role === "operator" ? "assistant" : m.role,
          content: m.content,
        })),
        deviceId,
        deviceInfo,
        sessionId: sessionIdRef.current,
      };

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error("Network error");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiText = "";
      const aiMsgId = (Date.now() + 1).toString();

      setMessages((prev) => [
        ...prev,
        { id: aiMsgId, role: "assistant", content: "" },
      ]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            const trimmed = line.trim();
            if (trimmed.startsWith("0:")) {
              try {
                const parsed = JSON.parse(trimmed.slice(2));
                aiText += parsed;
              } catch {}
            }
          }
          setMessages((prev) =>
            prev.map((m) => (m.id === aiMsgId ? { ...m, content: aiText } : m)),
          );
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content:
            "Виникла помилка. Спробуйте пізніше або зателефонуйте: +38 (096) 187 85 79",
        },
      ]);
    }
  };

  // Send to Admin (just save to DB)
  const sendToAdmin = async (userMsg: Message) => {
    try {
      const deviceId = getDeviceId();
      const deviceInfo = getDeviceInfo();
      const res = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          deviceId,
          deviceInfo,
          message: userMsg.content,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setMessages((prev) => [
        ...prev,
        {
          id: `wait_${Date.now()}`,
          role: "assistant",
          content: "Ваше повідомлення передано команді. Очікуйте відповідь.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Не вдалося відправити повідомлення. Спробуйте пізніше.",
        },
      ]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    hasInteracted.current = true;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    if (chatMode === "ai") {
      await sendToAI(userMsg);
    } else {
      await sendToAdmin(userMsg);
    }

    setIsLoading(false);
  };

  const getMessageStyle = (role: Role) => {
    switch (role) {
      case "user":
        return styles.userMessage;
      case "operator":
        return styles.operatorMessage;
      default:
        return styles.assistantMessage;
    }
  };

  return (
    <div className={styles.chatContainer}>
      {isOpen && (
        <div className={styles.chatWindow}>
          {/* Header */}
          <div className={styles.chatHeader}>
            <div className={styles.chatTitle}>
              {chatMode === "ai" ? <Bot size={24} /> : <Headset size={24} />}
              <span>
                {chatMode === "ai" ? "Помічник команди" : "Зв'язок із командою"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className={styles.closeButton}
              aria-label="Закрити чат"
            >
              <X size={20} />
            </button>
          </div>

          {/* Mode Toggle */}
          <div className={styles.modeToggle}>
            <button
              type="button"
              className={`${styles.modeBtn} ${chatMode === "ai" ? styles.modeBtnActive : ""}`}
              onClick={() => handleModeSwitch("ai")}
            >
              <Bot size={16} />
              <span>Помічник</span>
            </button>
            <button
              type="button"
              className={`${styles.modeBtn} ${chatMode === "admin" ? styles.modeBtnActive : ""}`}
              onClick={() => handleModeSwitch("admin")}
            >
              <Headset size={16} />
              <span>Команда</span>
            </button>
          </div>

          {/* Messages */}
          <div className={styles.messagesContainer}>
            {messages.map((m) => (
              <div
                key={m.id}
                className={`${styles.message} ${getMessageStyle(m.role)}`}
              >
                {m.role === "operator" && (
                  <div className={styles.operatorLabel}>
                    <Headset size={14} />
                    <span>{m.adminName || "Команда Жирафик"}</span>
                  </div>
                )}
                {m.content}
              </div>
            ))}
            {isLoading &&
              messages[messages.length - 1]?.role !== "assistant" && (
                <div className={styles.loadingIndicator}>
                  <div className={styles.dot} />
                  <div className={styles.dot} />
                  <div className={styles.dot} />
                </div>
              )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className={styles.inputForm}>
            <input
              className={styles.input}
              value={input}
              placeholder={
                chatMode === "ai"
                  ? "Питання про виїзд..."
                  : "Напишіть команді..."
              }
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="submit"
              className={styles.sendButton}
              disabled={isLoading || !input.trim()}
              aria-label="Відправити"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={styles.chatButton}
          aria-label="Відкрити чат"
        >
          <MessageCircle className={styles.chatIcon} />
        </button>
      )}
    </div>
  );
}
