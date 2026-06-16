// Экспресс-оценка шансов на одобрение ипотеки (pre-qualification).
// Ориентировочно: по ключевым критериям андеррайтинга — первоначальный взнос (LTV),
// долговая нагрузка (КДН) и официальный доход. Финальное решение принимает банк.
// Использует annuityPayment/formatTenge из calculator.js.

// Обратная функция к аннуитету: какую сумму кредита можно обслуживать платежом P.
function affordableLoan(payment, annualRatePct, months) {
  if (payment <= 0 || months <= 0) return 0;
  const i = annualRatePct / 100 / 12;
  if (i === 0) return payment * months;
  const pow = Math.pow(1 + i, months);
  return (payment * (pow - 1)) / (i * pow);
}

function pqEl(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
}

function initPrequal() {
  const form = document.getElementById("prequalForm");
  if (!form) return;
  const out = document.getElementById("prequalResult");

  const get = (id) => document.getElementById(id);
  const MAX_DTI = 0.5; // регуляторный ориентир по долговой нагрузке (КДН)
  const TERM_MONTHS = 240; // 20 лет — для оценки платежа

  function recalc() {
    const income = parseFloat(get("pqIncome").value) || 0;
    const debts = parseFloat(get("pqDebts").value) || 0;
    const price = parseFloat(get("pqPrice").value) || 0;
    const downPct = parseFloat(get("pqDown").value) || 0;
    const noHousing = get("pqNoHousing").checked;
    const newBuild = get("pqNewBuild").checked;

    get("pqDownLabel").textContent = downPct + "%";

    if (income <= 0 || price <= 0) {
      out.innerHTML = `<p class="pq-empty">Заполните доход и стоимость жилья — покажем оценку шансов.</p>`;
      return;
    }

    const loan = Math.max(price * (1 - downPct / 100), 0);
    const ltvDown = downPct; // первоначальный взнос, %
    // Доступна ли льготная ставка для оценки платежа
    const eligible72025 = noHousing && newBuild && downPct >= 20 && loan <= 30000000;
    const estRate = eligible72025 ? 7 : 19;

    const monthly = annuityPayment(loan, estRate, TERM_MONTHS);
    const dti = income > 0 ? (debts + monthly) / income : 1;

    // Комфортная сумма кредита при доходе (платёж ≤ 50% дохода за вычетом текущих долгов)
    const freePayment = Math.max(income * MAX_DTI - debts, 0);
    const maxLoan = affordableLoan(freePayment, estRate, TERM_MONTHS);

    // Вердикт
    let level, levelText;
    if (downPct >= 20 && dti <= 0.5) {
      level = "high"; levelText = "Высокие шансы";
    } else if (downPct >= 15 && dti <= 0.6) {
      level = "mid"; levelText = "Средние шансы";
    } else {
      level = "low"; levelText = "Низкие шансы";
    }

    // Чек-лист критериев
    const checks = [];
    checks.push(downPct >= 30
      ? { ok: true, t: `Взнос ${downPct}% — отличный: доступна ставка с ГЭСВ до 20% (правило с 1 июля 2026).` }
      : downPct >= 20
      ? { ok: true, t: `Взнос ${downPct}% — достаточный для большинства программ (от 20%).` }
      : { ok: false, t: `Взнос ${downPct}% — ниже 20%. Многие программы недоступны, ставка/ГЭСВ будут выше.` });

    checks.push(dti <= 0.5
      ? { ok: true, t: `Долговая нагрузка (КДН) ≈ ${Math.round(dti * 100)}% — в пределах нормы (до 50%).` }
      : dti <= 0.6
      ? { ok: false, t: `КДН ≈ ${Math.round(dti * 100)}% — на грани. Банк может урезать сумму или отказать.` }
      : { ok: false, t: `КДН ≈ ${Math.round(dti * 100)}% — выше нормы. Нужен больший доход или меньшая сумма.` });

    checks.push({ ok: true, t: `Доход должен быть официальным — с пенсионными отчислениями (банк видит их в ЕНПФ/ГЦВП).` });

    // Подходящие программы
    const programs = [];
    if (noHousing && newBuild && downPct >= 20) programs.push("«7-20-25» — ставка 7%, новостройка, взнос от 20%");
    if (noHousing) programs.push("«Наурыз» (Отбасы) — 7–9%, по баллам/очереди");
    programs.push("Отбасы банк — 3.5–8.5% при накоплении на депозите");
    programs.push(downPct >= 30 ? "Рыночная ипотека — ГЭСВ до 20% (взнос от 30%)" : "Рыночная ипотека — ГЭСВ до 25% (взнос меньше 30%)");

    out.innerHTML = `
      <div class="pq-verdict pq-${level}">
        <span class="pq-verdict-label">Оценка шансов</span>
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
      <p class="pq-note">⚠️ Оценка ориентировочная и не является решением банка. Льготные программы («7-20-25», «Наурыз») имеют годовые лимиты финансирования и систему баллов/очереди — наличие мест меняется. Актуальный статус уточняйте в <a href="https://hcsbk.kz" target="_blank" rel="noopener">Отбасы банке</a> и выбранном банке.</p>
    `;
  }

  form.addEventListener("input", recalc);
  recalc();
}

document.addEventListener("DOMContentLoaded", initPrequal);
