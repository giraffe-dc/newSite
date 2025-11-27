export interface TelegramConfig {
    botToken: string
    chatId: string | string[]
}

export async function sendTelegramMessage(
    message: string,
    config?: Partial<TelegramConfig>
) {
    const botToken = config?.botToken || process.env.TELEGRAM_BOT_TOKEN
    const provided = config?.chatId
    const envList = (process.env.TELEGRAM_CHAT_IDS || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    const single1 = process.env.TELEGRAM_CHAT_ID
    const single2 = process.env.TELEGRAM_CHAT_ID_2
    const single3 = process.env.TELEGRAM_CHAT_ID_3

    const chatIds: string[] = Array.isArray(provided)
        ? provided
        : [
              ...(provided ? [String(provided)] : []),
              ...envList,
              ...(single1 ? [single1] : []),
              ...(single2 ? [single2] : []),
              ...(single3 ? [single3] : []),
          ]

    if (!botToken || chatIds.length === 0) {
        console.warn(
            'Telegram not configured: missing TELEGRAM_BOT_TOKEN or chat ids (TELEGRAM_CHAT_ID(S))'
        )
        return { ok: false, skipped: true }
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`
    let allOk = true
    for (const id of [...new Set(chatIds)]) {
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: id,
                    text: message,
                    parse_mode: 'HTML',
                }),
            })
            // console.log('Telegram response:', res)
            if (!res.ok) {
                allOk = false
                const text = await res.text()
                console.error('Telegram error:', id, res.status, text)
            }
        } catch (err) {
            allOk = false
            console.error('Telegram fetch error:', id, err)
        }
    }
    return { ok: allOk }
}

export async function sendTelegramMessageSurvey(
    message: string,
    config?: Partial<TelegramConfig>
) {
    const botToken = config?.botToken || process.env.TELEGRAM_BOT_TOKEN_SURVEY
    const provided = config?.chatId
    const envList = (process.env.TELEGRAM_CHAT_IDS || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    const single1 = process.env.TELEGRAM_CHAT_ID
    const single2 = process.env.TELEGRAM_CHAT_ID_2

    const chatIds: string[] = Array.isArray(provided)
        ? provided
        : [
              ...(provided ? [String(provided)] : []),
              ...envList,
              ...(single1 ? [single1] : []),
              ...(single2 ? [single2] : []),
          ]

    if (!botToken || chatIds.length === 0) {
        console.warn(
            'Telegram not configured: missing TELEGRAM_BOT_TOKEN or chat ids (TELEGRAM_CHAT_ID(S))'
        )
        return { ok: false, skipped: true }
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`
    let allOk = true
    for (const id of [...new Set(chatIds)]) {
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: id,
                    text: message,
                    parse_mode: 'HTML',
                }),
            })
            console.log('Telegram response:', res)
            if (!res.ok) {
                allOk = false
                const text = await res.text()
                console.error('Telegram error:', id, res.status, text)
            }
        } catch (err) {
            allOk = false
            console.error('Telegram fetch error:', id, err)
        }
    }
    return { ok: allOk }
}
import { clsx, type ClassValue } from 'clsx'
// import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return clsx(inputs)
}
