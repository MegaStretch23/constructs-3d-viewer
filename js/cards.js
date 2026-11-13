// Product card drawn on a 2D canvas: title + price, nothing else (no invented artwork).
export function wrapLines(measure, text, maxW, maxLines = 8) {
  const words = String(text).replace(/\s+/g, " ").trim().split(" "), lines = []; let line = "";
  for (const w of words) {
    const t = line ? line + " " + w : w;
    if (measure(t) > maxW && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] += " …"; }
  return lines;
}
export function drawCard(p) {
  const c = document.createElement("canvas"); c.width = 512; c.height = 640;
  const g = c.getContext("2d");
  g.fillStyle = p.kind === "poster" ? "#f4efe6" : "#e9eef7"; g.fillRect(0, 0, 512, 640);
  g.strokeStyle = "#2b2f45"; g.lineWidth = 6; g.strokeRect(22, 22, 468, 596);
  g.fillStyle = "#171a2b"; g.font = "bold 30px system-ui,sans-serif"; g.textBaseline = "top";
  wrapLines((t) => g.measureText(t).width, p.title, 420).forEach((l, i) => g.fillText(l, 46, 60 + i * 40));
  g.font = "bold 44px system-ui,sans-serif"; g.fillText("$" + Number(p.price).toFixed(2), 46, 520);
  g.font = "16px system-ui,sans-serif"; g.fillStyle = "#6b7088"; g.fillText((p.source || "product") + " listing card", 46, 580);
  return c;
}
