/* =========================================================
   Haven — screens, onboarding, home, journey
   ========================================================= */

const App = {

  /* ---------- boot ---------- */
  init() {
    State.load();
    this._particles();
    document.getElementById('sosBtn').onclick = () => Surf.start();
    if (!State.profile.companion) this.onboard();
    else { this.applyTheme(); this.home(); }
  },

  timeOfDay() {
    const h = new Date().getHours();
    if (h < 5)  return 'night';
    if (h < 12) return 'morning';
    if (h < 18) return 'afternoon';
    if (h < 23) return 'evening';
    return 'night';
  },

  applyTheme() {
    const c = State.companion;
    if (!c) return;
    const r = document.documentElement.style;
    r.setProperty('--accent', c.accent);
    r.setProperty('--accent-soft', c.accentSoft);
    r.setProperty('--glow', c.glow);
    r.setProperty('--c1', c.palette[0]);
    r.setProperty('--c2', c.palette[1]);
    r.setProperty('--c3', c.palette[2]);
  },

  _particles() {
    const holder = document.getElementById('bgParticles');
    for (let i = 0; i < 18; i++) {
      const s = document.createElement('span');
      s.style.left = (Math.random() * 100) + 'vw';
      s.style.bottom = (Math.random() * -10) + 'vh';
      s.style.animationDuration = (14 + Math.random() * 22) + 's';
      s.style.animationDelay = (Math.random() * 20) + 's';
      s.style.width = s.style.height = (2 + Math.random() * 4) + 'px';
      holder.appendChild(s);
    }
  },

  /* Companion media: breathing video loop → local/hosted portrait → styled monogram.
     Videos carry their own motion, so the 'ambient' CSS breath animation is dropped. */
  portraitImg(c, cls) {
    if (c.videoRemote || c.video) {
      const vcls = cls.replace(/\bambient\b/, '').trim();
      return `<video class="${vcls}" autoplay muted loop playsinline disablepictureinpicture
        poster="${c.portrait}" data-id="${c.id}" data-cls="${cls}"
        onerror="App.videoFallback(this)">
        ${c.video ? `<source src="${c.video}" type="video/mp4">` : ''}
        ${c.videoRemote ? `<source src="${c.videoRemote}" type="video/mp4" onerror="App.videoFallback(this.parentNode)">` : ''}
      </video>`;
    }
    return this._imgTag(c.portrait, c.portraitRemote, c.name[0], cls);
  },

  _imgTag(src, remote, initial, cls) {
    return `<img class="${cls}" src="${src}" alt=""
      data-remote="${remote || ''}" data-initial="${initial}"
      onerror="App.portraitFallback(this)">`;
  },

  videoFallback(video) {
    if (!video || video.tagName !== 'VIDEO' || !video.isConnected) return;
    const c = COMPANIONS[video.dataset.id];
    const cls = video.dataset.cls || video.className;
    video.replaceWith(el(this._imgTag(c.portrait, c.portraitRemote, c.name[0], cls)));
  },

  portraitFallback(img) {
    if (img.dataset.remote) {
      const remote = img.dataset.remote;
      img.dataset.remote = '';
      img.src = remote;
      return;
    }
    const fb = el(`<div class="portrait-fallback ${img.className}">${img.dataset.initial || '·'}</div>`);
    img.replaceWith(fb);
  },

  /* ---------- onboarding ---------- */
  onboard() {
    const app = document.getElementById('app');
    document.getElementById('sosBtn').classList.add('hidden');
    app.innerHTML = '';

    const s1 = el(`
      <div class="screen stack" style="padding-top:6vh">
        <h1>You've seen the ads.<br><span class="accent">This is the antidote.</span></h1>
        <p class="dim">The apps with the beautiful faces are built to keep you paying and coming back —
        dopamine spikes, manufactured scarcity, affection by the token.</p>
        <p class="dim"><strong style="color:var(--ink)">Haven</strong> looks like them on purpose, and does the opposite.
        The companions here are trained on one job: downregulating your nervous system —
        longer exhales, lower cortisol, a quieter mind — and then telling you to log off.</p>
        <div class="notice">No account. No feed. No paywalled affection. Everything stays on this device.</div>
        <button class="btn wide">Start</button>
      </div>`);
    s1.querySelector('.btn').onclick = () => step2();
    app.appendChild(s1);

    const step2 = () => {
      app.innerHTML = '';
      const s2 = el(`
        <div class="screen stack">
          <h2>Where are you right now?</h2>
          <p class="dim">Honest answer — it only changes what we emphasize. Nobody sees this but you.</p>
          <div class="stack" data-opts></div>
        </div>`);
      const opts = [
        { id: 'deep',   label: 'In deep', body: 'Paying for OnlyFans / AI girlfriends / parasocial content and it doesn’t feel like a choice anymore.' },
        { id: 'edge',   label: 'On the edge', body: 'Not paying (much) yet, but the scrolling and the pull are getting louder.' },
        { id: 'tense',  label: 'Just wound up', body: 'Here for the nervous-system side: stress, tension, a mind that won’t shut up.' },
        { id: 'curious',label: 'Curious', body: 'Just want to see what a companion app with a conscience looks like.' }
      ];
      const holder = s2.querySelector('[data-opts]');
      opts.forEach(o => {
        const cardEl = el(`<div class="card click stack" style="gap:6px"><h3>${o.label}</h3><p class="dim" style="font-size:.94rem">${o.body}</p></div>`);
        cardEl.onclick = () => { State.profile.startPoint = o.id; State.save(); step3(o.id); };
        holder.appendChild(cardEl);
      });
      app.appendChild(s2);
    };

    const step3 = (startPoint) => {
      app.innerHTML = '';
      if (startPoint !== 'deep' && startPoint !== 'edge') { State.profile.monthlySpend = 0; State.save(); return step3b(); }
      let spend = 50;
      const s3 = el(`
        <div class="screen stack">
          <h2>What does it cost you a month?</h2>
          <p class="dim">Subscriptions, tips, tokens, "just this once." Rough guess. We’ll count what you keep.</p>
        </div>`);
      const cardEl = el(`
        <div class="card stack">
          <div class="spread"><h3>Monthly spend</h3><span class="accent" style="font-family:var(--serif);font-size:1.6rem" data-v>$50</span></div>
          <input type="range" min="0" max="500" step="10" value="50">
        </div>`);
      const input = cardEl.querySelector('input');
      const v = cardEl.querySelector('[data-v]');
      const paint = () => {
        spend = Number(input.value);
        v.textContent = spend >= 500 ? '$500+' : '$' + spend;
        input.style.setProperty('--fill', (spend / 500 * 100) + '%');
      };
      input.addEventListener('input', paint); paint();
      s3.appendChild(cardEl);
      const go = el('<button class="btn wide">Next</button>');
      go.onclick = () => { State.profile.monthlySpend = spend; State.save(); step3b(); };
      s3.appendChild(go);
      app.appendChild(s3);
    };

    const step3b = () => {
      app.innerHTML = '';
      const hasSpend = State.profile.monthlySpend > 0;
      const s = el(`
        <div class="screen stack">
          <h2>Two quick things</h2>
          <div class="card stack">
            <h3>What should we call you?</h3>
            <p class="faint">First name, nickname, alias — stays on this device like everything else.</p>
            <input type="text" data-name maxlength="24" placeholder="optional"
              style="background:var(--card);border:1px solid var(--card-edge);border-radius:14px;padding:14px 16px;color:var(--ink);font-size:1rem;outline:none">
          </div>
          ${hasSpend ? `
          <div class="card stack">
            <h3>What's that money actually for?</h3>
            <p class="faint">Every dollar you don't send her is a dollar toward something real. Name the something — concrete goals beat abstract savings, every time.</p>
            <input type="text" data-goal maxlength="40" placeholder="e.g. Japan trip, a good bike, moving out"
              style="background:var(--card);border:1px solid var(--card-edge);border-radius:14px;padding:14px 16px;color:var(--ink);font-size:1rem;outline:none">
            <div class="spread"><span class="dim">It costs about</span><span class="accent" style="font-family:var(--serif);font-size:1.4rem" data-gv>$1,000</span></div>
            <input type="range" data-gamt min="100" max="5000" step="100" value="1000">
          </div>` : ''}
          <button class="btn wide">Next</button>
        </div>`);
      const gamt = s.querySelector('[data-gamt]');
      if (gamt) {
        const gv = s.querySelector('[data-gv]');
        const paint = () => {
          gv.textContent = '$' + Number(gamt.value).toLocaleString();
          gamt.style.setProperty('--fill', ((gamt.value - 100) / 4900 * 100) + '%');
        };
        gamt.addEventListener('input', paint); paint();
      }
      s.querySelector('.btn').onclick = () => {
        State.profile.name = (s.querySelector('[data-name]').value || '').trim();
        const goalEl = s.querySelector('[data-goal]');
        if (goalEl) {
          State.profile.goalName = goalEl.value.trim();
          State.profile.goalAmount = Number(gamt.value);
        }
        State.save();
        step4();
      };
      app.appendChild(s);
    };

    const step4 = () => {
      app.innerHTML = '';
      const s4 = el(`
        <div class="screen stack">
          <h2>Choose your companion</h2>
          <p class="dim">All three know the same practices. Pick the voice you'll actually listen to. You can switch anytime.</p>
          <div class="stack" data-list></div>
        </div>`);
      const list = s4.querySelector('[data-list]');
      Object.values(COMPANIONS).forEach(c => {
        const cardEl = el(`
          <div class="card click row" style="align-items:flex-start">
            ${this.portraitImg(c, 'portrait-sm')}
            <div class="stack" style="gap:6px; flex:1">
              <div class="row" style="gap:10px"><h3>${c.name}</h3><span class="faint">${c.role}</span></div>
              <p class="dim" style="font-size:.93rem">${c.bio}</p>
              <button class="linklike" data-hear style="align-self:flex-start; padding-left:0">&#9654; hear ${c.name}'s voice</button>
            </div>
          </div>`);
        cardEl.querySelector('[data-hear]').onclick = e => {
          e.stopPropagation();
          speak(WELCOME_LINES[c.id], c.id);
        };
        cardEl.onclick = () => {
          State.profile.companion = c.id;
          State.save();
          this.applyTheme();
          this._welcome(c);
        };
        list.appendChild(cardEl);
      });
      app.appendChild(s4);
    };
  },

  _welcome(c) {
    const app = document.getElementById('app');
    app.innerHTML = '';
    const line = pick(WELCOME_LINES);
    const w = el(`
      <div class="screen stack" style="text-align:center; align-items:center; padding-top:4vh">
        <div class="portrait-wrap">
          <div class="portrait-glow" style="--breath:.4"></div>
          ${this.portraitImg(c, 'portrait ambient')}
        </div>
        <div class="bubble" style="width:100%" data-b></div>
        <button class="btn wide">Take the first breath</button>
      </div>`);
    app.appendChild(w);
    typewrite(w.querySelector('[data-b]'), line, 32, null);
    speak(line);
    w.querySelector('.btn').onclick = () => Session.start(PRACTICES[0]);
  },

  /* ---------- home ---------- */
  home() {
    const c = State.companion;
    if (!c) return this.onboard();
    stopSpeech();
    Ambient.stop();
    Wake.off();
    this.applyTheme();
    const app = document.getElementById('app');
    document.getElementById('sosBtn').classList.remove('hidden');
    app.innerHTML = '';

    const minsToday = State.minutesToday();
    const overCap = minsToday >= DAILY_SOFT_CAP_MIN;

    /* milestone greetings: the companion notices you coming back */
    let greeting = overCap ? pick(CAP_LINES) : pick(c.greetings[this.timeOfDay()]);
    if (!overCap) {
      const days = State.daysShownUp();
      if (MILESTONE_LINES[days] && (State.profile.lastMilestone || 0) < days) {
        greeting = pick(MILESTONE_LINES[days]);
        State.profile.lastMilestone = days;
        State.save();
      }
    }

    const name = State.profile.name;
    const home = el(`
      <div class="screen stack">
        <div class="topbar">
          <span class="brand">ha<em>v</em>en${name ? ` <span class="faint" style="font-size:.8rem">· ${name}</span>` : ''}</span>
          <span class="row" style="gap:14px">
            <button class="linklike" data-nav="roster">companions</button>
            <button class="linklike" data-nav="journey">journey</button>
            <button class="linklike" data-nav="why">why</button>
          </span>
        </div>
        <div class="row" style="align-items:flex-start; gap:16px">
          <div class="portrait-wrap" style="width:112px; margin:0; flex-shrink:0">
            <div class="portrait-glow" style="--breath:.3"></div>
            ${this.portraitImg(c, 'portrait ambient')}
          </div>
          <div class="stack" style="gap:10px; flex:1">
            <h2 style="font-size:1.2rem">${c.name}</h2>
            <div class="bubble" style="font-size:.98rem; padding:14px 16px" data-greet></div>
          </div>
        </div>
        ${overCap ? '<div class="notice">Soft cap reached — ' + minsToday + ' min today. Practices still work, but ' + c.name + ' would rather you take the calm outside.</div>' : ''}
        <div class="stack" data-practices style="gap:10px"></div>
        <div class="faint" style="text-align:center; padding-top:8px">
          Feeling the pull toward the old stuff? The button below is the whole reason this app exists.
        </div>
      </div>`);

    typewrite(home.querySelector('[data-greet]'), greeting, 26, null);
    home.querySelectorAll('[data-nav]').forEach(b => {
      b.onclick = () => {
        if (b.dataset.nav === 'journey') this.journey();
        else if (b.dataset.nav === 'why') this.why();
        else this.roster();
      };
    });

    /* grouped catalog; the night section leads late in the evening */
    let groups = [
      ['now', 'Right now · under five minutes'],
      ['unwind', 'Unwind'],
      ['deep', 'Go deeper'],
      ['night', 'For the night']
    ];
    const h = new Date().getHours();
    if (h >= 21 || h < 5) groups = [groups[3], groups[0], groups[1], groups[2]];

    const list = home.querySelector('[data-practices]');
    groups.forEach(([gid, glabel]) => {
      const items = PRACTICES.filter(p => (p.group || 'unwind') === gid);
      if (!items.length) return;
      list.appendChild(el(`<h3 class="dim" style="margin-top:10px; font-size:.95rem">${glabel}</h3>`));
      items.forEach(p => {
        const champ = p.champion && COMPANIONS[p.champion];
        const item = el(`
          <div class="card click spread">
            <div>
              <h3>${p.title}</h3>
              <div class="faint">${p.subtitle}${champ ? ` · <span style="color:${champ.accent}">${champ.name}'s</span>` : ''}</div>
            </div>
            <span class="accent" style="font-size:1.4rem">›</span>
          </div>`);
        item.onclick = () => Session.start(p);
        list.appendChild(item);
      });
    });

    app.appendChild(home);
  },

  /* ---------- companion roster (switch anytime) ---------- */
  roster() {
    const app = document.getElementById('app');
    app.innerHTML = '';
    const r = el(`
      <div class="screen stack">
        <div class="topbar">
          <button class="linklike" data-back>‹ back</button>
          <span class="brand">companions</span>
        </div>
        <p class="dim">Five voices, one job: getting your nervous system back. Each has a specialty — and all of them will tell you to log off.</p>
        <div class="stack" data-list></div>
      </div>`);
    r.querySelector('[data-back]').onclick = () => this.home();
    const list = r.querySelector('[data-list]');
    Object.values(COMPANIONS).forEach(c => {
      const current = State.profile.companion === c.id;
      const owned = PRACTICES.filter(p => p.champion === c.id).map(p => p.title).join(' · ');
      const cardEl = el(`
        <div class="card click row" style="align-items:flex-start; ${current ? `border-color:${c.accent}` : ''}">
          ${this.portraitImg(c, 'portrait-sm')}
          <div class="stack" style="gap:6px; flex:1">
            <div class="row" style="gap:10px"><h3>${c.name}</h3><span class="faint">${c.role}</span>${current ? '<span class="faint">· current</span>' : ''}</div>
            <p class="dim" style="font-size:.93rem">${c.bio}</p>
            ${owned ? `<p class="faint">Specialty: ${owned}</p>` : ''}
            <button class="linklike" data-hear style="align-self:flex-start; padding-left:0">&#9654; hear ${c.name}'s voice</button>
          </div>
        </div>`);
      cardEl.querySelector('[data-hear]').onclick = e => {
        e.stopPropagation();
        speak(WELCOME_LINES[c.id], c.id);
      };
      cardEl.onclick = () => {
        State.profile.companion = c.id;
        State.save();
        stopSpeech();
        this.home();
      };
      list.appendChild(cardEl);
    });
    app.appendChild(r);
  },

  /* ---------- journey / dashboard ---------- */
  journey() {
    const app = document.getElementById('app');
    document.getElementById('sosBtn').classList.remove('hidden');
    app.innerHTML = '';

    const rel = State.avgRelease();
    const monthly = State.profile.monthlySpend;
    const redirected = State.moneyRedirected();
    const goalName = State.profile.goalName;
    const goalAmount = State.profile.goalAmount || 0;
    const goalPct = goalAmount ? Math.min(100, redirected / goalAmount * 100) : 0;
    const name = State.profile.name;
    const j = el(`
      <div class="screen stack">
        <div class="topbar">
          <button class="linklike" data-back>‹ back</button>
          <span class="brand">${name ? name + "'s" : 'your'} journey</span>
        </div>
        <div class="stat-grid">
          <div class="stat"><div class="num">${State.totalMinutes()}</div><div class="lbl">minutes regulated</div></div>
          <div class="stat"><div class="num">${State.urgesSurfed()}</div><div class="lbl">waves surfed</div></div>
          <div class="stat"><div class="num">${fmtMoney(redirected)}</div><div class="lbl">redirected to real life</div></div>
          <div class="stat"><div class="num">${State.daysShownUp()}</div><div class="lbl">days you showed up</div></div>
        </div>
        <p class="faint" style="text-align:center; margin-top:-6px">Every day and every wave is a vote for the person you're becoming.</p>
        ${rel != null ? `<div class="notice">On average, a session drops your tension by <strong>${rel.toFixed(1)} points</strong>. Your nervous system is learning the way down.</div>` : ''}
        ${goalName && goalAmount ? `
        <div class="card stack" style="gap:10px">
          <div class="spread"><h3>${goalName}</h3><span class="accent" style="font-family:var(--serif)">${fmtMoney(redirected)} / ${fmtMoney(goalAmount)}</span></div>
          <div style="height:8px;border-radius:4px;background:rgba(255,255,255,.1);overflow:hidden">
            <div style="height:100%;width:${goalPct}%;background:var(--accent);border-radius:4px;transition:width 1s ease"></div>
          </div>
          <p class="faint">Funded entirely by waves you didn't obey. The other apps call this churn; you can call it ${goalPct >= 100 ? 'done — go book it' : Math.round(goalPct) + '% of the way there'}.</p>
        </div>` : ''}
        ${monthly > 0 ? `<div class="card"><h3>The old cost</h3><p class="dim" style="font-size:.95rem;margin-top:6px">You said the old habit ran about <strong style="color:var(--accent)">${fmtMoney(monthly)}/month</strong> — ${fmtMoney(monthly * 12)} a year. That's ${Math.max(1, Math.round(monthly * 12 / 45))} good dinners out, ${Math.max(1, Math.round(monthly * 12 / 55))} months of a gym, or ${(monthly * 12 / 450).toFixed(1)} flights somewhere warm — every year, forever.</p></div>` : ''}
        <div class="card stack" data-chart-card>
          <h3>Tension: walked in → walked out</h3>
          <p class="faint">Each pair is one session. Left bar before, right bar after.</p>
          <div class="bars" data-chart></div>
        </div>
        <div class="card stack">
          <h3>Our promises</h3>
          <div class="stack" data-promises style="gap:12px"></div>
        </div>
        <div class="card stack">
          <h3>If it's bigger than an app</h3>
          <p class="dim" style="font-size:.93rem">If spending or porn use feels genuinely out of control, that's not a willpower failure — it's a loop that deserves real support. SMART Recovery (smartrecovery.org) and Sex Addicts Anonymous (saa-recovery.org) are free and anonymous. Haven is a tool, not treatment.</p>
        </div>
        <button class="linklike" data-reset style="align-self:center">start over (erases everything)</button>
      </div>`);

    j.querySelector('[data-back]').onclick = () => this.home();
    j.querySelector('[data-reset]').onclick = () => {
      if (confirm('Erase all local data and start over?')) { State.reset(); location.reload(); }
    };

    const chart = j.querySelector('[data-chart]');
    const recent = State.recentSessions(7).filter(s => s.before != null && s.after != null);
    if (!recent.length) {
      j.querySelector('[data-chart-card]').innerHTML =
        '<h3>Tension: walked in → walked out</h3><p class="faint" style="margin-top:6px">Finish a practice and your before/after will show here.</p>';
    } else {
      recent.forEach(s => {
        const b = el(`<div class="bar neg" style="height:${Math.max(6, s.before / 10 * 100)}%"></div>`);
        const a = el(`<div class="bar" style="height:${Math.max(6, s.after / 10 * 100)}%; margin-right:6px"></div>`);
        chart.appendChild(b); chart.appendChild(a);
      });
    }

    const ph = j.querySelector('[data-promises]');
    PROMISES.forEach(p => {
      ph.appendChild(el(`<div><strong style="font-size:.95rem">${p.title}</strong><p class="dim" style="font-size:.9rem">${p.body}</p></div>`));
    });

    app.appendChild(j);
  },

  /* ---------- why this works ---------- */
  why() {
    const app = document.getElementById('app');
    app.innerHTML = '';
    const w = el(`
      <div class="screen stack">
        <div class="topbar">
          <button class="linklike" data-back>‹ back</button>
          <span class="brand">why this works</span>
        </div>
        <p class="dim">No magic, no woo — the practices here are the boring, replicated parts of stress physiology. The honest version:</p>
        <div class="stack" data-sci></div>
        <div class="card stack">
          <h3>The alchemy, disclosed</h3>
          <p class="dim" style="font-size:.93rem">The apps we're replacing run sophisticated psychology on you without telling you. We run some too — here's the complete list, because a trick you can see is a tool, and one you can't is a leash:</p>
          <div class="stack" style="gap:10px" data-tricks></div>
          <p class="faint">Frames borrowed shamelessly from Rory Sutherland (meaning changes the medicine), James Clear (identity votes), BJ Fogg (anchor moments), and the relapse-prevention literature. All of it aimed at the door, not the feed.</p>
        </div>
        <div class="notice">Haven is a self-regulation tool, not medical or psychological care. If you're struggling, a real human professional beats any app — including this one.</div>
      </div>`);
    const tricks = [
      ['Story frames', 'Pilot’s sigh, emperor’s triage, monk’s hum. Same physiology, better clothes — a practice with a story gets done twice as often.'],
      ['Variable warmth', 'You never know which closing line you’ll get. That’s the slot-machine mechanic every feed uses — ours pays out in sentences and ends the session.'],
      ['Being noticed', 'The companions mark your day 2, 3, 7, 14, 30. Feeling seen is the product the other apps sell; here it’s free and it wants you gone.'],
      ['Concrete money', '"$40 saved" is noise; "12% of the Japan trip" is a plan. Vivid beats abstract, so we make your redirected money vivid.'],
      ['Identity votes', 'Stats are framed as votes for who you’re becoming, not scores to protect. Scores create fear of loss; identity creates direction.'],
      ['A cast, not a catalog', 'Specialists (the night voice, the morning one) make the same six techniques feel like a world. Positioning is free; content is expensive.']
    ];
    const th = w.querySelector('[data-tricks]');
    tricks.forEach(([t, b]) => th.appendChild(el(`<div><strong style="font-size:.95rem">${t}.</strong> <span class="dim" style="font-size:.9rem">${b}</span></div>`)));
    w.querySelector('[data-back]').onclick = () => this.home();
    const holder = w.querySelector('[data-sci]');
    SCIENCE.forEach(s => {
      holder.appendChild(el(`<div class="card stack" style="gap:8px"><h3>${s.title}</h3><p class="dim" style="font-size:.94rem">${s.body}</p></div>`));
    });
    app.appendChild(w);
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
