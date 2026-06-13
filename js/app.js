// Рендер контента и навигация.

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
    grid.appendChild(
      el("article", "bank-card", `
        <div class="bank-top" style="--accent:${b.color}">
          <h3>${b.name}</h3>
        </div>
        <dl class="bank-specs">
          <div><dt>Ставка</dt><dd>${b.rate}</dd></div>
          <div><dt>Госпрограмма</dt><dd>${b.gov}</dd></div>
          <div><dt>Первонач. взнос</dt><dd>${b.down}</dd></div>
          <div><dt>Срок</dt><dd>${b.term}</dd></div>
          <div><dt>Макс. сумма</dt><dd>${b.max}</dd></div>
        </dl>
        <a class="bank-link" href="${b.url}" target="_blank" rel="noopener">Сайт банка →</a>`)
    );
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
  initCalculator();
});
