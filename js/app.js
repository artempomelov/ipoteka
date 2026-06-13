// Рендер контента главной страницы и навигация.

function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html != null) node.innerHTML = html;
  return node;
}

function renderSteps() {
  const grid = document.getElementById("stepsGrid");
  if (!grid) return;
  STEPS.forEach((s) => {
    grid.appendChild(
      el("article", "step-card", `
        <div class="step-num">${s.n}</div>
        <h3>${s.title}</h3>
        <p>${s.text}</p>`)
    );
  });
}

function renderLaws() {
  const grid = document.getElementById("lawGrid");
  if (!grid) return;
  LAWS.forEach((l) => {
    grid.appendChild(
      el("article", "law-card", `
        <span class="law-tag">${l.tag}</span>
        <h3>${l.title}</h3>
        <p>${l.text}</p>`)
    );
  });
}

function renderBanks() {
  const grid = document.getElementById("bankGrid");
  if (!grid) return;
  BANKS.forEach((b) => {
    const card = el("a", "bank-card bank-card-link", `
      <div class="bank-top" style="--accent:${b.color}">
        <span class="bank-avatar" style="--accent:${b.color}">${bankInitials(b.name)}</span>
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
          <h3>${d.name}</h3>
          <span class="dev-since">${d.since}</span>
        </div>
        <p class="dev-cities">📍 ${d.cities}</p>
        <p>${d.text}</p>
        <a class="dev-link" href="${d.url}" target="_blank" rel="noopener">Перейти на сайт →</a>`)
    );
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
  renderSteps();
  renderLaws();
  renderBanks();
  renderDevelopers();
  initNav();
  const calcRoot = document.getElementById("mainCalc");
  if (calcRoot) {
    createCalculator(calcRoot, { price: 30000000, downPct: 20, rate: 7, term: 20, insurance: false });
  }
});
