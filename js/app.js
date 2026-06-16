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

// Обратная связь. Без бэкенда: формируем письмо через почтовый клиент пользователя.
// Чтобы отправлять прямо со страницы, замените тело обработчика на POST в Formspree
// (см. README) — разметку формы менять не нужно.
const FEEDBACK_EMAIL = "artem.pomelov@gmail.com";

function initFeedback() {
  const form = document.getElementById("feedbackForm");
  if (!form) return;
  const status = document.getElementById("fbStatus");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("fbName").value.trim();
    const contact = document.getElementById("fbContact").value.trim();
    const message = document.getElementById("fbMessage").value.trim();

    if (!name || !contact || !message) {
      status.hidden = false;
      status.className = "fb-status fb-error";
      status.textContent = "Пожалуйста, заполните все поля.";
      return;
    }

    const subject = encodeURIComponent("Обратная связь — Ипотека24.KZ");
    const body = encodeURIComponent(
      `Имя: ${name}\nКонтакт: ${contact}\n\nСообщение:\n${message}`
    );
    window.location.href = `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;

    status.hidden = false;
    status.className = "fb-status fb-ok";
    status.textContent = "Спасибо! Откроется ваш почтовый клиент — останется нажать «Отправить».";
    form.reset();
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
