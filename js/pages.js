// Рендер вспомогательных страниц (гайд, правовые основы) и навигация.

function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html != null) node.innerHTML = html;
  return node;
}

function renderStepsFull() {
  const grid = document.getElementById("stepsFull");
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

function renderLegalGuides() {
  const grid = document.getElementById("legalGuides");
  if (!grid) return;
  LEGAL_GUIDES.forEach((g) => {
    const items = g.items.map((i) => `<li>${i}</li>`).join("");
    grid.appendChild(
      el("article", "legal-card", `
        <div class="legal-card-head"><span class="legal-icon">${g.icon}</span><h3>${g.title}</h3></div>
        <ul class="legal-list">${items}</ul>`)
    );
  });
}

function renderLaws() {
  const grid = document.getElementById("lawGrid");
  if (!grid) return;
  LAWS.forEach((l) => {
    const card = el("article", "law-card", `
      <span class="law-tag">${l.tag}</span>
      <h3>${l.title}</h3>
      <p>${l.text}</p>
      ${l.url ? `<a class="law-link" href="${l.url}" target="_blank" rel="noopener">Читать документ →</a>` : ""}`);
    grid.appendChild(card);
  });
}

function renderNews() {
  const grid = document.getElementById("newsGrid");
  if (!grid) return;
  NEWS.forEach((n) => {
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
  renderStepsFull();
  renderLegalGuides();
  renderLaws();
  renderNews();
  initNav();
});
