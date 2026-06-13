// Аннуитетный калькулятор ипотеки.

function formatTenge(value) {
  if (!isFinite(value)) return "—";
  return Math.round(value).toLocaleString("ru-RU") + " ₸";
}

// Аннуитетный платёж: P = S * i * (1+i)^n / ((1+i)^n - 1)
// S — сумма кредита, i — месячная ставка, n — число месяцев.
function annuityPayment(loan, annualRatePct, months) {
  if (loan <= 0 || months <= 0) return 0;
  const i = annualRatePct / 100 / 12;
  if (i === 0) return loan / months; // беспроцентный случай
  const pow = Math.pow(1 + i, months);
  return (loan * i * pow) / (pow - 1);
}

function pluralYears(n) {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return n + " год";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return n + " года";
  return n + " лет";
}

function recalc() {
  const price = parseFloat(document.getElementById("price").value) || 0;
  const downPct = parseFloat(document.getElementById("downPct").value) || 0;
  const rate = parseFloat(document.getElementById("rate").value) || 0;
  const years = parseInt(document.getElementById("term").value, 10) || 0;

  const downAmount = price * (downPct / 100);
  const loan = Math.max(price - downAmount, 0);
  const months = years * 12;

  const monthly = annuityPayment(loan, rate, months);
  const totalPaid = monthly * months;
  const overpay = totalPaid - loan;

  // Подписи контролов
  document.getElementById("downPctLabel").textContent = downPct + "%";
  document.getElementById("downAmountHint").textContent = formatTenge(downAmount);
  document.getElementById("termLabel").textContent = pluralYears(years);

  // Результаты
  document.getElementById("monthlyPayment").textContent = formatTenge(monthly);
  document.getElementById("loanAmount").textContent = formatTenge(loan);
  document.getElementById("overpay").textContent = formatTenge(overpay);
  document.getElementById("totalPaid").textContent = formatTenge(totalPaid);
}

function initCalculator() {
  const form = document.getElementById("calcForm");
  if (!form) return;
  form.addEventListener("input", recalc);
  recalc();
}
