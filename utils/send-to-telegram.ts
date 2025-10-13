import assert from "node:assert"

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

assert(TELEGRAM_BOT_TOKEN, "Missing TELEGRAM_BOT_TOKEN")
assert(TELEGRAM_CHAT_ID, "Missing TELEGRAM_CHAT_ID")

// 🧩 Telegram にメッセージを送る関数
export async function sendToTelegram(text: string, file?: File, { notify }: { notify: boolean } = { notify: true }) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`

  const payload = {
    chat_id: TELEGRAM_CHAT_ID,
    text,
    parse_mode: "Markdown",
    disable_notification: !notify
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    if (!res.ok) console.error("Telegram send failed:", await res.text())

    const { message_id } = (await res.json() as any).result

    if (file) {
      const form = new FormData()
      form.append("chat_id", TELEGRAM_CHAT_ID!)
      form.append("caption", "📜 Build log (full)")
      form.append("document", new Blob([file]), file.name)
      form.append("reply_to_message_id", `${message_id}`)
      form.append("disable_notification", "true")

      await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`,
        {
          method: "POST",
          body: form
        }
      ).then(res => res.json())
    }
  } catch (e) {
    console.error("Telegram error:", e)
  }
}
