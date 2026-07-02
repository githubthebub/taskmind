/* ============================================================
   ATTUNE — practice library

   Each practice is a somatic technique encoded so the sequencer
   can plan with it:

     effects : direction & strength of the shift it produces,
               per dimension, roughly -3 … +3
     min/max : sensible duration bounds in seconds
     phase   : which journey phases it can serve
     build(dur, ctx) : returns timed steps
                       { dur, text, breath? }
       breath = { inhale, holdIn, exhale, holdOut, label }
                seconds per phase; the pacer loops it for the
                step's duration.

   Language principles (this is the part practitioners care about):
   — invitational, never commanding ("you might…", "if it's
     comfortable…") — the nervous system doesn't settle on demand
   — orient before interoception; resource before challenge
   — titrate: touch the edge, then return to safe ground
   — normalize discharge (sighs, yawns, gurgles, trembling)
   — always offer an exit
   ============================================================ */

(() => {
  const P = {};
  Attune.PRACTICES = P;

  /* scale authored step durations to fill the requested time */
  const fill = (steps, dur) => {
    const total = steps.reduce((s, x) => s + x.dur, 0);
    const k = dur / total;
    return steps.map((s) => ({ ...s, dur: Math.max(4, Math.round(s.dur * k)) }));
  };

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  /* =========================================================
     ARRIVING — orienting & contact (always the first move)
     ========================================================= */

  P.orient = {
    id: "orient",
    name: "Orienting",
    phase: ["arrive"],
    effects: { energy: -1, ease: 1, ground: 2, clarity: 1 },
    min: 75, max: 240,
    build(dur) {
      return fill([
        { dur: 14, text: "Before anything inward — let's arrive in the room. Keep your eyes open for now." },
        { dur: 20, text: "Let your head turn slowly, and let your eyes drift wherever they want to go. No searching. Just looking." },
        { dur: 18, text: "When your eyes land on something — a color, an edge, a patch of light — let them rest there as long as they're interested." },
        { dur: 16, text: "This is what your nervous system does when it's checking that the environment is safe. You're letting it finish that check." },
        { dur: 18, text: "Notice one thing in the room you find even mildly pleasant to look at. Stay with it a few seconds longer than feels productive." },
        { dur: 14, text: "If a deeper breath or a sigh wants to happen on its own, let it. That's a good sign — nothing to manufacture." },
      ], dur);
    },
  };

  P.contact = {
    id: "contact",
    name: "Points of Contact",
    phase: ["arrive", "ground"],
    effects: { energy: -1, ease: 1, ground: 3, clarity: 0 },
    min: 90, max: 300,
    build(dur) {
      return fill([
        { dur: 14, text: "Now feel for everywhere your body is being held up — without changing anything yet." },
        { dur: 20, text: "The weight of you in the seat, or on the floor. Notice: you are not doing the work of holding yourself up right now." },
        { dur: 18, text: "Find your feet. The exact places they press into the ground. Weight through the heels, the outer edges, the toes." },
        { dur: 18, text: "Let the ground be slightly more trustworthy than it was a minute ago. Give it five percent more of your weight." },
        { dur: 18, text: "Notice the places where your body touches itself — hands resting, lips together. Small contacts count." },
        { dur: 14, text: "Being held up, without effort. Let that register somewhere below the neck." },
      ], dur);
    },
  };

  P.feetRoots = {
    id: "feetRoots",
    name: "Feet on the Ground",
    phase: ["arrive", "ground"],
    effects: { energy: 0, ease: 1, ground: 3, clarity: 1 },
    min: 90, max: 260,
    build(dur) {
      return fill([
        { dur: 14, text: "Bring all of your attention down to your feet. It may take a moment to find them." },
        { dur: 18, text: "Press them gently into the floor — about as hard as you'd press a hand into wet sand — and slowly release." },
        { dur: 18, text: "Again. Press… and release. Notice the muscles of your legs waking up and then letting go." },
        { dur: 18, text: "Now spread the toes a little, if they'll cooperate. Feel the whole footprint: heel, arch, ball, toes." },
        { dur: 16, text: "Imagine your exhale traveling down the body and out through the soles. Each breath, a little further down." },
        { dur: 14, text: "The ground has been there the whole time. Now you're standing on it from the inside." },
      ], dur);
    },
  };

  /* =========================================================
     DOWN-REGULATING BREATH
     ========================================================= */

  P.sigh = {
    id: "sigh",
    name: "Physiological Sighs",
    phase: ["regulate"],
    effects: { energy: -3, ease: 2, ground: 0, clarity: 1 },
    min: 75, max: 210,
    build(dur) {
      return fill([
        { dur: 16, text: "This next breath is the fastest brake the body has — the one it does by itself before crying stops or sleep comes." },
        { dur: 18, text: "Breathe in through the nose… and when you think you're full, sip in a little more on top. Then let it all fall out through the mouth, long and unforced." },
        { dur: 40, text: "Again, at your own pace. Big inhale… extra sip at the top… and a long, tumbling exhale. Two or three more rounds, no rush.",
          breath: { inhale: 3.2, holdIn: 1.2, exhale: 6.5, holdOut: 1.2, label: "sigh" } },
        { dur: 16, text: "Let the last exhale end without grabbing the next breath. Just wait until the body wants air again." },
        { dur: 12, text: "Notice anything that dropped — shoulders, eyes, the pace of your thoughts." },
      ], dur);
    },
  };

  P.longExhale = {
    id: "longExhale",
    name: "The Long Exhale",
    phase: ["regulate"],
    effects: { energy: -3, ease: 2, ground: 1, clarity: 0 },
    min: 150, max: 480,
    build(dur) {
      return fill([
        { dur: 14, text: "Every exhale is a small message of safety to the heart. We're going to lengthen that message." },
        { dur: 45, text: "Breathe in through the nose for about four counts… and out — through the nose or pursed lips — for about six. Let the circle carry you.",
          breath: { inhale: 4, holdIn: 0.5, exhale: 6, holdOut: 0.8, label: "settle" } },
        { dur: 60, text: "Now let the exhale grow a little longer — in for four… out for eight. If eight is too long, six is perfect. Never strain.",
          breath: { inhale: 4, holdIn: 0.5, exhale: 8, holdOut: 1, label: "lengthen" } },
        { dur: 45, text: "Stay here. With each exhale, imagine setting something down that you've been carrying — you can pick it up later if you need it.",
          breath: { inhale: 4, holdIn: 0.5, exhale: 8, holdOut: 1, label: "release" } },
        { dur: 16, text: "Let the breath return to its own rhythm now. Notice the pace your body chooses when you stop steering." },
      ], dur);
    },
  };

  P.coherent = {
    id: "coherent",
    name: "Coherent Breathing",
    phase: ["regulate", "deepen"],
    effects: { energy: -1, ease: 2, ground: 1, clarity: 2 },
    min: 180, max: 600,
    build(dur) {
      return fill([
        { dur: 14, text: "Now a breath that balances rather than brakes — about five breaths a minute, the rhythm where heart and breath synchronize." },
        { dur: 70, text: "In for five and a half… out for five and a half. Smooth at the turns, like a wheel, no edges.",
          breath: { inhale: 5.5, holdIn: 0, exhale: 5.5, holdOut: 0, label: "coherence" } },
        { dur: 70, text: "If counting is effortful, drop the numbers and just follow the circle. Let the breath become something you're riding, not rowing.",
          breath: { inhale: 5.5, holdIn: 0, exhale: 5.5, holdOut: 0, label: "coherence" } },
        { dur: 60, text: "Somewhere around now, the rhythm starts breathing you. Let it. Nothing else is required.",
          breath: { inhale: 5.5, holdIn: 0, exhale: 5.5, holdOut: 0, label: "coherence" } },
        { dur: 14, text: "Release the pattern. Feel the wake it leaves — a steadiness under the surface." },
      ], dur);
    },
  };

  P.box = {
    id: "box",
    name: "Box Breathing",
    phase: ["regulate", "deepen"],
    effects: { energy: -1, ease: 1, ground: 1, clarity: 3 },
    min: 150, max: 420,
    build(dur) {
      return fill([
        { dur: 14, text: "A breath with four equal sides — the one people use before things that matter. It builds composure, not just calm." },
        { dur: 60, text: "In for four… hold for four, soft in the shoulders… out for four… and rest empty for four.",
          breath: { inhale: 4, holdIn: 4, exhale: 4, holdOut: 4, label: "steady" } },
        { dur: 70, text: "The holds are where the training is. Not clenching the air — just standing calmly in the pause.",
          breath: { inhale: 4, holdIn: 4, exhale: 4, holdOut: 4, label: "steady" } },
        { dur: 14, text: "Let the box dissolve. Keep whatever composure it built." },
      ], dur);
    },
  };

  /* =========================================================
     UP-REGULATING — energizing, waking, charging
     ========================================================= */

  P.liftBreath = {
    id: "liftBreath",
    name: "The Rising Breath",
    phase: ["regulate", "deepen"],
    effects: { energy: 3, ease: 1, ground: 0, clarity: 2 },
    min: 90, max: 300,
    build(dur) {
      return fill([
        { dur: 14, text: "Now we borrow the accelerator — gently. Inhales lift energy the way exhales lower it." },
        { dur: 50, text: "Breathe in fully through the nose for a slow five… and let it out briskly, in about two. Filling the lungs like a sail.",
          breath: { inhale: 5, holdIn: 1, exhale: 2, holdOut: 0.5, label: "rise" } },
        { dur: 50, text: "As you inhale, let the spine lengthen and the chest widen — the posture and the breath lift each other.",
          breath: { inhale: 5, holdIn: 1, exhale: 2, holdOut: 0.5, label: "rise" } },
        { dur: 16, text: "If you feel lightheaded at any point, return to normal breathing — the effect still lands. Notice the hum this leaves in the arms and chest." },
      ], dur);
    },
  };

  P.shake = {
    id: "shake",
    name: "Shaking It Through",
    phase: ["deepen"],
    effects: { energy: 2, ease: 2, ground: 1, clarity: 1 },
    min: 100, max: 320,
    build(dur) {
      return fill([
        { dur: 16, text: "Animals tremble after stress to complete the cycle; humans learned to suppress it. Let's un-suppress it, on purpose. Stand up if you can." },
        { dur: 22, text: "Start with your hands — shake them out like you're flicking off water. Let the wrists be loose, even silly." },
        { dur: 22, text: "Let it travel up the arms into the shoulders. Add a gentle bounce through the knees, heels soft on the floor." },
        { dur: 24, text: "Let the whole body join at whatever size feels right — a shimmer or a full shake. Let the jaw unclench. Sound is allowed." },
        { dur: 16, text: "And… let it wind down on its own, like a bell fading. Don't stop it — let it stop." },
        { dur: 20, text: "Stand still. Close your eyes if that's comfortable. Feel the buzzing, streaming aliveness where the shaking was. That's discharge — the body finishing something." },
      ], dur);
    },
  };

  P.tapWake = {
    id: "tapWake",
    name: "Waking the Surface",
    phase: ["deepen", "ground"],
    effects: { energy: 2, ease: 1, ground: 2, clarity: 1 },
    min: 100, max: 300,
    build(dur) {
      return fill([
        { dur: 14, text: "We're going to wake the body's surface — the boundary where you end and the world begins." },
        { dur: 20, text: "With a loose fist or open palm, tap gently along your left arm — shoulder to hand, top and underside. Firm enough to feel, kind enough to enjoy." },
        { dur: 20, text: "Switch sides. Right arm, shoulder to fingertips. Notice the difference between the arm you've done and the one you haven't." },
        { dur: 20, text: "Tap across the chest — like a gentle drum — then down the sides of the ribs. A humming sound as you do this is surprisingly good." },
        { dur: 20, text: "Down the legs — thighs, calves — and if you can reach, the feet. You're drawing your own outline in sensation." },
        { dur: 16, text: "Stop. Feel the whole surface of you glowing faintly, like a switched-on map. That's you, all the way to the edges." },
      ], dur);
    },
  };

  P.reach = {
    id: "reach",
    name: "Expansion",
    phase: ["deepen", "integrate"],
    effects: { energy: 2, ease: 2, ground: 0, clarity: 1 },
    min: 80, max: 240,
    build(dur) {
      return fill([
        { dur: 14, text: "Contraction is the shape of stress. Expansion is the shape of its opposite. Let's take the shape and let the state follow." },
        { dur: 20, text: "Inhale and reach both arms up and slightly wide — take up more room than you usually allow. Look slightly upward." },
        { dur: 18, text: "Exhale and let the arms float down, keeping the width in the chest. The reach ends; the openness stays." },
        { dur: 20, text: "Again — reach, and this time let a real yawn come if it's anywhere nearby. Yawning is the nervous system changing gears." },
        { dur: 16, text: "One more, your way — a stretch the body actually wants. Slow, greedy, unhurried." },
        { dur: 12, text: "Settle. Notice you're sitting or standing a little larger than before." },
      ], dur);
    },
  };

  /* =========================================================
     SOUND — vagal toning
     ========================================================= */

  P.voo = {
    id: "voo",
    name: "The Low Voice",
    phase: ["regulate", "deepen"],
    effects: { energy: -2, ease: 2, ground: 2, clarity: 0 },
    min: 100, max: 300,
    build(dur) {
      return fill([
        { dur: 16, text: "The exhale can carry a sound that massages the nervous system from the inside — a low foghorn 'voo'. If sounding out loud isn't possible right now, hum quietly instead; it works the same way." },
        { dur: 20, text: "Breathe in… and on the exhale, sound a long, low 'voooooo' — pitched low enough that you feel it vibrate in the chest and belly." },
        { dur: 26, text: "Again. Send the vibration downward, into the belly. Let the sound be unbeautiful. This is plumbing, not performance." },
        { dur: 26, text: "Once more, and this time notice the pause after the sound ends — the stillness has a texture to it." },
        { dur: 16, text: "Rest and breathe normally. Feel the echo of the vibration — the body's interior, switched back on." },
      ], dur);
    },
  };

  /* =========================================================
     TOUCH — self-contact
     ========================================================= */

  P.selfHold = {
    id: "selfHold",
    name: "The Self-Hold",
    phase: ["regulate", "deepen", "integrate"],
    effects: { energy: -2, ease: 3, ground: 1, clarity: -1 },
    min: 120, max: 360,
    build(dur) {
      return fill([
        { dur: 16, text: "The nervous system settles fastest through touch — and your own hands count. This may feel tender. That's not a problem." },
        { dur: 20, text: "Place one hand flat over the center of your chest. Let it be heavy and warm. Just that, for a few breaths." },
        { dur: 22, text: "Now the other hand on your belly, or on your forehead — wherever it's drawn. You're holding two places at once; notice what happens between them." },
        { dur: 24, text: "Under your hand, a heart that has beaten every minute of your life without being asked. Let the hand say something kind to it. No words needed." },
        { dur: 20, text: "If emotion surfaces, it's welcome — it's just something that was waiting for enough safety to move. Keep breathing at whatever pace happens." },
        { dur: 16, text: "Slowly let the hands rest back down. The contact ends; what it started keeps going." },
      ], dur);
    },
  };

  /* =========================================================
     RELEASE — targeted unwinding, progressive release
     ========================================================= */

  P.unclench = {
    id: "unclench",
    name: "Unwinding the Held Places",
    phase: ["deepen"],
    effects: { energy: -1, ease: 3, ground: 1, clarity: 0 },
    min: 180, max: 600,
    build(dur, ctx) {
      const marks = ctx && ctx.marks ? ctx.marks : {};
      const tense = Object.keys(marks).filter((k) => marks[k] === "tension");
      const labelOf = (id) => {
        const r = Attune.BODY_REGIONS.find((x) => x.id === id);
        return r ? r.label : "that place";
      };
      const steps = [
        { dur: 16, text: "You marked where the body is holding. Held tension is a muscle doing a job nobody has told it is finished. We'll tell it." },
      ];
      const targets = tense.length ? tense.slice(0, 4) : ["jaw", "shoulderL", "belly"];
      for (const id of targets) {
        const label = labelOf(id);
        steps.push(
          { dur: 20, text: `Bring your attention to ${label}. Don't fix anything yet — first, feel exactly how it's holding. Map the shape of the effort.` },
          { dur: 18, text: `Now, on an inhale, tighten ${label} a little more — ten percent, on purpose. Hold it… and on a long exhale, let it melt past where it started.` },
          { dur: 16, text: `Once more, smaller: tighten a whisper… and release completely. Imagine warmth pooling where the effort was.` },
        );
      }
      steps.push(
        { dur: 16, text: "Sweep back through the places you visited. They may not be fully released — they don't need to be. The direction has changed, and the body will keep going on its own." },
      );
      return fill(steps, dur);
    },
  };

  P.pmrWave = {
    id: "pmrWave",
    name: "The Release Wave",
    phase: ["deepen"],
    effects: { energy: -2, ease: 3, ground: 2, clarity: -1 },
    min: 240, max: 720,
    build(dur) {
      return fill([
        { dur: 16, text: "A slow wave of tension and release, from the ground up. Each release teaches the body the difference between holding and resting." },
        { dur: 26, text: "Curl your toes and tense your feet on an inhale… hold… and release on a long exhale. Feel the feet go warm and heavy." },
        { dur: 26, text: "Tense the legs — calves, thighs — press them into being solid… and let go all at once, like cutting a string." },
        { dur: 26, text: "Squeeze the hands into fists, tense the arms… hold… and release. Let the arms be someone else's problem for a while." },
        { dur: 26, text: "Draw the shoulders up toward the ears — really let them hold — and drop them on the exhale. Twice, if the first one felt good." },
        { dur: 26, text: "Scrunch the face — jaw, eyes, forehead — hold… and let the whole face smooth out like water settling." },
        { dur: 24, text: "Now the whole body at once: gather everything, hold for three… and release everything everywhere. Lie in the wake of it." },
        { dur: 20, text: "Heavy, warm, done. Notice: this is what your body feels like when nothing in it is standing guard." },
      ], dur);
    },
  };

  /* =========================================================
     ATTENTION — pendulation, single-thread focus, eyes
     ========================================================= */

  P.pendulate = {
    id: "pendulate",
    name: "Pendulation",
    phase: ["deepen"],
    effects: { energy: -1, ease: 2, ground: 2, clarity: 1 },
    min: 240, max: 720,
    build(dur, ctx) {
      const marks = ctx && ctx.marks ? ctx.marks : {};
      const hard = Object.keys(marks).find((k) => marks[k] === "tension" || marks[k] === "numb");
      const hardLabel = hard
        ? (Attune.BODY_REGIONS.find((x) => x.id === hard) || {}).label || "the difficult place"
        : "wherever feels least comfortable right now";
      return fill([
        { dur: 18, text: "This is the practice at the center of somatic work: moving attention between what's okay and what isn't, so the body learns it can visit without staying." },
        { dur: 24, text: "First, find somewhere in your body that feels okay — or even just neutral. A hand, a foot, the breath in one nostril. This is your home base. Get to know it well." },
        { dur: 22, text: "Rest there. Notice its qualities: temperature, weight, texture. Let it become vivid. You can return here at any time — that's the whole deal." },
        { dur: 22, text: `Now, gently, let a corner of your attention drift toward ${hardLabel}. Not diving in — just approaching the shoreline. Notice it from a slight distance.` },
        { dur: 20, text: "Whatever you find — tightness, heat, nothing at all — just note it, the way you'd note weather. You don't have to fix it or understand it." },
        { dur: 20, text: "And now swing back home, to the place that's okay. Fully. Let the comfort be as real as the discomfort was." },
        { dur: 22, text: "One more slow swing: over to the edge… noticing… maybe it has changed slightly, maybe not… and back home again." },
        { dur: 20, text: "Rest at home base. This rhythm — touch and return, touch and return — is how the body digests what it couldn't swallow whole." },
      ], dur);
    },
  };

  P.singleThread = {
    id: "singleThread",
    name: "A Single Thread",
    phase: ["deepen"],
    effects: { energy: 0, ease: 1, ground: 1, clarity: 3 },
    min: 150, max: 480,
    build(dur) {
      return fill([
        { dur: 16, text: "Focus isn't forcing attention — it's letting it rest on one thing until it stops looking for others. We'll practice on the body's own signal." },
        { dur: 24, text: "Choose one stream of sensation: the breath crossing the nostrils, or the pulse wherever you can find it. One thread. Take a moment to locate it clearly." },
        { dur: 26, text: "Follow it. When the mind wanders — it will, that's the machinery working — just return to the thread without commentary. Each return is one repetition of the exercise." },
        { dur: 26, text: "See if you can catch finer detail: the temperature difference between in-breath and out-breath, the exact moment one becomes the other." },
        { dur: 20, text: "Notice: the field of attention has narrowed and brightened. This is trainable. You're training it right now." },
        { dur: 14, text: "Let the thread go. Keep the brightness." },
      ], dur);
    },
  };

  P.nearFar = {
    id: "nearFar",
    name: "Near and Far",
    phase: ["deepen", "integrate"],
    effects: { energy: 1, ease: 0, ground: 1, clarity: 3 },
    min: 80, max: 240,
    build(dur) {
      return fill([
        { dur: 14, text: "The eyes drive the brain's arousal more than almost anything. We'll use them like a dial. Keep them open for this." },
        { dur: 20, text: "Hold up a thumb at arm's length, or pick any near object. Focus on it completely — its texture, its edges — for a few breaths." },
        { dur: 20, text: "Now let your gaze jump to the farthest thing you can see — across the room, out a window. Let the eyes relax into the distance." },
        { dur: 20, text: "Alternate slowly: near… far… near… far. Feel the tiny muscular shift behind the eyes each time." },
        { dur: 16, text: "Finish wide: soften the gaze and take in the whole visual field at once — panoramic, no target. Alert, but not aimed. That's the state." },
      ], dur);
    },
  };

  /* =========================================================
     IMAGERY & RESOURCE
     ========================================================= */

  P.resource = {
    id: "resource",
    name: "The Resource",
    phase: ["deepen", "integrate"],
    effects: { energy: 0, ease: 3, ground: 1, clarity: 0 },
    min: 180, max: 480,
    build(dur) {
      return fill([
        { dur: 18, text: "Call to mind something that reliably feels good to remember — a place, a person, an animal, a moment. Not the biggest one. A dependable one." },
        { dur: 24, text: "Let it fill in: where are you in this memory? What does the light look like? What sounds belong to it?" },
        { dur: 24, text: "Now the important part — drop the picture for a moment and find what it does in your body. Warmth in the chest? A loosening in the face? Locate it." },
        { dur: 24, text: "Stay with the body-feeling and let it spread one size larger, like warmth soaking outward. The image can fade; the feeling is the resource." },
        { dur: 20, text: "Know that this is anchored in you — it travels with you. You just proved you can find it on purpose." },
      ], dur);
    },
  };

  P.warmCurrent = {
    id: "warmCurrent",
    name: "The Warm Current",
    phase: ["deepen", "integrate"],
    effects: { energy: -2, ease: 2, ground: 1, clarity: -2 },
    min: 150, max: 480,
    build(dur) {
      return fill([
        { dur: 16, text: "Imagery works because the body believes what attention describes to it slowly enough. Settle in; let the eyes close if they want to." },
        { dur: 24, text: "Imagine warmth beginning at the crown of your head — like sun through a window — and moving downward at the pace of honey." },
        { dur: 24, text: "It crosses the face, and the small muscles around the eyes and jaw let go without being asked. Down the neck, over the shoulders." },
        { dur: 24, text: "Down the arms to the fingertips — some people feel a real tingling here; either way is fine. Through the chest and belly, warming as it goes." },
        { dur: 24, text: "Down through the hips, the legs, and out through the feet into the ground — carrying with it whatever the day left behind." },
        { dur: 16, text: "Rest in the after-warmth. Nothing to hold up, nothing to track." },
      ], dur);
    },
  };

  /* =========================================================
     SLEEP-DIRECTION
     ========================================================= */

  P.descend = {
    id: "descend",
    name: "The Descending Scan",
    phase: ["deepen"],
    effects: { energy: -3, ease: 2, ground: 1, clarity: -3 },
    min: 240, max: 900,
    build(dur) {
      return fill([
        { dur: 18, text: "This scan moves downward, because down is where we're going. There's nothing to achieve now — drifting off-course is the course." },
        { dur: 26, text: "Start at the forehead. Let it be smooth. Let the space behind the eyes go dark and wide, like a theater after the film." },
        { dur: 26, text: "The jaw unhooks. The tongue rests heavy. The throat is soft — nothing left to say tonight." },
        { dur: 26, text: "The shoulders melt off the edges of you. The arms are lead-lined, sinking into whatever holds them." },
        { dur: 26, text: "The chest rises and falls on its own — you've been demoted from breathing, and the body is glad to take over." },
        { dur: 26, text: "The belly is slack. The hips give their weight away. You are being held, entirely, and can stop participating." },
        { dur: 26, text: "The legs are distant now, warm and vague. The feet — far away, at the border of somewhere else." },
        { dur: 20, text: "Whatever thoughts remain can circle without landing. Heavy… warm… dim. Let the edges blur." },
      ], dur);
    },
  };

  P.weightSink = {
    id: "weightSink",
    name: "Given to Gravity",
    phase: ["deepen", "integrate"],
    effects: { energy: -3, ease: 2, ground: 2, clarity: -2 },
    min: 150, max: 480,
    build(dur) {
      return fill([
        { dur: 16, text: "Gravity has been asking for you all day. This is where you say yes." },
        { dur: 24, text: "On each exhale, let one part of you get one notch heavier. Start with the hands — let them weigh what they actually weigh." },
        { dur: 24, text: "The arms next. Then the shoulders — imagine them being poured, like sand, down toward the elbows." },
        { dur: 24, text: "The head gives its weight to whatever supports it. The face slides half a millimeter down the skull." },
        { dur: 22, text: "The whole back of the body flattens and spreads. You are ten percent heavier than when we started, and it feels like honesty." },
        { dur: 16, text: "Sink. The planet can take it." },
      ], dur);
    },
  };

  /* =========================================================
     STILLNESS — spacious filler for long journeys
     ========================================================= */

  P.stillPoint = {
    id: "stillPoint",
    name: "Still Water",
    phase: ["deepen"],
    effects: { energy: -1, ease: 1, ground: 1, clarity: 1 },
    min: 120, max: 900,
    build(dur) {
      const steps = [
        { dur: 20, text: "Now — space. No instructions for a while. Just you, the breath, and the room. I'll stay nearby." },
      ];
      const quiet = [
        "Nothing to do. Nowhere else to be.",
        "If the mind produces thoughts, let them be weather passing through a large sky.",
        "Notice the body breathing itself.",
        "Still here. All is well.",
        "Let the eyes rest, open or closed.",
        "No effort. Just this.",
      ];
      const n = Math.max(2, Math.floor(dur / 75));
      for (let i = 0; i < n; i++) steps.push({ dur: 70, text: pick(quiet) });
      steps.push({ dur: 14, text: "Gently, let attention gather again. We continue." });
      return fill(steps, dur);
    },
  };

  /* =========================================================
     RESCUE — never planned; inserted when the traveler taps
     "too much". Straight back to orientation and ground.
     ========================================================= */

  P.rescue = {
    id: "rescue",
    name: "Solid Ground",
    phase: ["rescue"],
    effects: { energy: -1, ease: 1, ground: 3, clarity: 1 },
    min: 60, max: 180,
    build(dur) {
      return fill([
        { dur: 12, text: "Okay — stepping back. Nothing has gone wrong. Open your eyes if they were closed." },
        { dur: 16, text: "Look around the room, slowly. Find three things and silently name them. Just their names." },
        { dur: 14, text: "Press your feet into the floor. Feel the chair or the ground holding your weight. You're here." },
        { dur: 14, text: "This is you regulating in real time — noticing an edge and choosing ground. That's the skill, working." },
        { dur: 12, text: "Whenever you're ready — and only then — we'll continue, more gently." },
      ], dur);
    },
  };

  /* =========================================================
     INTEGRATION — always the final move
     ========================================================= */

  P.seal = {
    id: "seal",
    name: "Sealing the State",
    phase: ["integrate"],
    effects: { energy: 0, ease: 1, ground: 1, clarity: 1 },
    min: 80, max: 240,
    build(dur, ctx) {
      const desc = ctx && ctx.target ? Attune.describeVector(ctx.target) : "this state";
      return fill([
        { dur: 16, text: "Before you go back — pause. Take an honest inventory of how you are now, compared with when you arrived." },
        { dur: 20, text: `Find the strongest trace of feeling ${desc} in your body right now, and put your attention fully on it for a few breaths. States that get noticed get remembered.` },
        { dur: 18, text: "Take a snapshot: the posture, the breath rate, the temperature of this. This is a place, and you now know one route to it." },
        { dur: 16, text: "Let your eyes open fully and take in the room. Wiggle fingers and toes. Come all the way back — bringing it with you." },
        { dur: 12, text: "The session ends. The state doesn't have to." },
      ], dur);
    },
  };

  P.sealSleep = {
    id: "sealSleep",
    name: "Crossing Over",
    phase: ["integrate"],
    effects: { energy: -1, ease: 1, ground: 0, clarity: -2 },
    min: 60, max: 180,
    build(dur) {
      return fill([
        { dur: 20, text: "No coming back this time. When the voice stops, just stay where you are — heavy, warm, held." },
        { dur: 20, text: "The day is finished. It got what it got. The rest belongs to sleep now." },
        { dur: 16, text: "Goodnight. Drift." },
      ], dur);
    },
  };

  P.sealFocus = {
    id: "sealFocus",
    name: "Arming the Focus",
    phase: ["integrate"],
    effects: { energy: 1, ease: 0, ground: 1, clarity: 2 },
    min: 80, max: 200,
    build(dur) {
      return fill([
        { dur: 16, text: "Now aim this state. Sit or stand a little taller — alert, not braced. Eyes open." },
        { dur: 18, text: "Name — silently — the one thing you'll give this focus to first when the session ends. Just one. See yourself starting it." },
        { dur: 16, text: "Two quick full breaths, in through the nose, out with a little push. Feel the idle speed rise to ready." },
        { dur: 14, text: "Clear, grounded, aimed. Go begin." },
      ], dur);
    },
  };
})();
