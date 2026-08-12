function nthWeekday(year: number, month: number, weekday: number, n: number): number {
  const first = new Date(year, month, 1).getDay();
  let day = 1 + ((weekday - first + 7) % 7) + (n - 1) * 7;
  return day;
}

function springEquinoxDay(year: number): number {
  if (year >= 2000 && year <= 2099) {
    return Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
  }
  return 20;
}

function autumnEquinoxDay(year: number): number {
  if (year >= 2000 && year <= 2099) {
    return Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
  }
  return 23;
}

export function getJapaneseHolidays(year: number): Set<string> {
  const holidays: string[] = [];
  const fmt = (m: number, d: number) =>
    `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  // Fixed holidays
  holidays.push(fmt(1, 1));   // 元旦
  holidays.push(fmt(2, 11));  // 建国記念の日
  holidays.push(fmt(2, 23));  // 天皇誕生日
  holidays.push(fmt(4, 29));  // 昭和の日
  holidays.push(fmt(5, 3));   // 憲法記念日
  holidays.push(fmt(5, 4));   // みどりの日
  holidays.push(fmt(5, 5));   // こどもの日
  holidays.push(fmt(8, 11));  // 山の日
  holidays.push(fmt(11, 3));  // 文化の日
  holidays.push(fmt(11, 23)); // 勤労感謝の日

  // Happy Monday holidays
  holidays.push(fmt(1, nthWeekday(year, 0, 1, 2)));  // 成人の日 (2nd Monday Jan)
  holidays.push(fmt(7, nthWeekday(year, 6, 1, 3)));  // 海の日 (3rd Monday Jul)
  holidays.push(fmt(9, nthWeekday(year, 8, 1, 3)));  // 敬老の日 (3rd Monday Sep)
  holidays.push(fmt(10, nthWeekday(year, 9, 1, 2))); // スポーツの日 (2nd Monday Oct)

  // Equinox holidays
  holidays.push(fmt(3, springEquinoxDay(year)));  // 春分の日
  holidays.push(fmt(9, autumnEquinoxDay(year)));  // 秋分の日

  // Substitute holidays (振替休日): if holiday falls on Sunday, next Monday is off
  const base = new Set(holidays);
  for (const h of holidays) {
    const d = new Date(h);
    if (d.getDay() === 0) {
      let next = new Date(d);
      next.setDate(next.getDate() + 1);
      while (base.has(next.toISOString().slice(0, 10))) {
        next.setDate(next.getDate() + 1);
      }
      base.add(next.toISOString().slice(0, 10));
    }
  }

  return base;
}
