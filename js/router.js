/**
 * Minimal hash router. Routes look like "#/journal" or "#/decision/:id".
 */

function safeDecode(segment) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment; // malformed %-sequence in a hand-mangled URL — use it raw
  }
}

export function createRouter(routes, { notFound } = {}) {
  function parse() {
    const hash = window.location.hash || "#/";
    const path = hash.replace(/^#/, "");
    const segments = path.split("/").filter(Boolean);
    return { path, segments };
  }

  function resolve() {
    const { path, segments } = parse();
    for (const route of routes) {
      const parts = route.path.split("/").filter(Boolean);
      if (parts.length !== segments.length) continue;
      const params = {};
      let ok = true;
      for (let i = 0; i < parts.length; i++) {
        if (parts[i].startsWith(":")) params[parts[i].slice(1)] = safeDecode(segments[i]);
        else if (parts[i] !== segments[i]) { ok = false; break; }
      }
      if (ok) return { route, params, path };
    }
    return { route: null, params: {}, path };
  }

  function fire() {
    // Plain fragments like "#app" are not routes (and shouldn't 404) —
    // normalize them home. Route hashes always start with "#/".
    const hash = window.location.hash;
    if (hash && hash !== "#" && !hash.startsWith("#/")) {
      try {
        history.replaceState(null, "", "#/");
      } catch {
        /* sandboxed iframe (e.g. embedded viewer) — fall through to 404 */
      }
    }
    const { route, params, path } = resolve();
    highlightNav(path);
    if (route) route.handler(params);
    else if (notFound) notFound(path);
  }

  function highlightNav(path) {
    const key = path === "/" ? "home" : path.split("/").filter(Boolean)[0];
    document.querySelectorAll("[data-nav]").forEach((a) => {
      a.classList.toggle("active", a.dataset.nav === key);
    });
  }

  window.addEventListener("hashchange", fire);
  return {
    start: fire,
    go(path) {
      if (window.location.hash === `#${path}`) fire();
      else window.location.hash = `#${path}`;
    },
  };
}
