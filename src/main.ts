/**
 * Bootstrap. No network, no cloud — everything mounts locally.
 */
import { App } from './ui/app.js';

function boot(): void {
  const root = document.getElementById('app');
  if (!root) throw new Error('FOCUS METRIC ENGINE: #app mount point missing');
  new App(root).start();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
