// Страница отдельного банка: шапка, переключатель программ, калькулятор.

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function renderNotFound(root) {
  root.innerHTML = `
    <section class="section">
      <div class="container">
        <div class="section-head">
          <h2>Банк не найден</h2>
          <p>Похоже, вы перешли по неверной ссылке.</p>
        </div>
        <a class="btn btn-primary" href="index.html#banks">← Ко всем банкам</a>
      </div>
    </section>`;
}

let calcInstance = null;

function selectProgram(bank, program) {
  // Подсветка активной вкладки
  document.querySelectorAll(".prog-tab").forEach((t) => {
    t.classList.toggle("active", t.dataset.prog === program.id);
  });

  // Информация о программе
  const info = document.getElementById("progInfo");
  const c = program.conditions;
  info.innerHTML = `
    <div class="prog-head">
      <span class="prog-badge">${escapeHtml(program.badge)}</span>
      <h3>${escapeHtml(program.name)}</h3>
    </div>
    <p class="prog-summary">${escapeHtml(program.summary)}</p>
    <div class="prog-cols">
      <div class="prog-suitable">
        <h4>Кому подходит</h4>
        <ul>${program.suitable.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>
      </div>
      <div class="prog-conditions">
        <h4>Условия</h4>
        <dl class="bank-specs">
          <div><dt>Ставка</dt><dd>${escapeHtml(c.rate)}</dd></div>
          <div><dt>Первонач. взнос</dt><dd>${escapeHtml(c.down)}</dd></div>
          <div><dt>Срок</dt><dd>${escapeHtml(c.term)}</dd></div>
          <div><dt>Макс. сумма</dt><dd>${escapeHtml(c.sum)}</dd></div>
        </dl>
      </div>
    </div>`;

  // Калькулятор с дефолтами программы (значения можно менять вручную)
  const defaults = { ...program.calc, insurance: false };
  if (!calcInstance) {
    calcInstance = createCalculator(document.getElementById("bankCalc"), defaults);
  } else {
    calcInstance.applyDefaults(defaults);
  }
}

function renderBank(root, bank) {
  document.title = `${bank.name} — ипотека | Ипотека.kz`;

  root.innerHTML = `
    <section class="bank-hero" style="--accent:${bank.color}">
      <div class="container">
        <a class="back-link" href="index.html#banks">← Все банки</a>
        <div class="bank-hero-title">
          ${bankLogoHtml(bank, "bank-avatar-lg")}
          <h1>${escapeHtml(bank.name)}</h1>
        </div>
        <p class="bank-hero-about">${escapeHtml(bank.about)}</p>
        <div class="bank-hero-meta">
          <span>На рынке с ${escapeHtml(bank.founded)}</span>
          <span>Программ: ${bank.programs.length}</span>
          <span>Ставка: ${escapeHtml(bank.rateShort)}</span>
          <a href="${bank.url}" target="_blank" rel="noopener">Официальный сайт →</a>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">Программы</span>
          <h2>Ипотечные программы банка</h2>
          <p>Выберите программу — условия и калькулятор обновятся автоматически.</p>
        </div>

        <div class="prog-tabs" id="progTabs">
          ${bank.programs.map((p) => `<button class="prog-tab" data-prog="${p.id}">${escapeHtml(p.name)}</button>`).join("")}
        </div>

        <div class="prog-info" id="progInfo"></div>

        <div class="section-head" style="margin-top:48px">
          <span class="eyebrow">Расчёт</span>
          <h2>Калькулятор платежа</h2>
          <p>По умолчанию настроен на выбранную программу. Меняйте параметры под свою ситуацию.</p>
        </div>
        <div id="bankCalc"></div>

        <p class="disclaimer">Условия ориентировочные (2026), собраны из открытых источников. Точные ставки, лимиты и требования уточняйте на сайте банка и в отделении.</p>
      </div>
    </section>`;

  const tabs = document.getElementById("progTabs");
  tabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".prog-tab");
    if (!btn) return;
    const program = bank.programs.find((p) => p.id === btn.dataset.prog);
    if (program) selectProgram(bank, program);
  });

  selectProgram(bank, bank.programs[0]);
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
  initNav();
  const root = document.getElementById("bankPage");
  const bank = getBankBySlug(getParam("bank"));
  if (!bank) renderNotFound(root);
  else renderBank(root, bank);
});
