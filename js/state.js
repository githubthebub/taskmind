/* =========================================================
   Haven — local-only state. No accounts, no servers.
   ========================================================= */

const STORE_KEY = 'haven.v1';

const State = {
  data: null,

  defaults() {
    return {
      profile: {
        companion: null,        // companion id
        startPoint: null,       // onboarding self-assessment id
        monthlySpend: 0,        // what they told us they spend / month
        name: '',               // what the companions call you (text surfaces only)
        goalName: '',           // what the redirected money is for
        goalAmount: 0,
        lastMilestone: 0,       // highest milestone greeting already shown
        createdAt: Date.now()
      },
      settings: { voice: true, ambient: true },
      sessions: [],             // {ts, practiceId, minutes, before, after}
      urges: [],                // {ts, type, spotName, before, after, avoided}
      checkins: []              // {ts, tension}
    };
  },

  load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      this.data = raw ? Object.assign(this.defaults(), JSON.parse(raw)) : this.defaults();
    } catch (e) {
      this.data = this.defaults();
    }
    return this.data;
  },

  save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(this.data)); } catch (e) { /* private mode */ }
  },

  reset() {
    localStorage.removeItem(STORE_KEY);
    this.data = this.defaults();
  },

  get profile()  { return this.data.profile; },
  get companion(){ return COMPANIONS[this.data.profile.companion] || null; },

  logSession(practiceId, minutes, before, after) {
    this.data.sessions.push({ ts: Date.now(), practiceId, minutes, before, after });
    this.save();
  },

  logUrge(entry) {
    this.data.urges.push(Object.assign({ ts: Date.now() }, entry));
    this.save();
  },

  /* ---------- derived stats ---------- */

  minutesToday() {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    return this.data.sessions
      .filter(s => s.ts >= start.getTime())
      .reduce((sum, s) => sum + s.minutes, 0);
  },

  totalMinutes() {
    return this.data.sessions.reduce((sum, s) => sum + s.minutes, 0);
  },

  daysShownUp() {
    const days = new Set();
    this.data.sessions.forEach(s => days.add(new Date(s.ts).toDateString()));
    this.data.urges.forEach(u => days.add(new Date(u.ts).toDateString()));
    return days.size;
  },

  urgesSurfed() { return this.data.urges.length; },

  moneyRedirected() {
    return this.data.urges.reduce((sum, u) => sum + (u.avoided || 0), 0);
  },

  /* average tension drop across sessions that recorded both ends */
  avgRelease() {
    const pairs = this.data.sessions.filter(s => s.before != null && s.after != null);
    if (!pairs.length) return null;
    const total = pairs.reduce((sum, s) => sum + (s.before - s.after), 0);
    return total / pairs.length;
  },

  recentSessions(n) {
    return this.data.sessions.slice(-n);
  }
};
