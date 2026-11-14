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
/** Що клієнт уже писав команді — тоді poll працює і після F5,
 *  навіть із закритим віджетом (щоб не загубити відповідь). */
const AWAITING_KEY = "giraffe_chat_awaiting";
/** Необов'язкові контакти: адмін бачить, кому відповідає, і може
 *  продовжити діалог поза сайтом (зокрема — з Telegram). */
const NAME_KEY = "giraffe_chat_client_name";
const PHONE_KEY = "giraffe_chat_client_phone";
const CONTACT_ASKED_KEY = "giraffe_chat_contact_asked";

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
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  /** Показуємо форму контактів один раз — перед першим повідомленням
   *  у режимі «Команда», якщо користувач уже не заповнював її раніше. */
  const [showContactForm, setShowContactForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [threadReady, setThreadReady] = useState(false);
  /** Тост «Команда відповіла»: текст останньої відповіді, якщо вона
   *  прийшла, коли клієнт не дивиться стрічку діалогу. */
  const [replyToast, setReplyToast] = useState<string | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const threadIdRef = useRef<string>("");
  const sessionIdRef = useRef<string>("");
  const seenOperatorIds = useRef<Set<string>>(new Set());
  /** Історію тягнемо один раз — при першому відкритті віджета. */
  const historyLoadedRef = useRef(false);
  /** Клієнт чекає відповіді: надіслав повідомлення або в стрічці є
   *  його повідомлення. Тоді poll продовжується навіть із закритим віджетом,
   *  щоб бейдж упіймав відповідь. */
  const awaitingReplyRef = useRef(false);
  /** Чи дивиться клієнт зараз стрічку «Команда» — для рішення
   *  показувати тост/звук чи ні (у poll є лише замикання на рефи). */
  const readingTeamRef = useRef(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    threadIdRef.current = getThreadId();
    sessionIdRef.current =
      "ses_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 8);
    awaitingReplyRef.current = localStorage.getItem(AWAITING_KEY) === "1";
    setClientName(localStorage.getItem(NAME_KEY) ?? "");
    setClientPhone(localStorage.getItem(PHONE_KEY) ?? "");
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

  // Відновлення історії при ПЕРШОМУ ВІДКРИТТІ віджета, а не при монтуванні:
  // закритий віджет змонтований на всіх сторінках, і постійний fetch history
  // на кожен перегляд — зайві інвокації serverless. Після F5 історія
  // відновиться, щойно користувач відкриє чат.
  useEffect(() => {
    if (!threadReady || !isOpen || historyLoadedRef.current) return;
    historyLoadedRef.current = true;
    (async () => {
      try {
        const res = await fetch(
          `/api/chat/history?threadId=${encodeURIComponent(threadIdRef.current)}&deviceId=${encodeURIComponent(getDeviceId())}`,
          { cache: "no-store" },
        );
        if (!res.ok) return;
        const data = (await res.json()) as { messages?: HistoryMessage[] };
        if (!Array.isArray(data.messages)) return;
        const restored = data.messages.map(toWidgetMessage);
        for (const m of restored) {
          if (m.role === "operator") seenOperatorIds.current.add(m.id);
        }
        if (restored.some((m) => m.role === "user")) {
          awaitingReplyRef.current = true;
        }
        if (restored.length > 0) {
          setTeamMessages([TEAM_WELCOME, ...restored]);
        }
      } catch {
        // тихо: welcome-повідомлення лишається, діалог можна почати наново
      }
    })();
  }, [threadReady, isOpen]);

  /** Сповіщення про відповідь: короткий звук (Web Audio, без файлів)
   *  + тост із прев'ю, якщо клієнт не дивиться стрічку. */
  const notifyReply = useCallback((preview: string) => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
      osc.onended = () => void ctx.close();
    } catch {
      // без звуку — не критично
    }

    setReplyToast(preview.slice(0, 140));
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setReplyToast(null), 8000);
  }, []);

  useEffect(
    () => () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    },
    [],
  );

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
      // Якщо клієнт не дивиться стрічку команди — сповіщаємо (звук + тост).
      // У стрічці нове видно одразу, там сповіщення було б зайвим.
      if (!readingTeamRef.current) {
        const last = incoming[incoming.length - 1];
        notifyReply(last?.content ?? "");
      }
    } catch {
      // тихо: наступний цикл опитування повторить спробу
    }
  }, [notifyReply]);

  useEffect(() => {
    // Опитування тільки коли віджет відкритий або клієнт реально чекає
    // відповіді (надіслав повідомлення / у стрічці є його повідомлення).
    // Закритий віджет без діалогу не має бити в serverless кожні 10 с.
    if (!isOpen && !awaitingReplyRef.current) return;
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        void pollForOperatorMessages();
      }
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [isOpen, pollForOperatorMessages]);

  // Миттєва перевірка при відкритті / поверненні на вкладку — тільки якщо
  // є що опитувати (віджет відкритий або клієнт чекає відповіді).
  useEffect(() => {
    if (!isOpen && !awaitingReplyRef.current) return;
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

  // Для poll (він у useCallback з порожніми залежностями) тримаємо рефом
  // факт «клієнт зараз читає стрічку команди».
  useEffect(() => {
    readingTeamRef.current = isOpen && chatMode === "admin";
  }, [isOpen, chatMode]);

  /** Клік по тосту: відкрити чат одразу в режимі «Команда». */
  const openTeamFromToast = () => {
    setReplyToast(null);
    setChatMode("admin");
    setIsOpen(true);
    setUnreadTeam(0);
  };

  const handleModeSwitch = (mode: ChatMode) => {
    setChatMode(mode);
    if (mode === "admin") {
      setUnreadTeam(0);
      // Один раз запропонувати залишити контакти — перед першим
      // повідомленням команді, якщо користувач це вже не робив.
      if (localStorage.getItem(CONTACT_ASKED_KEY) !== "1") {
        setShowContactForm(true);
      }
    }
  };

  /** Зберегти контакти й заховати форму. Поля необов'язкові — можна
   *  просто закрити, діалог лишиться анонімним. */
  const saveContacts = () => {
    const name = clientName.trim().slice(0, 60);
    const phone = clientPhone.trim().slice(0, 30);
    if (name) localStorage.setItem(NAME_KEY, name);
    if (phone) localStorage.setItem(PHONE_KEY, phone);
    localStorage.setItem(CONTACT_ASKED_KEY, "1");
    setShowContactForm(false);
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
          clientName: clientName.trim().slice(0, 60) || undefined,
          clientPhone: clientPhone.trim().slice(0, 30) || undefined,
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
      awaitingReplyRef.current = true;
      localStorage.setItem(AWAITING_KEY, "1");
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

          {showContactForm && chatMode === "admin" && (
            <fieldset className={styles.contactForm}>
              <legend className={styles.contactLegend}>
                Щоб ми могли відповісти поза сайтом — залиште контакти.
                <span>Необов'язково.</span>
              </legend>
              <div className={styles.contactFields}>
                <input
                  className={styles.contactInput}
                  value={clientName}
                  placeholder="Ваше ім'я"
                  maxLength={60}
                  autoComplete="name"
                  onChange={(e) => setClientName(e.target.value)}
                />
                <input
                  className={styles.contactInput}
                  value={clientPhone}
                  placeholder="Телефон"
                  maxLength={30}
                  autoComplete="tel"
                  inputMode="tel"
                  onChange={(e) => setClientPhone(e.target.value)}
                />
              </div>
              <div className={styles.contactActions}>
                <button
                  type="button"
                  className={styles.contactSkip}
                  onClick={() => {
                    localStorage.setItem(CONTACT_ASKED_KEY, "1");
                    setShowContactForm(false);
                  }}
                >
                  Пропустити
                </button>
                <button
                  type="button"
                  className={styles.contactSave}
                  onClick={saveContacts}
                >
                  Зберегти
                </button>
              </div>
            </fieldset>
          )}

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

      {replyToast && (
        <button
          type="button"
          className={styles.replyToast}
          onClick={openTeamFromToast}
          aria-live="polite"
        >
          <span className={styles.toastTitle}>
            <Headset size={14} />
            Команда відповіла
          </span>
          <span className={styles.toastPreview}>{replyToast}</span>
        </button>
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
