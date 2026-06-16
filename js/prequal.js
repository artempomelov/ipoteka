// Экспресс-оценка шансов на одобрение ипотеки (pre-qualification).
// Ориентировочно: первоначальный взнос (LTV), долговая нагрузка (КДН по методике АРРФР —
// с учётом прожиточного минимума на заёмщика и иждивенцев) и официальный доход.
// Финальное решение принимает банк. Использует annuityPayment/formatTenge из calculator.js.

// Прожиточный минимум (ориентир 2026), ₸/мес — для расчёта КДН.
const SUBSISTENCE_MIN = 46228;

// Лимиты госпрограмм по городам (ориентировочно, 2026).
const PQ_CITIES = {
  astana:   { name: "Астана",        lim72025: 30000000, limNauryz: 36000000 },
  almaty:   { name: "Алматы",        lim72025: 30000000, limNauryz: 36000000 },
  shymkent: { name: "Шымкент",       lim72025: 30000000, limNauryz: 30000000 },
  aktau:    { name: "Актау",         lim72025: 30000000, limNauryz: 30000000 },
  atyrau:   { name: "Атырау",        lim72025: 30000000, limNauryz: 30000000 },
  other:    { name: "Другой регион", lim72025: 15000000, limNauryz: 30000000 },
};

// Обратная функция к аннуитету: какую сумму кредита можно обслуживать платежом P.
function affordableLoan(payment, annualRatePct, months) {
  if (payment <= 0 || months <= 0) return 0;
  const i = annualRatePct / 100 / 12;
  if (i === 0) return payment * months;
  const pow = Math.pow(1 + i, months);
  return (payment * (pow - 1)) / (i * pow);
}

function initPrequal() {
  const form = document.getElementById("prequalForm");
  if (!form) return;
  const out = document.getElementById("prequalResult");
  const get = (id) => document.getElementById(id);
  const MAX_DTI = 0.5; // регуляторный ориентир по долговой нагрузке (КДН)
  const TERM_MONTHS = 240; // 20 лет — для оценки платежа

  // Предзаполнение из URL (для шаринга результата).
  (function prefillFromUrl() {
    const p = new URLSearchParams(location.search);
    if (![...p.keys()].length) return;
    const setVal = (id, key) => { if (p.has(key) && get(id)) get(id).value = p.get(key); };
    const setChk = (id, key) => { if (p.has(key) && get(id)) get(id).checked = p.get(key) === "1"; };
    setVal("pqIncome", "income"); setVal("pqDebts", "debts"); setVal("pqPrice", "price");
    setVal("pqDown", "down"); setVal("pqDeps", "deps"); setVal("pqCity", "city");
    setChk("pqNoHousing", "nh"); setChk("pqNewBuild", "nb");
  })();

  function currentParams() {
    const p = new URLSearchParams();
    p.set("income", get("pqIncome").value || "0");
    p.set("debts", get("pqDebts").value || "0");
    p.set("price", get("pqPrice").value || "0");
    p.set("down", get("pqDown").value || "0");
    p.set("deps", get("pqDeps").value || "0");
    p.set("city", get("pqCity").value || "astana");
    p.set("nh", get("pqNoHousing").checked ? "1" : "0");
    p.set("nb", get("pqNewBuild").checked ? "1" : "0");
    return p.toString();
  }

  function recalc() {
    const income = parseFloat(get("pqIncome").value) || 0;
    const debts = parseFloat(get("pqDebts").value) || 0;
    const price = parseFloat(get("pqPrice").value) || 0;
    const downPct = parseFloat(get("pqDown").value) || 0;
    const deps = Math.max(parseInt(get("pqDeps").value, 10) || 0, 0);
    const cityKey = get("pqCity").value || "astana";
    const city = PQ_CITIES[cityKey] || PQ_CITIES.astana;
    const noHousing = get("pqNoHousing").checked;
    const newBuild = get("pqNewBuild").checked;

    get("pqDownLabel").textContent = downPct + "%";

    if (income <= 0 || price <= 0) {
      out.innerHTML = `<p class="pq-empty">Заполните доход и стоимость жилья — покажем оценку шансов.</p>`;
      return;
    }

    const loan = Math.max(price * (1 - downPct / 100), 0);
    const eligible72025 = noHousing && newBuild && downPct >= 20 && loan <= city.lim72025;
    const estRate = eligible72025 ? 7 : 19;
    const monthly = annuityPayment(loan, estRate, TERM_MONTHS);

    // КДН по методике АРРФР: платежи / (доход − прожиточный минимум на семью без дохода).
    const family = 1 + deps; // заёмщик + иждивенцы
    const disposable = Math.max(income - SUBSISTENCE_MIN * family, 1);
    const dti = (debts + monthly) / disposable;

    // Комфортная сумма кредита: платёж ≤ 50% располагаемого дохода за вычетом текущих долгов.
    const freePayment = Math.max(disposable * MAX_DTI - debts, 0);
    const maxLoan = affordableLoan(freePayment, estRate, TERM_MONTHS);

    let level, levelText;
    if (downPct >= 20 && dti <= 0.5) { level = "high"; levelText = "Высокие шансы"; }
    else if (downPct >= 15 && dti <= 0.6) { level = "mid"; levelText = "Средние шансы"; }
    else { level = "low"; levelText = "Низкие шансы"; }

    const checks = [];
    checks.push(downPct >= 30
      ? { ok: true, t: `Взнос ${downPct}% — отличный: доступна ставка с ГЭСВ до 20% (правило с 1 июля 2026).` }
      : downPct >= 20
      ? { ok: true, t: `Взнос ${downPct}% — достаточный для большинства программ (от 20%).` }
      : { ok: false, t: `Взнос ${downPct}% — ниже 20%. Многие программы недоступны, ставка/ГЭСВ выше.` });

    checks.push(dti <= 0.5
      ? { ok: true, t: `Долговая нагрузка (КДН) ≈ ${Math.round(dti * 100)}% — в пределах нормы (до 50%).` }
      : dti <= 0.6
      ? { ok: false, t: `КДН ≈ ${Math.round(dti * 100)}% — на грани. Банк может урезать сумму или отказать.` }
      : { ok: false, t: `КДН ≈ ${Math.round(dti * 100)}% — выше нормы. Нужен больший доход или меньшая сумма.` });

    checks.push({ ok: true, t: `КДН считается от дохода за вычетом прожиточного минимума на семью (заёмщик + ${deps} иждив.).` });
    checks.push({ ok: true, t: `Доход должен быть официальным — с пенсионными отчислениями (банк видит их в ЕНПФ/ГЦВП).` });

    const programs = [];
    if (eligible72025) programs.push(`«7-20-25» — ставка 7%, новостройка, взнос от 20% (лимит ${city.name}: до ${Math.round(city.lim72025 / 1e6)} млн ₸)`);
    else if (noHousing && newBuild && downPct >= 20 && loan > city.lim72025) programs.push(`«7-20-25» — сумма кредита превышает лимит для «${city.name}» (до ${Math.round(city.lim72025 / 1e6)} млн ₸)`);
    if (noHousing) programs.push(`«Наурыз» (Отбасы) — 7–9%, по баллам/очереди (лимит ${city.name}: до ${Math.round(city.limNauryz / 1e6)} млн ₸)`);
    programs.push("Отбасы банк — 3.5–8.5% при накоплении на депозите");
    programs.push(downPct >= 30 ? "Рыночная ипотека — ГЭСВ до 20% (взнос от 30%)" : "Рыночная ипотека — ГЭСВ до 25% (взнос меньше 30%)");

    out.innerHTML = `
      <div class="pq-verdict pq-${level}">
        <span class="pq-verdict-label">Оценка шансов · ${city.name}</span>
        <span class="pq-verdict-value">${levelText}</span>
      </div>
      <div class="pq-metrics">
        <div><span class="pq-m-label">Сумма кредита</span><span class="pq-m-val">${formatTenge(loan)}</span></div>
        <div><span class="pq-m-label">Платёж (≈, ${estRate}%)</span><span class="pq-m-val">${formatTenge(monthly)}</span></div>
        <div><span class="pq-m-label">Долговая нагрузка</span><span class="pq-m-val">${Math.round(dti * 100)}%</span></div>
        <div><span class="pq-m-label">Комфортная сумма</span><span class="pq-m-val">${formatTenge(maxLoan)}</span></div>
      </div>
      <ul class="pq-checks">
        ${checks.map((c) => `<li class="${c.ok ? "pq-ok" : "pq-warn"}">${c.t}</li>`).join("")}
      </ul>
      <div class="pq-programs">
        <span class="pq-programs-title">Подходящие программы:</span>
        <ul>${programs.map((p) => `<li>${p}</li>`).join("")}</ul>
      </div>
      <div class="pq-share-row">
        <button type="button" class="btn btn-ghost pq-share">🔗 Поделиться результатом</button>
        <span class="pq-share-msg" id="pqShareMsg" hidden>Ссылка скопирована</span>
      </div>
      <p class="pq-note">⚠️ Оценка ориентировочная и не является решением банка. Льготные программы («7-20-25», «Наурыз») имеют годовые лимиты финансирования и систему баллов/очереди — наличие мест меняется. Актуальный статус уточняйте в <a href="https://hcsbk.kz" target="_blank" rel="noopener">Отбасы банке</a> и выбранном банке.</p>
    `;
  }

  // Шаринг результата: копируем ссылку на отдельную страницу с параметрами.
  out.addEventListener("click", (e) => {
    if (!e.target.closest(".pq-share")) return;
    const base = location.origin + location.pathname.replace(/[^/]*$/, "") + "prequal.html";
    const url = base + "?" + currentParams();
    const done = () => { const m = get("pqShareMsg"); if (m) { m.hidden = false; setTimeout(() => (m.hidden = true), 2500); } };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done).catch(done);
    } else {
      const ta = document.createElement("textarea");
      ta.value = url; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch (_) {}
      document.body.removeChild(ta); done();
    }
  });

  form.addEventListener("input", recalc);
  recalc();
}

document.addEventListener("DOMContentLoaded", initPrequal);
