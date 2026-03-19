// const TEST_DATE = null; // Mettre une date ici pour tester, ex: new Date('2026-05-01')
const TEST_DATE = new Date("2025-12-15"); // Mettre une date ici pour tester, ex: new Date('2026-05-01')

export function getNow() {
  return TEST_DATE ? new Date(TEST_DATE) : new Date();
}

export function toLocalDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
