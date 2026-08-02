/**
 * Tiny DOM helpers — everything user-entered goes through textContent,
 * never innerHTML, so there is no XSS surface.
 */

export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props || {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key === "class") node.className = value;
    else if (key === "dataset") Object.assign(node.dataset, value);
    else if (key === "style" && typeof value === "object") Object.assign(node.style, value);
    else if (key.startsWith("on") && typeof value === "function") {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === "html") {
      // Only for trusted, static app content — never user input.
      node.innerHTML = value;
    } else if (value === true) node.setAttribute(key, "");
    else node.setAttribute(key, value);
  }
  append(node, children);
  return node;
}

function append(node, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

/** Replace the app root's content and move focus for screen readers. */
export function render(root, ...children) {
  clear(root);
  append(root, children);
  root.focus({ preventScroll: true });
  window.scrollTo({ top: 0 });
}

let toastTimer = null;
export function toast(message) {
  document.querySelectorAll(".toast").forEach((t) => t.remove());
  const node = el("div", { class: "toast", role: "status" }, message);
  document.body.append(node);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.remove(), 2600);
}

/** Format a yyyy-mm-dd date or timestamp for display. */
export function fmtDate(value) {
  if (!value) return "";
  const d = typeof value === "number" ? new Date(value) : new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/** A row of 1..5 rating buttons that reports changes via onChange(n). */
export function ratingRow(current, onChange, labelPrefix = "Rate") {
  const row = el("div", { class: "rating-row", role: "group", "aria-label": labelPrefix });
  for (let n = 1; n <= 5; n++) {
    const btn = el(
      "button",
      {
        type: "button",
        class: "rate-btn",
        "aria-pressed": String(current === n),
        "aria-label": `${labelPrefix}: ${n} out of 5`,
        onClick: () => {
          onChange(n);
          [...row.children].forEach((b, i) => b.setAttribute("aria-pressed", String(i + 1 === n)));
        },
      },
      String(n)
    );
    row.append(btn);
  }
  return row;
}

/** A toggleable chip (aria-pressed) that reports its new state via onToggle(pressed). */
export function chip(label, pressed, onToggle) {
  const c = el(
    "button",
    {
      type: "button",
      class: "chip",
      "aria-pressed": String(!!pressed),
      onClick: () => {
        const next = c.getAttribute("aria-pressed") !== "true";
        c.setAttribute("aria-pressed", String(next));
        onToggle(next);
      },
    },
    label
  );
  return c;
}
