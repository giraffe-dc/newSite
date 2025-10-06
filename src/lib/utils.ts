export interface TelegramConfig {
    botToken: string
    chatId: string
}

export async function sendTelegramMessage(
    message: string,
    config?: Partial<TelegramConfig>
) {
    const botToken = config?.botToken || process.env.TELEGRAM_BOT_TOKEN
    const chatId = config?.chatId || process.env.TELEGRAM_CHAT_ID

    if (!botToken || !chatId) {
        console.warn(
            'Telegram not configured: missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID'
        )
        return { ok: false, skipped: true }
    }

    console.log('Sending Telegram message:', chatId)

    try {
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML',
            }),
        })

        // console.log('Telegram response:', res)

        if (!res.ok) {
            const text = await res.text()
            console.error('Telegram error:', res.status, text)
            return { ok: false }
        }
        return { ok: true }
    } catch (err) {
        console.error('Telegram fetch error:', err)
        return { ok: false }
    }
}
import { clsx, type ClassValue } from 'clsx'
// import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return clsx(inputs)
}
