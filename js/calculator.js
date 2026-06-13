// Переиспользуемый аннуитетный калькулятор ипотеки.
// Используется и на главной, и на страницах банков.

function formatTenge(value) {
  if (!isFinite(value)) return "—";
  return Math.round(value).toLocaleString("ru-RU") + " ₸";
}

// Аннуитетный платёж: P = S * i * (1+i)^n / ((1+i)^n - 1)
function annuityPayment(loan, annualRatePct, months) {
  if (loan <= 0 || months <= 0) return 0;
  const i = annualRatePct / 100 / 12;
  if (i === 0) return loan / months;
  const pow = Math.pow(1 + i, months);
  return (loan * i * pow) / (pow - 1);
}

function pluralYears(n) {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return n + " год";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return n + " года";
  return n + " лет";
}

const CALC_TEMPLATE = `
  <form class="calc-form">
    <div class="field">
      <label>Стоимость жилья, ₸</label>
      <input type="number" data-calc="price" min="0" step="100000" />
    </div>
    <div class="field">
      <label>Первоначальный взнос: <span data-calc="downPctLabel"></span></label>
      <input type="range" data-calc="downPct" min="0" max="90" step="1" />
      <div class="field-hint" data-calc="downAmountHint"></div>
    </div>
    <div class="field">
      <label>Ставка, % годовых</label>
      <input type="number" data-calc="rate" min="0" max="100" step="0.1" />
    </div>
    <div class="field">
      <label>Срок: <span data-calc="termLabel"></span></label>
      <input type="range" data-calc="term" min="1" max="25" step="1" />
    </div>
    <label class="checkbox">
      <input type="checkbox" data-calc="insurance" />
      <span>Учитывать страхование (≈0.5% от суммы займа в год)</span>
    </label>
  </form>
  <div class="calc-result">
    <div class="result-main">
      <span class="result-label">Ежемесячный платёж</span>
      <span class="result-value" data-calc="monthly">—</span>
    </div>
    <div class="result-grid">
      <div class="result-item">
        <span class="result-label">Сумма кредита</span>
        <span class="result-num" data-calc="loan">—</span>
      </div>
      <div class="result-item">
        <span class="result-label">Переплата</span>
        <span class="result-num" data-calc="overpay">—</span>
      </div>
      <div class="result-item">
        <span class="result-label">Всего выплат</span>
        <span class="result-num" data-calc="total">—</span>
      </div>
    </div>
    <div class="result-insurance" data-calc="insuranceRow" hidden>
      <span class="result-label">В т.ч. страхование за весь срок</span>
      <span class="result-num" data-calc="insuranceSum">—</span>
    </div>
    <div class="calc-bar-wrap">
      <span class="result-label">Состав выплат</span>
      <div class="calc-bar">
        <span class="seg seg-principal" data-calc="segPrincipal" title="Тело кредита"></span>
        <span class="seg seg-interest" data-calc="segInterest" title="Переплата по процентам"></span>
        <span class="seg seg-insurance" data-calc="segInsurance" title="Страхование"></span>
      </div>
      <div class="calc-legend">
        <span><i class="dot dot-principal"></i>Тело кредита</span>
        <span><i class="dot dot-interest"></i>Проценты</span>
        <span class="legend-ins" data-calc="legendInsurance" hidden><i class="dot dot-insurance"></i>Страхование</span>
      </div>
    </div>
    <p class="calc-note">Расчёт по формуле аннуитета. Без учёта комиссий банка — реальная стоимость кредита (ГЭСВ) может быть выше. Страхование добавляется как ≈0.5% от суммы займа в год.</p>
  </div>
`;

// Создаёт калькулятор внутри rootEl. defaults: {price, downPct, rate, term, insurance}
function createCalculator(rootEl, defaults) {
  rootEl.classList.add("calc");
  rootEl.innerHTML = CALC_TEMPLATE;

  const get = (key) => rootEl.querySelector(`[data-calc="${key}"]`);
  const fields = {
    price: get("price"), downPct: get("downPct"), rate: get("rate"), term: get("term"),
    insurance: get("insurance"),
  };

  function applyDefaults(d) {
    fields.price.value = d.price;
    fields.downPct.value = d.downPct;
    fields.rate.value = d.rate;
    fields.term.value = d.term;
    fields.insurance.checked = !!d.insurance;
    recalc();
  }

  function recalc() {
    const price = parseFloat(fields.price.value) || 0;
    const downPct = parseFloat(fields.downPct.value) || 0;
    const rate = parseFloat(fields.rate.value) || 0;
    const years = parseInt(fields.term.value, 10) || 0;
    const withInsurance = fields.insurance.checked;

    const downAmount = price * (downPct / 100);
    const loan = Math.max(price - downAmount, 0);
    const months = years * 12;

    let monthly = annuityPayment(loan, rate, months);
    const baseTotal = monthly * months;

    const insuranceSum = withInsurance ? loan * INSURANCE_ANNUAL_RATE * years : 0;
    const monthlyInsurance = months > 0 ? insuranceSum / months : 0;
    monthly += monthlyInsurance;

    const totalPaid = baseTotal + insuranceSum;
    const overpay = totalPaid - loan;

    get("downPctLabel").textContent = downPct + "%";
    get("downAmountHint").textContent = formatTenge(downAmount);
    get("termLabel").textContent = pluralYears(years);

    get("monthly").textContent = formatTenge(monthly);
    get("loan").textContent = formatTenge(loan);
    get("overpay").textContent = formatTenge(overpay);
    get("total").textContent = formatTenge(totalPaid);

    const insRow = get("insuranceRow");
    insRow.hidden = !withInsurance;
    get("insuranceSum").textContent = formatTenge(insuranceSum);

    // Диаграмма состава выплат
    const interest = Math.max(baseTotal - loan, 0);
    const sum = loan + interest + insuranceSum;
    const pct = (v) => (sum > 0 ? (v / sum) * 100 : 0);
    get("segPrincipal").style.width = pct(loan) + "%";
    get("segInterest").style.width = pct(interest) + "%";
    get("segInsurance").style.width = pct(insuranceSum) + "%";
    get("legendInsurance").hidden = !withInsurance;
  }

  rootEl.querySelector(".calc-form").addEventListener("input", recalc);
  applyDefaults(defaults || { price: 30000000, downPct: 20, rate: 7, term: 20, insurance: false });

  return { recalc, applyDefaults };
}
