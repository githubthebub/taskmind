/* ============================================================
   ATTUNE — bootstrap
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  Attune.Field.init();
  Attune.Pacer.init();
  Attune.initUI();

  // hide the breath label whenever no pattern is active
  setInterval(() => {
    const label = document.getElementById("breath-label");
    if (!Attune.Pacer.pattern || !Attune.Pacer.running) label.classList.remove("on");
  }, 800);
});
