import { renderPortal } from './portal.js';
import { Session } from './session.js';
function showPortal(root) {
    renderPortal(root, (config) => {
        const session = new Session(root, config, () => showPortal(root));
        session.start();
    });
}
function boot() {
    const root = document.getElementById('app');
    if (!root)
        throw new Error('Missing #app mount point');
    showPortal(root);
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch((err) => {
            // Offline caching is progressive enhancement; the app runs without it.
            console.warn('Service worker registration failed:', err);
        });
    }
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
}
else {
    boot();
}
