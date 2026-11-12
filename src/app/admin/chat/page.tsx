"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatChannel, ChatRole, ThreadStatus } from "@/lib/chatThreads";
import styles from "@/styles/admin/AdminChat.module.css";

const POLL_MS = 10_000;

type Filter = "all" | ThreadStatus;

interface ThreadSummary {
  threadId: string;
  deviceId: string;
  clientName?: string;
  clientPhone?: string;
  status: ThreadStatus;
  unreadForAdmin: number;
  lastMessageAt: string;
  lastMessagePreview: string;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  channel: ChatChannel;
  author?: string;
  createdAt: string;
  deliveredAt?: string;
}

interface ThreadDetail {
  threadId: string;
  deviceId: string;
  clientName?: string;
  clientPhone?: string;
  status: ThreadStatus;
  createdAt: string;
  messages: ChatMessage[];
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Усі" },
  { key: "open", label: "Відкриті" },
  { key: "closed", label: "Закриті" },
  { key: "archived", label: "Архів" },
];

const STATUS_LABELS: Record<ThreadStatus, string> = {
  open: "Відкритий",
  closed: "Закритий",
  archived: "В архіві",
};

const CHANNEL_LABELS: Record<ChatChannel, string> = {
  site: "Сайт",
  admin: "Адмінка",
  telegram: "Telegram",
};

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function threadTitle(thread: ThreadSummary | ThreadDetail): string {
  if (thread.clientName) return thread.clientName;
  return `Діалог ${thread.threadId.slice(0, 8)}`;
}

export default function AdminChatPage() {
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [filter, setFilter] = useState<Filter>("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [busyStatus, setBusyStatus] = useState(false);
  const [flash, setFlash] = useState<{
    kind: "ok" | "err";
    text: string;
  } | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const flashTimer = useRef<number | null>(null);

  const showFlash = (kind: "ok" | "err", text: string) => {
    setFlash({ kind, text });
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(null), 4000);
  };

  useEffect(
    () => () => {
      if (flashTimer.current) window.clearTimeout(flashTimer.current);
    },
    [],
  );

  const loadThreads = useCallback(
    async (silent = false) => {
      if (!silent) setLoadingList(true);
      try {
        const res = await fetch(`/api/admin/chat/threads?status=${filter}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as {
          threads: ThreadSummary[];
          unread: { threads: number; messages: number };
        };
        setThreads(data.threads);
        setUnreadTotal(data.unread.messages);
        // Сайдбар слухає цю подію — бейдж оновлюється без очікування опитування.
        window.dispatchEvent(
          new CustomEvent("giraffe:chat-unread", {
            detail: { messages: data.unread.messages },
          }),
        );
        setLoadError(false);
      } catch {
        if (!silent) setLoadError(true);
      } finally {
        if (!silent) setLoadingList(false);
      }
    },
    [filter],
  );

  const loadThread = useCallback(async (id: string, silent = false) => {
    if (!silent) setLoadingThread(true);
    try {
      const res = await fetch(
        `/api/admin/chat/threads/${encodeURIComponent(id)}`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error(String(res.status));
      setThread((await res.json()) as ThreadDetail);
    } catch {
      if (!silent) setThread(null);
    } finally {
      if (!silent) setLoadingThread(false);
    }
  }, []);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    if (!activeId) {
      setThread(null);
      return;
    }
    // GET діалогу позначає повідомлення прочитаними — після нього оновлюємо
    // лічильник у сайдбарі одразу, а не через 10 с.
    void loadThread(activeId).then(() => loadThreads(true));
  }, [activeId, loadThread, loadThreads]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void loadThreads(true);
      if (activeId) void loadThread(activeId, true);
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [activeId, loadThreads, loadThread]);

  // Прокручуємо ЛИШЕ контейнер стрічки. scrollIntoView тягнув би за собою
  // всю сторінку адмінки — зникали заголовок і фільтри.
  useEffect(() => {
    const el = messagesRef.current;
    if (!el || !thread?.messages?.length) return;
    el.scrollTop = el.scrollHeight;
  }, [thread?.messages?.length]);

  async function sendReply(event: React.FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !activeId || sending) return;
    setSending(true);
    try {
      const res = await fetch(
        `/api/admin/chat/threads/${encodeURIComponent(activeId)}/reply`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        },
      );
      const body = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!res.ok) throw new Error(body?.error ?? `Помилка ${res.status}`);
      setDraft("");
      await Promise.all([loadThread(activeId, true), loadThreads(true)]);
    } catch (error) {
      showFlash(
        "err",
        error instanceof Error
          ? error.message
          : "Не вдалося надіслати відповідь",
      );
    } finally {
      setSending(false);
    }
  }

  async function changeStatus(status: ThreadStatus) {
    if (!activeId || busyStatus) return;
    setBusyStatus(true);
    try {
      const res = await fetch(
        `/api/admin/chat/threads/${encodeURIComponent(activeId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      const body = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!res.ok) throw new Error(body?.error ?? `Помилка ${res.status}`);
      await Promise.all([loadThread(activeId, true), loadThreads(true)]);
      showFlash(
        "ok",
        status === "open" ? "Діалог знову відкрито" : "Статус оновлено",
      );
    } catch (error) {
      showFlash(
        "err",
        error instanceof Error ? error.message : "Не вдалося змінити статус",
      );
    } finally {
      setBusyStatus(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Чат із клієнтами</h1>
        <p className={styles.pageSubtitle}>
          Повідомлення з блоку «Зв'язок із командою». Відповідь одразу йде
          клієнту у віджет; нічого з бази не видаляємо — діалог можна закрити
          або відправити в архів.
        </p>
      </div>

      {flash && (
        <output
          aria-live="polite"
          className={`${styles.message} ${flash.kind === "ok" ? styles.successBox : styles.errorBox}`}
        >
          {flash.text}
        </output>
      )}

      <fieldset className={styles.filters} aria-label="Фільтр за статусом">
        <legend className={styles.srOnly}>Статус діалогу</legend>
        {FILTERS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`${styles.chip} ${filter === item.key ? styles.chipActive : ""}`}
            onClick={() => setFilter(item.key)}
          >
            {item.label}
          </button>
        ))}
        {unreadTotal > 0 && (
          <span className={styles.unreadTotal}>
            Непрочитаних: {unreadTotal}
          </span>
        )}
      </fieldset>

      <div className={`${styles.layout} ${activeId ? styles.showThread : ""}`}>
        <section className={styles.listPane} aria-label="Список діалогів">
          {loadingList ? (
            <p className={styles.hint}>Завантаження діалогів...</p>
          ) : loadError ? (
            <p className={`${styles.hint} ${styles.errorBox}`}>
              Не вдалося завантажити список. Спробуйте оновити сторінку.
            </p>
          ) : threads.length === 0 ? (
            <p className={styles.hint}>Діалогів із таким статусом немає.</p>
          ) : (
            <ul className={styles.threadList}>
              {threads.map((item) => (
                <li key={item.threadId}>
                  <button
                    type="button"
                    className={`${styles.threadCard} ${activeId === item.threadId ? styles.threadCardActive : ""}`}
                    onClick={() => setActiveId(item.threadId)}
                  >
                    <span className={styles.threadHead}>
                      <span className={styles.threadName}>
                        {threadTitle(item)}
                      </span>
                      {item.unreadForAdmin > 0 && (
                        <span className={styles.unreadBadge}>
                          {item.unreadForAdmin}
                        </span>
                      )}
                    </span>
                    <span className={styles.threadPreview}>
                      {item.lastMessagePreview || "Повідомлень ще немає"}
                    </span>
                    <span className={styles.threadMeta}>
                      <span>{STATUS_LABELS[item.status]}</span>
                      <span>{formatTime(item.lastMessageAt)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.chatPane} aria-label="Діалог">
          {!activeId ? (
            <p className={styles.hint}>Оберіть діалог зліва.</p>
          ) : loadingThread && !thread ? (
            <p className={styles.hint}>Завантаження діалогу...</p>
          ) : !thread ? (
            <p className={`${styles.hint} ${styles.errorBox}`}>
              Не вдалося відкрити діалог.
            </p>
          ) : (
            <>
              <div className={styles.chatHeader}>
                <button
                  type="button"
                  className={styles.backButton}
                  onClick={() => setActiveId(null)}
                >
                  ← До списку
                </button>
                <div className={styles.chatHeading}>
                  <h2 className={styles.chatTitle}>{threadTitle(thread)}</h2>
                  <p className={styles.chatMeta}>
                    {STATUS_LABELS[thread.status]} · {thread.messages.length}{" "}
                    повідомлень
                    {thread.clientPhone ? ` · ${thread.clientPhone}` : ""}
                  </p>
                </div>
                <div className={styles.chatActions}>
                  {thread.status === "open" ? (
                    <button
                      type="button"
                      className={styles.actionButton}
                      disabled={busyStatus}
                      onClick={() => void changeStatus("closed")}
                    >
                      Закрити
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={styles.actionButton}
                      disabled={busyStatus}
                      onClick={() => void changeStatus("open")}
                    >
                      Відкрити знову
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.actionButton}
                    disabled={busyStatus || thread.status === "archived"}
                    onClick={() => void changeStatus("archived")}
                  >
                    В архів
                  </button>
                </div>
              </div>

              <div className={styles.messages} ref={messagesRef}>
                {thread.messages.length === 0 ? (
                  <p className={styles.hint}>
                    У цьому діалозі ще немає повідомлень.
                  </p>
                ) : (
                  thread.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`${styles.bubbleRow} ${m.role === "operator" ? styles.rowOperator : styles.rowClient}`}
                    >
                      <div
                        className={`${styles.bubble} ${m.role === "operator" ? styles.bubbleOperator : styles.bubbleClient}`}
                      >
                        <div className={styles.bubbleMeta}>
                          <span>
                            {m.role === "operator"
                              ? m.author || "Команда Жирафик"
                              : thread.clientName || "Клієнт"}
                          </span>
                          <span className={styles.channelTag}>
                            {CHANNEL_LABELS[m.channel] ?? m.channel}
                          </span>
                          <time>{formatTime(m.createdAt)}</time>
                        </div>
                        <div className={styles.bubbleText}>{m.content}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form className={styles.composer} onSubmit={sendReply}>
                <textarea
                  className={styles.textarea}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Напишіть відповідь клієнту..."
                  rows={2}
                  maxLength={2000}
                  disabled={sending || thread.status === "archived"}
                  aria-label="Текст відповіді"
                />
                <button
                  type="submit"
                  className={styles.sendButton}
                  disabled={
                    sending || !draft.trim() || thread.status === "archived"
                  }
                >
                  {sending ? "Надсилаємо..." : "Надіслати"}
                </button>
              </form>
              {thread.status === "archived" && (
                <p className={styles.archivedNote}>
                  Діалог в архіві. Щоб відповісти, спершу відкрийте його знову.
                </p>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
