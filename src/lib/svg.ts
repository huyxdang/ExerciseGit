export type Theme = "github" | "strava";

const THEMES = {
  github: {
    bg: "#0d1117",
    empty: "#161b22",
    active: "#39d353",
    text: "#8b949e",
  },
  strava: {
    bg: "#1a1a1a",
    empty: "#2a2a2a",
    active: "#fc4c02",
    text: "#888888",
  },
};

const CELL = 11;
const GAP = 3;
const STEP = CELL + GAP;
const WEEKS = 52;
const DAYS = 7;
const PADDING = { top: 20, left: 28, right: 16, bottom: 8 };

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function generateSvg(activeDates: Set<string>, theme: Theme = "github"): string {
  const colors = THEMES[theme];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDay = new Date(today);
  startDay.setDate(today.getDate() - today.getDay() - (WEEKS - 1) * 7);

  const width = PADDING.left + WEEKS * STEP - GAP + PADDING.right;
  const height = PADDING.top + DAYS * STEP - GAP + PADDING.bottom;

  const monthLabels: { x: number; label: string }[] = [];
  const cells: string[] = [];

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  let lastMonth = -1;

  for (let w = 0; w < WEEKS; w++) {
    for (let d = 0; d < DAYS; d++) {
      const date = new Date(startDay);
      date.setDate(startDay.getDate() + w * 7 + d);
      if (date > today) continue;

      const key = dateKey(date);
      const active = activeDates.has(key);
      const fill = active ? colors.active : colors.empty;

      const x = PADDING.left + w * STEP;
      const y = PADDING.top + d * STEP;

      cells.push(
        `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2" fill="${fill}"><title>${key}</title></rect>`
      );

      const month = date.getMonth();
      if (d === 0 && month !== lastMonth) {
        monthLabels.push({ x, label: MONTHS[month] });
        lastMonth = month;
      }
    }
  }

  const monthSvg = monthLabels
    .map(({ x, label }) => `<text x="${x}" y="12" fill="${colors.text}" font-size="10" font-family="system-ui,sans-serif">${label}</text>`)
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" rx="6" fill="${colors.bg}"/>
  ${monthSvg}
  ${cells.join("\n  ")}
</svg>`;
}
