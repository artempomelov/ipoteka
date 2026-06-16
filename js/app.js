// Рендер контента главной страницы и навигация.

function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html != null) node.innerHTML = html;
  return node;
}

// Тизер гайда на главной: компактные нумерованные чипы из шагов.
function renderGuideTeaser() {
  const wrap = document.getElementById("guideTeaser");
  if (!wrap) return;
  STEPS.forEach((s) => {
    wrap.appendChild(
      el("span", "guide-chip", `<i>${s.n}</i>${s.title}`)
    );
  });
}

function renderBanks() {
  const grid = document.getElementById("bankGrid");
  if (!grid) return;
  BANKS.forEach((b) => {
    const card = el("a", "bank-card bank-card-link", `
      <div class="bank-top" style="--accent:${b.color}">
        ${bankLogoHtml(b)}
        <h3>${b.name}</h3>
      </div>
      <p class="bank-about">${b.about}</p>
      <dl class="bank-specs">
        <div><dt>Ставка</dt><dd>${b.rateShort}</dd></div>
        <div><dt>Программ</dt><dd>${b.programs.length}</dd></div>
      </dl>
      <span class="bank-more">Программы и калькулятор →</span>`);
    card.href = `bank.html?bank=${b.slug}`;
    grid.appendChild(card);
  });
}

function renderDevelopers() {
  const grid = document.getElementById("devGrid");
  if (!grid) return;
  DEVELOPERS.forEach((d) => {
    grid.appendChild(
      el("article", "dev-card", `
        <div class="dev-head">
          ${devLogoHtml(d)}
          <div class="dev-title">
            <h3>${d.name}</h3>
            <span class="dev-since">${d.since}</span>
          </div>
        </div>
        <p class="dev-cities">📍 ${d.cities}</p>
        <p>${d.text}</p>
        <a class="dev-link" href="${d.url}" target="_blank" rel="noopener">Перейти на сайт →</a>`)
    );
  });
}

// Тизер новостей на главной: 3 свежих новости.
function renderNewsTeaser() {
  const grid = document.getElementById("newsTeaser");
  if (!grid) return;
  NEWS.slice(0, 3).forEach((n) => {
    const card = el("a", "news-card", `
      <div class="news-meta"><span class="news-source">${n.source}</span><span class="news-date">${n.date}</span></div>
      <h3>${n.title}</h3>
      <p>${n.summary}</p>
      <span class="news-more">Читать на источнике →</span>`);
    card.href = n.url;
    card.target = "_blank";
    card.rel = "noopener";
    grid.appendChild(card);
  });
}

// Обратная связь.
// FEEDBACK_ENDPOINT — URL Cloudflare Worker (см. worker/feedback-worker.js и README).
// Пока он пустой, форма работает через почтовый клиент (mailto). После деплоя
// воркера вставьте сюда его адрес — заявки начнут приходить в Telegram.
const FEEDBACK_ENDPOINT = ""; // напр. "https://feedback.<имя>.workers.dev"
const FEEDBACK_EMAIL = "artem.pomelov@gmail.com";
// Ссылка на Telegram для кнопки «Написать в Telegram».
// Укажите бота или личный аккаунт, напр. "https://t.me/ipoteka24kz_bot".
// Пока пусто — кнопка скрыта.
const TELEGRAM_URL = "";

function setFbStatus(status, ok, text) {
  status.hidden = false;
  status.className = "fb-status " + (ok ? "fb-ok" : "fb-error");
  status.textContent = text;
}

function sendViaMailto(name, contact, message, status, form) {
  const subject = encodeURIComponent("Обратная связь — Ипотека24.KZ");
  const body = encodeURIComponent(`Имя: ${name}\nКонтакт: ${contact}\n\nСообщение:\n${message}`);
  window.location.href = `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;
  setFbStatus(status, true, "Спасибо! Откроется ваш почтовый клиент — останется нажать «Отправить».");
  form.reset();
}

function initFeedback() {
  const form = document.getElementById("feedbackForm");
  if (!form) return;
  const status = document.getElementById("fbStatus");
  const submitBtn = form.querySelector('button[type="submit"]');

  // Кнопка «Написать в Telegram» — показываем, если задана ссылка.
  const tg = document.getElementById("tgContact");
  if (tg && TELEGRAM_URL) {
    tg.href = TELEGRAM_URL;
    tg.hidden = false;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("fbName").value.trim();
    const contact = document.getElementById("fbContact").value.trim();
    const message = document.getElementById("fbMessage").value.trim();
    const website = (document.getElementById("fbWebsite") || {}).value || "";

    if (!name || !contact || !message) {
      setFbStatus(status, false, "Пожалуйста, заполните все поля.");
      return;
    }

    // Без настроенного эндпоинта — отправка через почтовый клиент.
    if (!FEEDBACK_ENDPOINT) {
      sendViaMailto(name, contact, message, status, form);
      return;
    }

    setFbStatus(status, true, "Отправляем…");
    submitBtn.disabled = true;
    try {
      const resp = await fetch(FEEDBACK_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, contact, message, website }),
      });
      const data = await resp.json().catch(() => ({}));
      if (resp.ok && data.ok) {
        setFbStatus(status, true, "Спасибо! Сообщение отправлено — мы свяжемся с вами.");
        form.reset();
      } else {
        setFbStatus(status, false, "Не удалось отправить. Попробуйте ещё раз или напишите на почту.");
      }
    } catch {
      setFbStatus(status, false, "Ошибка сети. Проверьте соединение и попробуйте снова.");
    } finally {
      submitBtn.disabled = false;
    }
  });
}

function initNav() {
  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => nav.classList.toggle("open"));
    nav.addEventListener("click", (e) => {
      if (e.target.tagName === "A") nav.classList.remove("open");
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderGuideTeaser();
  renderBanks();
  renderDevelopers();
  renderNewsTeaser();
  initFeedback();
  initNav();
  const calcRoot = document.getElementById("mainCalc");
  if (calcRoot) {
    createCalculator(calcRoot, { price: 30000000, downPct: 20, rate: 7, term: 20, insurance: false });
  }
});
