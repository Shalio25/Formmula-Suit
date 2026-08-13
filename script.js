/* ==========================================================================
   LIGHTS OUT — F1 Suit Race
   Vanilla JS — mendukung mode LOCAL (1 device pass & play)
   dan mode ONLINE (Firebase Realtime Database, kode room)
   ========================================================================== */
(function () {
  "use strict";

  const MAX_LAPS = 3;

  const COLORS = [
    { name: "Red Bull Navy", value: "#1b2a4a" },
    { name: "Ferrari Rosso", value: "#dc0000" },
    { name: "McLaren Papaya", value: "#ff8000" },
    { name: "Mercedes Petrol", value: "#00d2be" },
    { name: "Alpine Blue", value: "#2173b8" },
    { name: "Aston Green", value: "#00594f" },
    { name: "Williams Sky", value: "#00a3e0" },
    { name: "Haas White", value: "#e6e6e6" },
  ];

  const TIRES = [
    { key: "soft", label: "Soft", color: "#e10600" },
    { key: "medium", label: "Medium", color: "#ffd400" },
    { key: "hard", label: "Hard", color: "#f4f4f2" },
    { key: "intermediate", label: "Inter", color: "#00d66b" },
    { key: "wet", label: "Wet", color: "#2a6df5" },
  ];

  const WINGS = [
    { key: "standard", label: "Standard" },
    { key: "aggressive", label: "Aggressive" },
    { key: "aero", label: "Full Aero" },
  ];

  const STICKERS = [
    { key: "none", label: "Polos" },
    { key: "number", label: "Nomor Balap" },
    { key: "flames", label: "Flame" },
    { key: "stars", label: "Bintang" },
    { key: "stripes", label: "Garis Racing" },
    { key: "bolt", label: "Petir" },
  ];

  const LIVERIES = [
    { key: "default", label: "SVG Klasik", src: null },
    { key: "custom1", label: "Livery Toro Rosso", src: "assets/car-custom-1.png" },
    { key: "custom2", label: "Livery Sikkxx Sempenah", src: "assets/car-custom-2.png" },
  ];

  function defaultPlayer(defaultColor) {
    return {
      name: "",
      promise: "",
      color: defaultColor,
      tire: "soft",
      wing: "standard",
      sticker: "none",
      livery: "default",
      confirmed: false,
      promiseSubmitted: false,
      laps: 0,
      connected: true,
    };
  }

  const state = {
    mode: null,              // 'local' | 'online'
    myPlayer: 1,              // hanya relevan saat online
    roomCode: null,
    roomRef: null,
    lastStatus: null,
    resolvingRound: false,
    finishNavigated: false,
    finishTimeoutId: null,

    players: {
      1: defaultPlayer(COLORS[1].value),
      2: defaultPlayer(COLORS[3].value),
    },
    garageTurn: 1,
    round: 1,
    raceTurn: 1,
    choices: { 1: null, 2: null },
  };

  /* ---------------------------------------------------------------------
     DOM SHORTCUTS
     --------------------------------------------------------------------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function showScreen(id) {
    $$(".screen").forEach((s) => s.classList.remove("active"));
    $(`#${id}`).classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showWaiting(title, copy) {
    $("#waiting-title").textContent = title;
    $("#waiting-copy").textContent = copy || "";
    $("#waiting-panel").classList.remove("hidden");
  }
  function hideWaiting() {
    $("#waiting-panel").classList.add("hidden");
  }

  /* ---------------------------------------------------------------------
     CAR SVG FACTORY (dengan stiker)
     --------------------------------------------------------------------- */
  function wingMarkup(style) {
    if (style === "aggressive") {
      return `<path d="M4 60 L34 54 L34 66 L4 72 Z" fill="#111"/>
              <path d="M8 50 L20 47 L20 58 L8 60 Z" fill="var(--c-yellow)"/>
              <path d="M8 68 L20 66 L20 77 L8 80 Z" fill="var(--c-yellow)"/>`;
    }
    if (style === "aero") {
      return `<path d="M2 60 L34 55 L34 65 L2 70 Z" fill="#111"/>
              <rect x="6" y="56" width="26" height="3" fill="var(--c-yellow)"/>
              <rect x="6" y="70" width="26" height="3" fill="var(--c-yellow)"/>
              <path d="M0 63 L10 60 L10 67 L0 70 Z" fill="var(--c-red)"/>`;
    }
    return `<path d="M6 58 L34 55 L34 68 L6 71 Z" fill="#111"/>`;
  }

  function stickerMarkup(key) {
    switch (key) {
      case "number":
        return `<circle cx="192" cy="60" r="15" fill="#fff"/>
                <text x="192" y="66" font-family="Orbitron, Arial, sans-serif" font-size="18" font-weight="900" fill="#111" text-anchor="middle">7</text>`;
      case "flames":
        return `<path d="M168 50c4-6 2-12-2-16 2 6-2 8-4 12-2-4-4-4-4-8-4 6-4 12 0 16 2 3 6 3 10 -4z" fill="var(--c-yellow)"/>
                <path d="M178 52c3-5 1-10-2-13 1 5-2 7-3 10-2-3-3-3-3-6-3 5-3 10 0 13 2 2 5 2 8 -4z" fill="var(--c-red)"/>`;
      case "stars":
        return `<g fill="#fff">
                <path d="M180 44l2 5 5 .5-4 3 1 5-4-3-4 3 1-5-4-3 5-.5z"/>
                <path d="M198 52l1.5 4 4 .4-3 2.4 1 4-3.5-2.4-3.5 2.4 1-4-3-2.4 4-.4z"/>
                <path d="M188 62l1.5 4 4 .4-3 2.4 1 4-3.5-2.4-3.5 2.4 1-4-3-2.4 4-.4z"/>
                </g>`;
      case "stripes":
        return `<path d="M170 40 L178 40 L166 76 L158 76 Z" fill="#fff"/>
                <path d="M184 40 L192 40 L180 76 L172 76 Z" fill="var(--c-yellow)"/>`;
      case "bolt":
        return `<path d="M196 38 L180 60 L190 60 L182 78 L204 54 L192 54 Z" fill="var(--c-yellow)" stroke="#111" stroke-width="1.5"/>`;
      default:
        return "";
    }
  }

  function carSVG(playerState, facing = "right") {
    const c = playerState.color;
    const tireColor = TIRES.find((t) => t.key === playerState.tire).color;
    const flip = facing === "left" ? ` transform="scale(-1,1) translate(-320,0)"` : "";
    return `
    <svg viewBox="0 0 320 130" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mobil F1">
      <g${flip}>
        ${wingMarkup(playerState.wing)}
        <path d="M34 66 C34 60 46 56 60 56 L120 52 C132 40 150 34 176 34 L214 34 C232 34 248 44 258 58 L288 62 C300 64 306 70 306 78 L306 84 C306 90 300 94 292 94 L44 94 C38 94 34 90 34 84 Z" fill="${c}"/>
        <path d="M150 40 L214 40 C226 40 236 46 244 56 L152 56 Z" fill="#111" opacity="0.85"/>
        <rect x="176" y="30" width="40" height="8" rx="2" fill="${c}"/>
        <rect x="285" y="55" width="16" height="8" fill="var(--c-red)"/>
        ${stickerMarkup(playerState.sticker)}
        <circle cx="78" cy="96" r="20" fill="#111"/>
        <circle cx="78" cy="96" r="9" fill="${tireColor}"/>
        <circle cx="256" cy="96" r="20" fill="#111"/>
        <circle cx="256" cy="96" r="9" fill="${tireColor}"/>
        <rect x="120" y="60" width="46" height="16" rx="6" fill="#0b0d10"/>
      </g>
    </svg>`;
  }

  // Pilih render mobil: livery custom (gambar) kalau dipilih, kalau tidak fallback ke SVG klasik
  function carMarkup(playerState, facing = "right") {
    const livery = LIVERIES.find((l) => l.key === playerState.livery);
    if (livery && livery.src) {
      const flip = facing === "left" ? "scaleX(-1)" : "scaleX(1)";
      return `<img src="${livery.src}" alt="Livery custom" class="custom-car-img" style="transform:${flip};" />`;
    }
    return carSVG(playerState, facing);
  }

  const RPS_LABEL = { rock: "Batu", paper: "Kertas", scissors: "Gunting" };
  const RPS_ICON = {
    rock: `<svg viewBox="0 0 64 64"><path d="M14 34c0-4 3-7 6-8l2-8c1-4 5-6 8-4 2-4 8-4 9 1 4-2 8 1 8 5l3 2c4 2 6 7 5 11l-3 12c-2 6-7 9-13 9H27c-6 0-11-4-12-10z" fill="currentColor"/></svg>`,
    paper: `<svg viewBox="0 0 64 64"><rect x="16" y="10" width="32" height="44" rx="4" fill="currentColor"/></svg>`,
    scissors: `<svg viewBox="0 0 64 64"><circle cx="20" cy="18" r="7" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="20" cy="46" r="7" fill="none" stroke="currentColor" stroke-width="4"/><path d="M26 22L50 50M26 42L50 14" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>`,
  };

  function decideWinner(c1, c2) {
    if (c1 === c2) return 0;
    const beats = { rock: "scissors", paper: "rock", scissors: "paper" };
    return beats[c1] === c2 ? 1 : 2;
  }

  /* =========================================================================
     FASE 0 — MODE SELECT
     ========================================================================= */
  $("#mode-local").addEventListener("click", () => {
    state.mode = "local";
    state.myPlayer = 1;
    resetPlayers();
    setPromiseUIForMode();
    showScreen("screen-start");
  });

  $("#mode-online").addEventListener("click", () => {
    if (typeof firebaseReady !== "undefined" && !firebaseReady) {
      $("#lobby-error").textContent =
        "Firebase belum dikonfigurasi. Buka firebase-config.js dan isi FIREBASE_CONFIG dengan project Firebase kamu sendiri (lihat README.md).";
      $("#lobby-error").classList.remove("hidden");
    } else {
      $("#lobby-error").classList.add("hidden");
    }
    state.mode = "online";
    showScreen("screen-lobby");
  });

  $("#btn-lobby-back").addEventListener("click", () => {
    if (state.roomRef) {
      state.roomRef.off();
      state.roomRef = null;
    }
    showScreen("screen-mode");
  });

  function resetPlayers() {
    state.players[1] = defaultPlayer(COLORS[1].value);
    state.players[2] = defaultPlayer(COLORS[3].value);
    state.round = 1;
    state.garageTurn = 1;
    state.raceTurn = 1;
    state.choices = { 1: null, 2: null };
  }

  /* =========================================================================
     FASE 0b — LOBBY (ONLINE)
     ========================================================================= */
  function generateRoomCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // tanpa karakter yg gampang ketuker
    let code = "";
    for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  }

  $("#btn-create-room").addEventListener("click", () => {
    if (!db) {
      $("#lobby-error").textContent = "Firebase belum siap. Cek firebase-config.js dulu.";
      $("#lobby-error").classList.remove("hidden");
      return;
    }
    const code = generateRoomCode();
    state.roomCode = code;
    state.myPlayer = 1;
    resetPlayers();

    const roomData = {
      status: "waiting",
      createdAt: firebase.database.ServerValue.TIMESTAMP,
      race: { round: 1, picks: {}, resolved: {}, acks: {} },
      players: {
        1: defaultPlayer(COLORS[1].value),
        2: null,
      },
    };

    db.ref("rooms/" + code)
      .set(roomData)
      .then(() => {
        $("#lobby-grid").classList.add("hidden");
        $("#lobby-status").classList.remove("hidden");
        $("#lobby-room-code").textContent = code;
        attachRoomListener(code);
      })
      .catch((err) => {
        $("#lobby-error").textContent = "Gagal membuat room: " + err.message;
        $("#lobby-error").classList.remove("hidden");
      });
  });

  $("#join-code-input").addEventListener("input", (e) => {
    e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  });

  $("#btn-join-room").addEventListener("click", () => {
    if (!db) {
      $("#lobby-error").textContent = "Firebase belum siap. Cek firebase-config.js dulu.";
      $("#lobby-error").classList.remove("hidden");
      return;
    }
    const code = $("#join-code-input").value.trim().toUpperCase();
    if (code.length < 4) {
      $("#lobby-error").textContent = "Masukkan kode room yang valid.";
      $("#lobby-error").classList.remove("hidden");
      return;
    }
    const ref = db.ref("rooms/" + code);
    ref
      .once("value")
      .then((snap) => {
        const val = snap.val();
        if (!val) {
          $("#lobby-error").textContent = "Kode room tidak ditemukan. Cek lagi kodenya.";
          $("#lobby-error").classList.remove("hidden");
          return;
        }
        if (val.players && val.players[2]) {
          $("#lobby-error").textContent = "Room ini sudah penuh (2 pemain).";
          $("#lobby-error").classList.remove("hidden");
          return;
        }
        state.roomCode = code;
        state.myPlayer = 2;
        resetPlayers();
        $("#lobby-error").classList.add("hidden");
        return ref.child("players/2").set(defaultPlayer(COLORS[3].value));
      })
      .then(() => {
        if (!state.roomCode) return; // dihentikan di atas
        $("#lobby-grid").classList.add("hidden");
        $("#lobby-status").classList.remove("hidden");
        $("#lobby-room-code").textContent = state.roomCode;
        $("#lobby-status .tagline").textContent = "Terhubung! Menunggu host memulai balapan...";
        attachRoomListener(state.roomCode);
      })
      .catch((err) => {
        $("#lobby-error").textContent = "Gagal gabung room: " + err.message;
        $("#lobby-error").classList.remove("hidden");
      });
  });

  function attachRoomListener(code) {
    state.roomRef = db.ref("rooms/" + code);
    state.roomRef.on("value", (snap) => {
      const val = snap.val();
      if (!val) return;
      onRoomUpdate(val);
    });
  }

  /* =========================================================================
     ONLINE — SYNC HANDLER
     ========================================================================= */
  function onRoomUpdate(val) {
    // sinkronkan data pemain yang sudah ada ke state lokal
    if (val.players) {
      [1, 2].forEach((n) => {
        if (val.players[n]) {
          state.players[n] = Object.assign({}, state.players[n], val.players[n]);
        }
      });
    }
    if (val.race && typeof val.race.round === "number") state.round = val.race.round;

    // host: begitu player 2 join saat masih 'waiting', lanjut ke fase promise
    if (val.status === "waiting" && state.myPlayer === 1 && val.players && val.players[2]) {
      state.roomRef.child("status").set("promise");
      return;
    }

    // host: pantau setiap perubahan data selama fase promise, supaya begitu
    // lawan submit belakangan (kapan pun), room tetap lanjut ke fase garasi.
    if (val.status === "promise" && state.myPlayer === 1) {
      checkBothPromisesSubmitted(val);
    }

    // host: sama halnya di fase garasi — cek ulang setiap ada perubahan data,
    // supaya begitu lawan konfirmasi setup belakangan (kapan pun), room tetap
    // lanjut ke starting lights. Sebelumnya ini cuma dicek SEKALI saat host
    // sendiri klik konfirmasi, jadi kalau host konfirmasi duluan, transisi
    // tidak pernah kejadian dan macet di "menunggu lawan".
    if (val.status === "garage" && state.myPlayer === 1) {
      checkBothGarageConfirmed(val);
    }

    if (val.status !== state.lastStatus) {
      state.lastStatus = val.status;
      handleOnlineStatusChange(val.status, val);
    }

    if (val.status === "race" && val.race) {
      handleOnlineRaceSync(val);
      if (state.myPlayer === 1) hostMaybeAdvanceRound(val);
    }
  }

  function handleOnlineStatusChange(status, val) {
    if (status === "promise") {
      setPromiseUIForMode();
      showScreen("screen-start");
    } else if (status === "garage") {
      hideWaiting();
      initGarage();
      showScreen("screen-garage");
    } else if (status === "lights") {
      hideWaiting();
      showScreen("screen-lights");
      const startAt = val.lightsStartedAt || Date.now();
      const delay = Math.max(0, startAt - Date.now());
      setTimeout(() => {
        runStartingLights(() => {
          if (state.myPlayer === 1) {
            state.roomRef.update({
              status: "race",
              race: { round: 1, picks: {}, resolved: {}, acks: {} },
            });
          }
        });
      }, delay);
    } else if (status === "race") {
      hideWaiting();
      prepareRace();
      showScreen("screen-race");
    } else if (status === "finished") {
      // navigasi sesungguhnya dipicu lewat tombol "Lanjut Balapan" agar
      // pemain sempat lihat hasil ronde terakhir dulu.
    }
  }

  function raceKey(round) {
    return "r" + round;
  }

  // Begitu ronde yang baru saja selesai adalah ronde PENUTUP (finished=true),
  // podium ditampilkan otomatis setelah jeda singkat untuk lihat hasil ronde
  // terakhir — tidak perlu klik "Lanjut Balapan" lagi. Kalau pemain memang
  // klik duluan sebelum jeda habis, podium langsung muncul saat itu juga.
  function scheduleAutoFinish() {
    if (state.finishNavigated) return;
    if (state.finishTimeoutId) clearTimeout(state.finishTimeoutId);
    state.finishTimeoutId = setTimeout(() => {
      if (!state.finishNavigated) {
        state.finishNavigated = true;
        finishRace();
      }
    }, 1600);
  }

  function goToFinishNow() {
    if (state.finishTimeoutId) clearTimeout(state.finishTimeoutId);
    if (!state.finishNavigated) {
      state.finishNavigated = true;
      finishRace();
    }
  }

  function handleOnlineRaceSync(val) {
    const round = val.race.round;
    const key = raceKey(round);
    const picks = (val.race.picks && val.race.picks[key]) || {};
    const resolved = val.race.resolved && val.race.resolved[key];

    $("#hud-lap-1").textContent = `LAP ${Math.min(Math.floor(state.players[1].laps), MAX_LAPS)}/${MAX_LAPS}`;
    $("#hud-lap-2").textContent = `LAP ${Math.min(Math.floor(state.players[2].laps), MAX_LAPS)}/${MAX_LAPS}`;
    $("#hud-round-number").textContent = round;
    updateCarPositions(true);

    // host: begitu kedua pilihan untuk ronde ini masuk, resolve SEKALI (dijaga oleh marker `resolved[key]`)
    if (state.myPlayer === 1 && picks[1] && picks[2] && !resolved) {
      resolveRoundOnline(picks[1], picks[2], key);
      return; // tunggu event berikutnya yang membawa data `resolved`
    }

    if (resolved) {
      hideWaiting();
      showOnlineRoundResult(resolved.c1, resolved.c2);
      if (resolved.finished) scheduleAutoFinish();
    } else if (picks[1] && picks[2]) {
      // Kedua pilihan sudah masuk tapi host belum sempat menuliskan hasilnya
      // (sepersekian detik jeda jaringan). Tanpa cabang ini, device non-host
      // bisa "macet" menampilkan tombol pilihan padahal pilihannya sudah
      // terkirim — inilah bug yang bikin input terasa tidak terinputkan.
      $("#rps-panel").classList.add("hidden");
      $("#round-result").classList.add("hidden");
      showWaiting("Menghitung hasil ronde...", "Pilihan kalian berdua sudah masuk.");
    } else if (picks[state.myPlayer] && !picks[state.myPlayer === 1 ? 2 : 1]) {
      $("#rps-panel").classList.add("hidden");
      $("#round-result").classList.add("hidden");
      showWaiting("Menunggu lawan memilih...", "Pilihanmu sudah terkunci. Sabar dulu ya.");
    } else if (!picks[state.myPlayer]) {
      hideWaiting();
      $("#round-result").classList.add("hidden");
      $("#rps-panel").classList.remove("hidden");
      $("#rps-turn-eyebrow").textContent = "GILIRANMU";
      $("#rps-turn-title").textContent = `${state.players[state.myPlayer].name}, pilih formulamu diam-diam`;
    }
  }

  function showOnlineRoundResult(c1, c2) {
    const winner = decideWinner(c1, c2);
    $("#result-name-1").textContent = state.players[1].name + " — " + RPS_LABEL[c1];
    $("#result-name-2").textContent = state.players[2].name + " — " + RPS_LABEL[c2];
    $("#result-icon-1").innerHTML = RPS_ICON[c1];
    $("#result-icon-2").innerHTML = RPS_ICON[c2];
    $("#result-headline").textContent =
      winner === 0
        ? "SERI! Kedua mobil melaju setengah lap."
        : `${state.players[winner].name.toUpperCase()} MENANG RONDE INI — MELAJU 1 LAP!`;
    $("#rps-panel").classList.add("hidden");
    $("#round-result").classList.remove("hidden");
  }

  // Dipanggil HANYA oleh host, dan HANYA sekali per ronde karena ditulis
  // sebagai `race/resolved/{key}` — begitu key itu ada, host tidak akan
  // resolve ulang (lihat guard `!resolved` di handleOnlineRaceSync).
  function resolveRoundOnline(c1, c2, key) {
    const winner = decideWinner(c1, c2);
    const p1laps = Math.min(state.players[1].laps + (winner === 0 ? 0.5 : winner === 1 ? 1 : 0), MAX_LAPS);
    const p2laps = Math.min(state.players[2].laps + (winner === 0 ? 0.5 : winner === 2 ? 1 : 0), MAX_LAPS);
    const finished = p1laps >= MAX_LAPS || p2laps >= MAX_LAPS;

    const updates = {};
    updates["players/1/laps"] = p1laps;
    updates["players/2/laps"] = p2laps;
    updates[`race/resolved/${key}`] = { c1, c2, finished };
    if (finished) updates["status"] = "finished";
    state.roomRef.update(updates);
  }

  // Host: begitu KEDUA pemain sudah menekan "Lanjut Balapan" untuk ronde yang
  // baru saja selesai, baru majukan ke ronde berikutnya. Ini juga idempotent —
  // begitu `race/round` berubah, key lama tidak dicek lagi sehingga tidak bisa
  // ke-trigger dua kali.
  function hostMaybeAdvanceRound(val) {
    const round = val.race.round;
    const key = raceKey(round);
    const resolved = val.race.resolved && val.race.resolved[key];
    if (!resolved || resolved.finished) return;
    const acks = (val.race.acks && val.race.acks[key]) || {};
    if (acks[1] && acks[2]) {
      state.roomRef.child("race/round").set(round + 1);
    }
  }

  $("#result-continue").addEventListener("click", () => {
    if (state.mode === "online") {
      const finished = state.players[1].laps >= MAX_LAPS || state.players[2].laps >= MAX_LAPS;
      $("#round-result").classList.add("hidden");
      if (finished) {
        goToFinishNow();
        return;
      }
      state.roomRef.child(`race/acks/${raceKey(state.round)}/${state.myPlayer}`).set(true);
      showWaiting("Menyiapkan ronde berikutnya...", "Menunggu lawan menekan lanjut.");
    } else {
      $("#round-result").classList.add("hidden");
      const finished = state.players[1].laps >= MAX_LAPS || state.players[2].laps >= MAX_LAPS;
      if (finished) {
        goToFinishNow();
      } else {
        state.round += 1;
        state.raceTurn = 1;
        state.choices = { 1: null, 2: null };
        updateHudLocal();
        $("#rps-panel").classList.remove("hidden");
        setRaceTurnUI();
      }
    }
  });

  /* =========================================================================
     FASE 1 — PROMISE (adaptif LOCAL / ONLINE)
     ========================================================================= */
  function setPromiseUIForMode() {
    if (state.mode === "online") {
      const me = state.myPlayer;
      const opp = me === 1 ? 2 : 1;
      $(`#promise-card-${opp}`).classList.add("hidden");
      $(`#promise-card-${me}`).classList.remove("hidden");
      $("#promise-eyebrow").textContent = `FASE 1 — KAMU PLAYER ${me}`;
      $("#promise-submit-label").textContent = "Pinky Promise & Lanjut";
      $("#p1-name").required = me === 1;
      $("#p1-promise").required = me === 1;
      $("#p2-name").required = me === 2;
      $("#p2-promise").required = me === 2;
    } else {
      $("#promise-card-1").classList.remove("hidden");
      $("#promise-card-2").classList.remove("hidden");
      $("#promise-eyebrow").textContent = "FASE 1";
      $("#promise-submit-label").textContent = "Pinky Promise & Masuk Garasi";
      $("#p1-name").required = true;
      $("#p1-promise").required = true;
      $("#p2-name").required = true;
      $("#p2-promise").required = true;
    }
  }

  $("#form-promise").addEventListener("submit", (e) => {
    e.preventDefault();

    if (state.mode === "online") {
      const me = state.myPlayer;
      const name = $(`#p${me}-name`).value.trim() || `Player ${me}`;
      const promise = $(`#p${me}-promise`).value.trim();
      if (!promise) return;

      state.players[me].name = name;
      state.players[me].promise = promise;

      state.roomRef.update({
        [`players/${me}/name`]: name,
        [`players/${me}/promise`]: promise,
        [`players/${me}/promiseSubmitted`]: true,
      });

      showWaiting("Menunggu lawan mengisi janji...", "Kamu sudah segel janji. Tunggu lawan menyelesaikan bagiannya.");

      if (state.myPlayer === 1) {
        state.roomRef.once("value").then((snap) => {
          const val = snap.val();
          checkBothPromisesSubmitted(val);
        });
      }
      return;
    }

    // LOCAL MODE
    const p1name = $("#p1-name").value.trim() || "Player 1";
    const p2name = $("#p2-name").value.trim() || "Player 2";
    const p1promise = $("#p1-promise").value.trim();
    const p2promise = $("#p2-promise").value.trim();
    if (!p1promise || !p2promise) return;

    state.players[1].name = p1name;
    state.players[1].promise = p1promise;
    state.players[2].name = p2name;
    state.players[2].promise = p2promise;

    initGarage();
    showScreen("screen-garage");
  });

  function checkBothPromisesSubmitted(val) {
    if (!val || !val.players || !val.players[1] || !val.players[2]) return;
    if (val.players[1].promiseSubmitted && val.players[2].promiseSubmitted && val.status === "promise") {
      state.roomRef.child("status").set("garage");
    }
  }

  function checkBothGarageConfirmed(val) {
    if (!val || !val.players || !val.players[1] || !val.players[2]) return;
    if (val.players[1].confirmed && val.players[2].confirmed && val.status === "garage") {
      state.roomRef.update({
        status: "lights",
        lightsStartedAt: Date.now() + 1500,
      });
    }
  }

  // host juga memantau perubahan agar transisi tetap terjadi walau host submit duluan
  const originalOnRoomUpdate = onRoomUpdate;

  /* =========================================================================
     FASE 2 — GARAGE (adaptif LOCAL / ONLINE)
     ========================================================================= */
  function initGarage() {
    if (state.mode === "online") {
      state.garageTurn = state.myPlayer;
    } else {
      state.garageTurn = 1;
      state.players[1].confirmed = false;
      state.players[2].confirmed = false;
      $("#btn-to-grid").classList.add("hidden");
      $("#btn-confirm-garage").disabled = false;
    }
    renderColorOptions();
    renderTireOptions();
    renderWingOptions();
    renderStickerOptions();
    renderLiveryOptions();
    setGarageTurnUI();
  }

  function renderColorOptions() {
    const wrap = $("#color-options");
    wrap.innerHTML = "";
    COLORS.forEach((c) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "swatch";
      btn.style.background = c.value;
      btn.title = c.name;
      btn.setAttribute("aria-label", c.name);
      btn.addEventListener("click", () => {
        state.players[state.garageTurn].color = c.value;
        updateGaragePreview();
        syncGarageFieldOnline("color", c.value);
        markSelected(wrap, btn);
      });
      wrap.appendChild(btn);
    });
  }

  function renderTireOptions() {
    const wrap = $("#tire-options");
    wrap.innerHTML = "";
    TIRES.forEach((t) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tire-opt";
      btn.dataset.tire = t.key;
      btn.innerHTML = `<span class="tire-swatch" style="background:${t.color}"></span><span>${t.label}</span>`;
      btn.addEventListener("click", () => {
        state.players[state.garageTurn].tire = t.key;
        updateGaragePreview();
        syncGarageFieldOnline("tire", t.key);
        markSelected(wrap, btn);
      });
      wrap.appendChild(btn);
    });
  }

  function renderWingOptions() {
    const wrap = $("#wing-options");
    wrap.innerHTML = "";
    WINGS.forEach((w) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "wing-opt";
      btn.dataset.wing = w.key;
      btn.textContent = w.label;
      btn.addEventListener("click", () => {
        state.players[state.garageTurn].wing = w.key;
        updateGaragePreview();
        syncGarageFieldOnline("wing", w.key);
        markSelected(wrap, btn);
      });
      wrap.appendChild(btn);
    });
  }

  function renderStickerOptions() {
    const wrap = $("#sticker-options");
    wrap.innerHTML = "";
    const iconFor = (key) => {
      const s = `<svg viewBox="0 0 320 130"><g>${stickerMarkup(key)}</g></svg>`;
      // crop preview supaya ikon stiker kelihatan jelas di tombol kecil
      return `<svg viewBox="150 25 70 60" xmlns="http://www.w3.org/2000/svg">${stickerMarkup(key) || '<circle cx="185" cy="55" r="14" fill="none" stroke="#666" stroke-width="2"/><text x="185" y="60" font-size="10" fill="#666" text-anchor="middle">–</text>'}</svg>`;
    };
    STICKERS.forEach((s) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "sticker-opt";
      btn.dataset.sticker = s.key;
      btn.innerHTML = `${iconFor(s.key)}<span>${s.label}</span>`;
      btn.addEventListener("click", () => {
        state.players[state.garageTurn].sticker = s.key;
        updateGaragePreview();
        syncGarageFieldOnline("sticker", s.key);
        markSelected(wrap, btn);
      });
      wrap.appendChild(btn);
    });
  }

  function renderLiveryOptions() {
    const wrap = $("#livery-options");
    if (!wrap) return;
    wrap.innerHTML = "";
    LIVERIES.forEach((l) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "livery-opt";
      btn.dataset.livery = l.key;
      btn.innerHTML = l.src
        ? `<img src="${l.src}" alt="${l.label}" /><span>${l.label}</span>`
        : `<span class="livery-opt-classic">SVG</span><span>${l.label}</span>`;
      btn.addEventListener("click", () => {
        state.players[state.garageTurn].livery = l.key;
        updateGaragePreview();
        syncGarageFieldOnline("livery", l.key);
        markSelected(wrap, btn);
      });
      wrap.appendChild(btn);
    });
  }

  function syncGarageFieldOnline(field, value) {
    if (state.mode === "online" && state.roomRef) {
      state.roomRef.child(`players/${state.myPlayer}/${field}`).set(value);
    }
  }

  function markSelected(wrap, activeBtn) {
    $$(":scope > *", wrap).forEach((el) => el.classList.remove("selected"));
    activeBtn.classList.add("selected");
  }

  function updateGaragePreview() {
    const p = state.players[state.garageTurn];
    const isCustomLivery = p.livery && p.livery !== "default";
    $("#garage-car-mount").innerHTML = carMarkup(p, "right");
    $("#tag-color").textContent = "Warna: " + (COLORS.find((c) => c.value === p.color)?.name || "Custom");
    $("#tag-tire").textContent = "Ban: " + TIRES.find((t) => t.key === p.tire).label;
    $("#tag-wing").textContent = "Aero: " + WINGS.find((w) => w.key === p.wing).label;
    $("#tag-sticker").textContent = "Stiker: " + STICKERS.find((s) => s.key === p.sticker).label;
    $("#tag-livery").textContent = "Livery: " + (LIVERIES.find((l) => l.key === p.livery)?.label || "SVG Klasik");

    $$("#color-options .swatch").forEach((el, i) => el.classList.toggle("selected", COLORS[i].value === p.color));
    $$("#tire-options .tire-opt").forEach((el) => el.classList.toggle("selected", el.dataset.tire === p.tire));
    $$("#wing-options .wing-opt").forEach((el) => el.classList.toggle("selected", el.dataset.wing === p.wing));
    $$("#sticker-options .sticker-opt").forEach((el) => el.classList.toggle("selected", el.dataset.sticker === p.sticker));
    $$("#livery-options .livery-opt").forEach((el) => el.classList.toggle("selected", el.dataset.livery === p.livery));

    // Kalau pakai livery gambar custom, warna/ban/sayap/stiker SVG tidak relevan lagi — nonaktifkan biar jelas
    $$("#color-options, #tire-options, #wing-options, #sticker-options").forEach((el) => {
      el.classList.toggle("controls-disabled", isCustomLivery);
    });
  }

  function setGarageTurnUI() {
    const turn = state.garageTurn;
    const p = state.players[turn];
    $("#garage-turn-badge").textContent = "P" + turn;
    $("#garage-turn-badge").style.background = turn === 1 ? "var(--p1-color)" : "var(--p2-color)";
    $("#garage-turn-copy").textContent =
      state.mode === "online"
        ? `${p.name || "Kamu"}, atur livery mobilmu. Lawan mengatur mobilnya di device sendiri secara bersamaan.`
        : `${p.name}, atur livery mobilmu sebelum turun ke grid.`;
    $("#btn-confirm-garage").textContent = `Konfirmasi Setup ${p.name || "Player " + turn}`;
    updateGaragePreview();
  }

  $("#btn-confirm-garage").addEventListener("click", () => {
    if (state.mode === "online") {
      state.players[state.myPlayer].confirmed = true;
      state.roomRef.child(`players/${state.myPlayer}/confirmed`).set(true);
      showWaiting("Menunggu lawan menyelesaikan garasi...", "Setup kamu sudah terkunci.");
      // Transisi ke starting lights ditangani terus-menerus oleh
      // checkBothGarageConfirmed() di dalam onRoomUpdate, jadi tetap
      // jalan walau host konfirmasi duluan ATAU belakangan.
      return;
    }

    // LOCAL MODE
    state.players[state.garageTurn].confirmed = true;
    if (state.garageTurn === 1 && !state.players[2].confirmed) {
      openPassOverlay(
        "Oper HP ke Player 2",
        `Giliran ${state.players[2].name} mengatur mobilnya. Jangan intip pilihan lawan!`,
        () => {
          state.garageTurn = 2;
          setGarageTurnUI();
        }
      );
    } else {
      $("#btn-to-grid").classList.remove("hidden");
      $("#btn-confirm-garage").disabled = true;
    }
  });

  $("#btn-to-grid").addEventListener("click", () => {
    prepareRaceLocalReset();
    showScreen("screen-lights");
    runStartingLights(() => showScreen("screen-race"));
  });

  function openPassOverlay(title, copy, onContinue) {
    $("#pass-title").textContent = title;
    $("#pass-copy").textContent = copy;
    $("#pass-overlay").classList.remove("hidden");
    const btn = $("#pass-continue");
    const handler = () => {
      $("#pass-overlay").classList.add("hidden");
      btn.removeEventListener("click", handler);
      onContinue();
    };
    btn.addEventListener("click", handler);
  }

  /* =========================================================================
     FASE 3 — STARTING LIGHTS
     ========================================================================= */
  function runStartingLights(onDone) {
    $$(".light").forEach((l) => l.classList.remove("lit"));
    $("#lights-out-text").classList.add("hidden");

    let col = 0;
    const interval = setInterval(() => {
      col += 1;
      $$(`.light[data-col="${col}"]`).forEach((l) => l.classList.add("lit"));

      if (col >= 5) {
        clearInterval(interval);
        const holdTime = 400 + Math.random() * 900;
        setTimeout(() => {
          $$(".light").forEach((l) => l.classList.remove("lit"));
          $("#lights-out-text").classList.remove("hidden");
          setTimeout(() => {
            if (typeof onDone === "function") onDone();
          }, 1600);
        }, holdTime);
      }
    }, 1000);
  }

  /* =========================================================================
     FASE 4 — RACE (adaptif LOCAL / ONLINE)
     ========================================================================= */
  function prepareRaceLocalReset() {
    state.players[1].laps = 0;
    state.players[2].laps = 0;
    state.round = 1;
    state.raceTurn = 1;
    state.choices = { 1: null, 2: null };
    prepareRace();
  }

  function prepareRace() {
    state.finishNavigated = false;
    if (state.finishTimeoutId) {
      clearTimeout(state.finishTimeoutId);
      state.finishTimeoutId = null;
    }
    $("#hud-name-1").textContent = state.players[1].name || "Player 1";
    $("#hud-name-2").textContent = state.players[2].name || "Player 2";
    $("#lane-car-1").innerHTML = carMarkup(state.players[1], "right");
    $("#lane-car-2").innerHTML = carMarkup(state.players[2], "right");

    updateHudLocal();
    updateCarPositions(false);
    $("#round-result").classList.add("hidden");
    hideWaiting();

    if (state.mode === "online") {
      $("#rps-panel").classList.remove("hidden");
      $("#rps-turn-eyebrow").textContent = "GILIRANMU";
      $("#rps-turn-title").textContent = `${state.players[state.myPlayer].name}, pilih formulamu diam-diam`;
    } else {
      $("#rps-panel").classList.remove("hidden");
      setRaceTurnUI();
    }
  }

  function updateHudLocal() {
    $("#hud-lap-1").textContent = `LAP ${Math.min(Math.floor(state.players[1].laps), MAX_LAPS)}/${MAX_LAPS}`;
    $("#hud-lap-2").textContent = `LAP ${Math.min(Math.floor(state.players[2].laps), MAX_LAPS)}/${MAX_LAPS}`;
    $("#hud-round-number").textContent = state.round;
  }

  function updateCarPositions(animate) {
    [1, 2].forEach((n) => {
      const pct = Math.min(state.players[n].laps / MAX_LAPS, 1) * 88;
      const el = $(`#lane-car-${n}`);
      if (!animate) el.style.transition = "none";
      el.style.left = pct + "%";
      if (!animate) {
        void el.offsetWidth;
        el.style.transition = "";
      }
    });
  }

  function setRaceTurnUI() {
    const turn = state.raceTurn;
    const p = state.players[turn];
    $("#rps-turn-eyebrow").textContent = "GILIRAN " + p.name.toUpperCase();
    $("#rps-turn-title").textContent = `${p.name}, pilih formulamu diam-diam`;
  }

  $$(".rps-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const choice = btn.dataset.choice;

      if (state.mode === "online") {
        // Feedback instan: langsung sembunyikan panel pilihan & tampilkan status
        // begitu diklik, tidak menunggu event balik dari Firebase. Ini mencegah
        // kesan "klik tidak terinputkan" saat jeda jaringan sedikit lebih lama.
        $("#rps-panel").classList.add("hidden");
        showWaiting("Mengunci pilihanmu...", "");
        state.roomRef.child(`race/picks/${raceKey(state.round)}/${state.myPlayer}`).set(choice);
        return;
      }

      // LOCAL MODE
      state.choices[state.raceTurn] = choice;
      if (state.raceTurn === 1) {
        state.raceTurn = 2;
        openPassOverlay(
          `Oper HP ke ${state.players[2].name}`,
          `Giliran ${state.players[2].name} memilih. Jangan intip pilihan lawan!`,
          () => setRaceTurnUI()
        );
      } else {
        resolveRoundLocal();
      }
    });
  });

  function resolveRoundLocal() {
    const c1 = state.choices[1];
    const c2 = state.choices[2];
    const winner = decideWinner(c1, c2);

    $("#result-name-1").textContent = state.players[1].name + " — " + RPS_LABEL[c1];
    $("#result-name-2").textContent = state.players[2].name + " — " + RPS_LABEL[c2];
    $("#result-icon-1").innerHTML = RPS_ICON[c1];
    $("#result-icon-2").innerHTML = RPS_ICON[c2];

    let headline;
    if (winner === 0) {
      state.players[1].laps += 0.5;
      state.players[2].laps += 0.5;
      headline = "SERI! Kedua mobil melaju setengah lap.";
    } else {
      state.players[winner].laps += 1;
      headline = `${state.players[winner].name.toUpperCase()} MENANG RONDE INI — MELAJU 1 LAP!`;
    }
    state.players[1].laps = Math.min(state.players[1].laps, MAX_LAPS);
    state.players[2].laps = Math.min(state.players[2].laps, MAX_LAPS);

    $("#result-headline").textContent = headline;
    $("#rps-panel").classList.add("hidden");
    $("#round-result").classList.remove("hidden");
    updateHudLocal();
    updateCarPositions(true);

    const finished = state.players[1].laps >= MAX_LAPS || state.players[2].laps >= MAX_LAPS;
    if (finished) scheduleAutoFinish();
  }

  /* =========================================================================
     FASE 5 — FINISH
     ========================================================================= */
  function finishRace() {
    let winnerId, loserId;
    if (state.players[1].laps >= state.players[2].laps) {
      winnerId = 1;
      loserId = 2;
    } else {
      winnerId = 2;
      loserId = 1;
    }
    const winner = state.players[winnerId];
    const loser = state.players[loserId];

    $("#finish-winner-name").textContent = (winner.name || "Player " + winnerId).toUpperCase() + " WINS!";
    $("#finish-loser-name").textContent = loser.name || "Player " + loserId;
    $("#finish-promise-text").textContent = "“" + loser.promise + "”";

    // Semua janji ditampilkan di podium, bukan cuma janji yang kalah
    $("#all-promise-winner-name").textContent = winner.name || "Player " + winnerId;
    $("#all-promise-winner-text").textContent = winner.promise ? "“" + winner.promise + "”" : "—";
    $("#all-promise-loser-name").textContent = loser.name || "Player " + loserId;
    $("#all-promise-loser-text").textContent = loser.promise ? "“" + loser.promise + "”" : "—";

    // Podium: mobil kedua pembalap (sesuai kustomisasi garasi masing-masing) tampil di atas tiangnya
    $("#podium-car-mount-1").innerHTML = carMarkup(winner, "right");
    $("#podium-car-mount-2").innerHTML = carMarkup(loser, "right");
    $("#podium-name-1").textContent = winner.name || "Player " + winnerId;
    $("#podium-name-2").textContent = loser.name || "Player " + loserId;

    hideWaiting();
    launchConfetti();
    showScreen("screen-finish");
  }

  function launchConfetti() {
    const layer = $("#confetti-layer");
    layer.innerHTML = "";
    const colors = ["#e10600", "#ffd400", "#f4f4f2", "#2a6df5", "#00d66b"];
    for (let i = 0; i < 70; i++) {
      const piece = document.createElement("div");
      piece.className = "confetti-piece";
      piece.style.left = Math.random() * 100 + "%";
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDuration = 2.5 + Math.random() * 2.5 + "s";
      piece.style.animationDelay = Math.random() * 1.5 + "s";
      layer.appendChild(piece);
    }
  }

  function returnToMainMenu() {
    if (state.finishTimeoutId) {
      clearTimeout(state.finishTimeoutId);
      state.finishTimeoutId = null;
    }
    state.finishNavigated = false;
    if (state.roomRef) {
      state.roomRef.off();
      state.roomRef = null;
    }
    state.roomCode = null;
    state.lastStatus = null;
    resetPlayers();
    $("#form-promise").reset();
    $("#lobby-grid").classList.remove("hidden");
    $("#lobby-status").classList.add("hidden");
    $("#lobby-error").classList.add("hidden");
    $("#join-code-input").value = "";
    showScreen("screen-mode");
  }

  $("#btn-play-again").addEventListener("click", returnToMainMenu);
  $("#btn-back-to-menu").addEventListener("click", returnToMainMenu);
})();