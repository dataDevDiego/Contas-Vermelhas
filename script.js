const TOTAL_PLAYERS = 4;
const ROUND_SECONDS = 30;
const SYSTEM_ERROR_RATE = 0.2;
const SPAWN_INTERVAL_MS = 550;
const BLOCK_FALL_MS = 5000;

const screens = {
  setup: document.getElementById("setup-screen"),
  transition: document.getElementById("transition-screen"),
  game: document.getElementById("game-screen"),
  phase1: document.getElementById("phase1-screen"),
  phase2: document.getElementById("phase2-screen"),
};

const ui = {
  startBtn: document.getElementById("start-btn"),
  playBtn: document.getElementById("play-btn"),
  revealBtn: document.getElementById("reveal-btn"),
  restartBtn: document.getElementById("restart-btn"),
  transitionTitle: document.getElementById("transition-title"),
  hudPlayer: document.getElementById("hud-player"),
  hudTime: document.getElementById("hud-time"),
  hudHits: document.getElementById("hud-hits"),
  hudFails: document.getElementById("hud-fails"),
  gameArea: document.getElementById("game-area"),
  rankingBoard: document.getElementById("ranking-board"),
  managementMessage: document.getElementById("management-message"),
  auditBoard: document.getElementById("audit-board"),
};

let players = [];
let currentPlayerIndex = 0;
let currentRound = null;
let spawnTimer = null;
let countdownTimer = null;

function showScreen(name) {
  Object.values(screens).forEach((screen) => screen.classList.add("hidden"));
  screens[name].classList.remove("hidden");
}

function getPlayersFromInputs() {
  const names = [];
  for (let i = 1; i <= TOTAL_PLAYERS; i += 1) {
    const value = document.getElementById(`player-${i}`).value.trim();
    names.push(value || `Jogador ${i}`);
  }
  return names;
}

function startSimulation() {
  players = getPlayersFromInputs().map((name) => ({
    name,
    hits: 0,
    apparentFailures: 0,
    systemErrors: 0,
    wrongClicks: 0,
    missedValid: 0,
    avgReactionMs: 0,
    validClicks: 0,
  }));
  currentPlayerIndex = 0;
  showTransition();
}

function showTransition() {
  const player = players[currentPlayerIndex];
  ui.transitionTitle.textContent = `Vez de ${player.name}. Prepare-se!`;
  showScreen("transition");
}

function startRound() {
  const player = players[currentPlayerIndex];
  currentRound = {
    player,
    timeLeft: ROUND_SECONDS,
    hits: 0,
    apparentFailures: 0,
    systemErrors: 0,
    wrongClicks: 0,
    missedValid: 0,
    reactionTimes: [],
    validClicks: 0,
  };

  ui.gameArea.innerHTML = "";
  ui.hudPlayer.textContent = player.name;
  refreshHud();
  showScreen("game");

  spawnTimer = setInterval(spawnBlock, SPAWN_INTERVAL_MS);
  countdownTimer = setInterval(() => {
    currentRound.timeLeft -= 1;
    refreshHud();
    if (currentRound.timeLeft <= 0) {
      endRound();
    }
  }, 1000);
}

function spawnBlock() {
  if (!currentRound) return;
  const block = document.createElement("button");
  const isValid = Math.random() > 0.25;
  const spawnAt = performance.now();
  block.type = "button";
  block.className = `block ${isValid ? "valid" : "corrupted"}`;
  block.textContent = isValid ? "DADO VÁLIDO" : "CORROMPIDO";
  block.style.left = `${Math.random() * 80}%`;
  block.style.animationDuration = `${BLOCK_FALL_MS}ms`;
  block.dataset.valid = String(isValid);
  block.dataset.spawnAt = String(spawnAt);

  block.addEventListener("click", () => {
    const valid = block.dataset.valid === "true";
    if (valid) {
      currentRound.validClicks += 1;
      const reaction = performance.now() - Number(block.dataset.spawnAt);
      currentRound.reactionTimes.push(reaction);

      // Fator oculto: parte dos acertos é convertida em erro de processamento.
      if (Math.random() < SYSTEM_ERROR_RATE) {
        currentRound.systemErrors += 1;
        currentRound.apparentFailures += 1;
      } else {
        currentRound.hits += 1;
      }
    } else {
      currentRound.wrongClicks += 1;
      currentRound.apparentFailures += 1;
    }
    block.remove();
    refreshHud();
  });

  block.addEventListener("animationend", () => {
    const valid = block.dataset.valid === "true";
    if (valid && block.isConnected) {
      currentRound.missedValid += 1;
      currentRound.apparentFailures += 1;
      refreshHud();
    }
    block.remove();
  });

  ui.gameArea.appendChild(block);
}

function refreshHud() {
  ui.hudTime.textContent = String(Math.max(0, currentRound.timeLeft));
  ui.hudHits.textContent = String(currentRound.hits);
  ui.hudFails.textContent = String(currentRound.apparentFailures);
}

function endRound() {
  clearInterval(spawnTimer);
  clearInterval(countdownTimer);
  spawnTimer = null;
  countdownTimer = null;

  ui.gameArea.innerHTML = "";
  const avgReaction =
    currentRound.reactionTimes.length > 0
      ? currentRound.reactionTimes.reduce((sum, value) => sum + value, 0) /
        currentRound.reactionTimes.length
      : 0;

  Object.assign(currentRound.player, {
    hits: currentRound.hits,
    apparentFailures: currentRound.apparentFailures,
    systemErrors: currentRound.systemErrors,
    wrongClicks: currentRound.wrongClicks,
    missedValid: currentRound.missedValid,
    avgReactionMs: avgReaction,
    validClicks: currentRound.validClicks,
  });

  currentRound = null;
  currentPlayerIndex += 1;

  if (currentPlayerIndex < TOTAL_PLAYERS) {
    showTransition();
  } else {
    showTraditionalRanking();
  }
}

function showTraditionalRanking() {
  const ranking = [...players].sort((a, b) => a.apparentFailures - b.apparentFailures);
  ui.rankingBoard.innerHTML = ranking
    .map((player, index) => {
      const place = index + 1;
      const badge =
        place === 1
          ? `<span class="badge good">Funcionário do Mês</span>`
          : place === TOTAL_PLAYERS
            ? `<span class="badge bad">Alerta de Baixa Eficiência</span>`
            : "";
      return `<article class="result-card">
        <strong>${place}º lugar — ${player.name}</strong> ${badge}
        <div>Falhas aparentes: ${player.apparentFailures}</div>
        <div>Acertos: ${player.hits}</div>
      </article>`;
    })
    .join("");

  const first = ranking[0];
  const last = ranking[ranking.length - 1];
  ui.managementMessage.innerHTML = `
    <p><strong>Elogio executivo:</strong> ${first.name}, sua performance indica alta produtividade e disciplina operacional.</p>
    <p><strong>Advertência formal:</strong> ${last.name}, identificamos sinais de baixa atenção e eficiência abaixo do esperado.</p>
  `;
  showScreen("phase1");
}

function showAudit() {
  ui.auditBoard.innerHTML = players
    .map((player) => {
      const rate = player.validClicks > 0 ? (player.systemErrors / player.validClicks) * 100 : 0;
      return `<article class="result-card">
        <strong>${player.name}</strong>
        <div>Cliques válidos processados: ${player.validClicks}</div>
        <div>Erros sistêmicos injetados: ${player.systemErrors}</div>
        <div>Taxa observada: ${rate.toFixed(1)}%</div>
        <div>Tempo médio de reação: ${player.avgReactionMs.toFixed(0)}ms</div>
        <div class="bar"><span style="width:${Math.min(100, rate)}%"></span></div>
      </article>`;
    })
    .join("");
  showScreen("phase2");
}

function resetAll() {
  players = [];
  currentPlayerIndex = 0;
  currentRound = null;
  clearInterval(spawnTimer);
  clearInterval(countdownTimer);
  showScreen("setup");
}

ui.startBtn.addEventListener("click", startSimulation);
ui.playBtn.addEventListener("click", startRound);
ui.revealBtn.addEventListener("click", showAudit);
ui.restartBtn.addEventListener("click", resetAll);
