"use client";

import { Bot, Headset, MessageCircle, Send, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "@/styles/ChatWidget.module.css";

/* Два незалежні канали віджета:
   - «Помічник» — Gemini, логується в chat_logs ( append-only аудит );
   - «Команда» — людський діалог у chat_threads, який бачить /admin/chat.

   Ключ діалогу — threadId (crypto.randomUUID() у localStorage), а не
   sessionId із useRef: останній змінювався на F5, тому відповідь оператора
   губилася. Історія тепер відновлюється з /api/chat/history. */

type Role = "user" | "assistant" | "operator";
type ChatMode = "ai" | "admin";

interface Message {
  id: string;
  role: Role;
  content: string;
  adminName?: string;
}

interface HistoryMessage {
  id?: string;
  role?: string;
  content?: string;
  author?: string;
  adminName?: string;
  channel?: string;
  createdAt?: string;
}

const POLL_INTERVAL = 10_000;
const THREAD_KEY = "giraffe_chat_thread_id";
const DEVICE_KEY = "giraffe_chat_device_id";

const AI_WELCOME: Message = {
  id: "welcome_ai",
  role: "assistant",
  content:
    "Привіт! Це чат виїзної команди «Жирафик». Питання про дату, адресу, програму чи обладнання — пишіть тут або залиште заявку на виїзд.",
};

const TEAM_WELCOME: Message = {
  id: "welcome_team",
  role: "assistant",
  content:
    "Тут можна написати команді напряму. Повідомлення збережеться — діалог не зникне навіть після перезавантаження сторінки. Відповідь з'явиться в цьому вікні.",
};

function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id =
      "dev_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 8);
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

/** Високоентропійний UUID — водночас ідентифікатор і capability для
 *  публічного читання історії / відповідей. */
function getThreadId(): string {
  let id = localStorage.getItem(THREAD_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `thr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(THREAD_KEY, id);
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

function toWidgetMessage(m: HistoryMessage, index: number): Message {
  const role: Role =
    m.role === "operator"
      ? "operator"
      : m.role === "client"
        ? "user"
        : "assistant";
  return {
    id: m.id || `hist_${index}_${m.createdAt || ""}`,
    role,
    content: m.content ?? "",
    adminName: m.adminName || m.author,
  };
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>("ai");
  const [aiMessages, setAiMessages] = useState<Message[]>([AI_WELCOME]);
  const [teamMessages, setTeamMessages] = useState<Message[]>([TEAM_WELCOME]);
  const [unreadTeam, setUnreadTeam] = useState(0);
  const [input, setInput] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [threadReady, setThreadReady] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const threadIdRef = useRef<string>("");
  const sessionIdRef = useRef<string>("");
  const seenOperatorIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    threadIdRef.current = getThreadId();
    sessionIdRef.current =
      "ses_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 8);
    setThreadReady(true);
  }, []);

  const visibleMessages = chatMode === "ai" ? aiMessages : teamMessages;

  // Скролимо лише контейнер стрічки, а не сторінку: scrollIntoView у
  // position:fixed віджеті прокручував би весь сайт за спиною чату.
  useEffect(() => {
    if (!isOpen || !visibleMessages.length) return;
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [isOpen, visibleMessages]);

  // Відновлення історії після F5 / нової вкладки.
  useEffect(() => {
    if (!threadReady) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/chat/history?threadId=${encodeURIComponent(threadIdRef.current)}&deviceId=${encodeURIComponent(getDeviceId())}`,
          { cache: "no-store" },
        );
        if (!res.ok) return;
        const data = (await res.json()) as { messages?: HistoryMessage[] };
        if (cancelled || !Array.isArray(data.messages)) return;
        const restored = data.messages.map(toWidgetMessage);
        for (const m of restored) {
          if (m.role === "operator") seenOperatorIds.current.add(m.id);
        }
        if (restored.length > 0) {
          setTeamMessages([TEAM_WELCOME, ...restored]);
        }
      } catch {
        // тихо: welcome-повідомлення лишається, діалог можна почати наново
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [threadReady]);

  /** Відповіді оператора. Dedupe за стабільним id — сервер може повторити
   *  видачу після ретраю, а ми не хочемо дублів у стрічці. */
  const pollForOperatorMessages = useCallback(async () => {
    if (!threadIdRef.current) return;
    try {
      const res = await fetch(
        `/api/chat/poll?threadId=${encodeURIComponent(threadIdRef.current)}&deviceId=${encodeURIComponent(getDeviceId())}`,
        { cache: "no-store" },
      );
      if (!res.ok) return;
      const data = (await res.json()) as { messages?: HistoryMessage[] };
      if (!Array.isArray(data.messages) || data.messages.length === 0) return;

      const fresh = data.messages.filter(
        (m) => !(m.id && seenOperatorIds.current.has(m.id)),
      );
      if (fresh.length === 0) return;
      for (const m of fresh) {
        if (m.id) seenOperatorIds.current.add(m.id);
      }
      const incoming: Message[] = fresh.map((m, i) => ({
        id: m.id || `op_${Date.now()}_${i}`,
        role: "operator",
        content: m.content ?? "",
        adminName: m.adminName || m.author,
      }));
      setTeamMessages((prev) => [...prev, ...incoming]);
      setUnreadTeam((prev) => prev + incoming.length);
    } catch {
      // тихо: наступний цикл опитування повторить спробу
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        void pollForOperatorMessages();
      }
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [pollForOperatorMessages]);

  // Миттєва перевірка при відкритті / поверненні на вкладку.
  useEffect(() => {
    if (isOpen) void pollForOperatorMessages();
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void pollForOperatorMessages();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [isOpen, pollForOperatorMessages]);

  // Коли користувач дивиться діалог із командою — вважаємо його прочитаним.
  // biome-ignore lint/correctness/useExhaustiveDependencies: скидаємо бейдж і при нових повідомленнях у відкритій стрічці
  useEffect(() => {
    if (isOpen && chatMode === "admin") setUnreadTeam(0);
  }, [isOpen, chatMode, teamMessages.length]);

  const handleModeSwitch = (mode: ChatMode) => {
    setChatMode(mode);
    if (mode === "admin") setUnreadTeam(0);
  };

  const sendToAI = async (history: Message[]) => {
    try {
      const body = {
        messages: history.map((m) => ({
          role: m.role === "operator" ? "assistant" : m.role,
          content: m.content,
        })),
        deviceId: getDeviceId(),
        deviceInfo: getDeviceInfo(),
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
      const aiMsgId = `ai_${Date.now().toString()}`;

      setAiMessages((prev) => [
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
                aiText += JSON.parse(trimmed.slice(2));
              } catch {}
            }
          }
          setAiMessages((prev) =>
            prev.map((m) => (m.id === aiMsgId ? { ...m, content: aiText } : m)),
          );
        }
      }
    } catch {
      setAiMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now().toString()}`,
          role: "assistant",
          content:
            "Виникла помилка. Спробуйте пізніше або зателефонуйте: +38 (096) 187 85 79",
        },
      ]);
    }
  };

  const sendToAdmin = async (userMsg: Message) => {
    try {
      const res = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: threadIdRef.current,
          deviceId: getDeviceId(),
          deviceInfo: getDeviceInfo(),
          text: userMsg.content,
          website: honeypot,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!res.ok) {
        throw new Error(data?.error || "Не вдалося відправити повідомлення.");
      }
      // Повідомлення вже додане в стрічку оптимістично.
    } catch (error) {
      setTeamMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now().toString()}`,
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "Не вдалося відправити повідомлення. Спробуйте пізніше.",
        },
      ]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: `me_${Date.now().toString()}`,
      role: "user",
      content: text,
    };
    setInput("");
    setIsLoading(true);

    if (chatMode === "ai") {
      const history = [...aiMessages, userMsg];
      setAiMessages(history);
      await sendToAI(history);
    } else {
      setTeamMessages((prev) => [...prev, userMsg]);
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
              aria-label={
                unreadTeam > 0 && chatMode === "ai"
                  ? `Команда, нових відповідей: ${unreadTeam}`
                  : undefined
              }
              onClick={() => handleModeSwitch("admin")}
            >
              <Headset size={16} />
              <span>Команда</span>
              {unreadTeam > 0 && chatMode === "ai" && (
                <span className={styles.unreadBadge} aria-hidden="true">
                  {unreadTeam}
                </span>
              )}
            </button>
          </div>

          <div className={styles.messagesContainer} ref={messagesRef}>
            {visibleMessages.map((m) => (
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
              visibleMessages[visibleMessages.length - 1]?.role !==
                "assistant" && (
                <div className={styles.loadingIndicator}>
                  <div className={styles.dot} />
                  <div className={styles.dot} />
                  <div className={styles.dot} />
                </div>
              )}
          </div>

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
            <input
              className={styles.honeypot}
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
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
          aria-label={
            unreadTeam > 0
              ? `Відкрити чат, нових відповідей: ${unreadTeam}`
              : "Відкрити чат"
          }
        >
          <MessageCircle className={styles.chatIcon} />
          {unreadTeam > 0 && (
            <span className={styles.chatBadge} aria-hidden="true">
              {unreadTeam}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
