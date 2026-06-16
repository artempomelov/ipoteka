// Cloudflare Worker — прокси для формы обратной связи Ипотека24.KZ.
// Хранит токен бота и chat_id в секретах Worker, форма на сайте их не видит.
//
// Переменные окружения Worker (задаются при настройке, см. README):
//   BOT_TOKEN  — токен бота от @BotFather (Secret)
//   CHAT_ID    — ваш Telegram chat_id (Variable или Secret)
//
// Разрешённые источники запросов (ваш сайт):
const ALLOWED_ORIGINS = [
  "https://ipoteka24.kz",
  "https://www.ipoteka24.kz",
  "https://artempomelov.github.io",
];

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: cors });
    }

    let data;
    try {
      data = await request.json();
    } catch {
      return json({ ok: false, error: "bad json" }, 400, cors);
    }

    const name = String(data.name || "").trim().slice(0, 100);
    const contact = String(data.contact || "").trim().slice(0, 100);
    const message = String(data.message || "").trim().slice(0, 2000);

    // Простая защита от спама: honeypot-поле должно быть пустым.
    if (data.website) return json({ ok: true }, 200, cors);
    if (!name || !contact || !message) {
      return json({ ok: false, error: "empty fields" }, 400, cors);
    }

    const text =
      `📩 Новая заявка с Ипотека24.KZ\n\n` +
      `👤 Имя: ${name}\n` +
      `📞 Контакт: ${contact}\n\n` +
      `💬 Сообщение:\n${message}`;

    const tgResp = await fetch(
      `https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: env.CHAT_ID, text }),
      }
    );

    if (!tgResp.ok) {
      return json({ ok: false, error: "telegram error" }, 502, cors);
    }
    return json({ ok: true }, 200, cors);
  },
};

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}
