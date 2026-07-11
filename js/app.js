import { createStore } from "./store.js";
import { createRouter } from "./router.js";
import { render, el, toast } from "./ui.js";
import { homeView } from "./views/home.js";
import { wizardView } from "./views/wizard.js";
import { journalView, decisionDetailView, reviewView } from "./views/journal.js";
import { mentorsView } from "./views/mentors.js";
import { coinFlipView } from "./views/coinflip.js";

const store = createStore();
const root = document.getElementById("app");

const ctx = { store, router: null };

const router = createRouter(
  [
    { path: "/", handler: () => render(root, homeView(ctx)) },
    { path: "/new", handler: () => render(root, wizardView(ctx)) },
    { path: "/journal", handler: () => render(root, journalView(ctx)) },
    { path: "/decision/:id", handler: (p) => render(root, decisionDetailView(ctx, p)) },
    { path: "/review/:id", handler: (p) => render(root, reviewView(ctx, p)) },
    { path: "/mentors", handler: () => render(root, mentorsView(ctx)) },
    { path: "/gut-check", handler: () => render(root, coinFlipView(ctx)) },
  ],
  {
    notFound: () =>
      render(
        root,
        el(
          "div",
          { class: "empty-state" },
          el("p", {}, "That page doesn't exist."),
          el("a", { class: "btn", href: "#/" }, "Go home")
        )
      ),
  }
);
ctx.router = router;

/* ---- footer data actions ---- */

document.getElementById("export-data").addEventListener("click", () => {
  const blob = new Blob([store.exportJSON()], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = el("a", { href: url, download: `betterdecisions-${new Date().toISOString().slice(0, 10)}.json` });
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast("Exported your decisions.");
});

const importInput = document.getElementById("import-file");
document.getElementById("import-data").addEventListener("click", () => importInput.click());
importInput.addEventListener("change", async () => {
  const file = importInput.files?.[0];
  importInput.value = "";
  if (!file) return;
  try {
    store.importJSON(await file.text());
    toast("Import complete.");
    router.go("/journal");
  } catch (err) {
    toast(`Import failed: ${err.message}`);
  }
});

document.getElementById("clear-data").addEventListener("click", () => {
  if (confirm("Delete ALL BetterDecisions data on this device? This cannot be undone.")) {
    store.clearAll();
    toast("All data cleared.");
    router.go("/");
  }
});

/* ---- go ---- */

router.start();
