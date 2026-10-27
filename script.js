// ===== Анимированный терминал в hero =====
const terminalBody = document.getElementById('terminalBody');

const script = [
  { text: '$ kubectl get pods -n prod', cls: 't-cmd', delay: 500 },
  { text: 'NAME                       READY   STATUS    RESTARTS   AGE', cls: 't-dim', delay: 300 },
  { text: 'api-gateway-7d9f4b6c8-x2k9p   1/1   Running   0          5d', cls: 't-ok', delay: 120 },
  { text: 'billing-svc-5c8d7e6f5-m3v7q   1/1   Running   0          5d', cls: 't-ok', delay: 120 },
  { text: 'auth-svc-9b8a7c6d5-p4w2n      1/1   Running   0          5d', cls: 't-ok', delay: 120 },
  { text: '$ kubectl rollout status deploy/api-gateway', cls: 't-cmd', delay: 600 },
  { text: 'Waiting for deployment "api-gateway" rollout to finish...', cls: 't-info', delay: 400 },
  { text: 'deployment "api-gateway" successfully rolled out', cls: 't-ok', delay: 500 },
  { text: '$ terraform apply -auto-approve', cls: 't-cmd', delay: 600 },
  { text: 'Plan: 3 to add, 0 to change, 0 to destroy.', cls: 't-info', delay: 400 },
  { text: 'Apply complete! Resources: 3 added, 0 changed, 0 destroyed.', cls: 't-ok', delay: 500 },
  { text: '$ echo "Прод стабилен. Кофе можно."', cls: 't-cmd', delay: 600 },
  { text: 'Прод стабилен. Кофе можно.', cls: 't-warn', delay: 300 },
];

let lineIdx = 0;

function typeLine() {
  if (lineIdx >= script.length) {
    const cursor = document.createElement('span');
    cursor.className = 'cursor';
    terminalBody.appendChild(cursor);
    return;
  }
  const item = script[lineIdx];
  const div = document.createElement('div');
  div.className = item.cls;
  terminalBody.appendChild(div);

  // Команды печатаем посимвольно, вывод — сразу
  if (item.text.startsWith('$')) {
    let i = 0;
    const tick = () => {
      div.textContent = item.text.slice(0, ++i);
      if (i < item.text.length) {
        setTimeout(tick, 28);
      } else {
        lineIdx++;
        setTimeout(typeLine, item.delay);
      }
    };
    tick();
  } else {
    div.textContent = item.text;
    lineIdx++;
    setTimeout(typeLine, item.delay);
  }
}
typeLine();

// ===== Счётчики статистики =====
function animateCounter(el) {
  const target = parseFloat(el.dataset.count);
  const decimals = parseInt(el.dataset.decimals || '0', 10);
  const suffix = el.dataset.suffix || '';
  const duration = 1600;
  const start = performance.now();

  function frame(now) {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = (target * eased).toFixed(decimals) + suffix;
    if (p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// ===== Reveal при скролле =====
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

// Счётчики запускаем, когда hero-статистика появляется
const statsEl = document.querySelector('.hero__stats');
if (statsEl) {
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('[data-count]').forEach(animateCounter);
        statsObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });
  statsObserver.observe(statsEl);
}

// ===== Интерактивный пайплайн =====
const steps = [
  {
    code: `$ git commit -m "feat: add payment endpoint"\n[main a1b2c3d] feat: add payment endpoint\n 3 files changed, 87 insertions(+)`,
    desc: 'Всё начинается с коммита. Хук отправляет событие в CI-систему, и пайплайн просыпается сам — без ручного запуска.',
  },
  {
    code: `$ docker build -t registry.io/app:${'$'}CI_SHA .\n => [builder 4/4] RUN npm run build\n => exporting layers   0.9s\n => naming to registry.io/app:a1b2c3d`,
    desc: 'Собирается Docker-образ с кэшированием слоёв. В образ попадает только то, что нужно для работы — не больше.',
  },
  {
    code: `$ npm test -- --coverage\n✓ 214 tests passed (214)\nCoverage: 91.4% statements\n$ trivy image registry.io/app:a1b2c3d\n0 CRITICAL, 0 HIGH vulnerabilities`,
    desc: 'Юнит- и интеграционные тесты, сканирование уязвимостей. Пайплайн падает — релиз не выходит. Точка.',
  },
  {
    code: `$ helm upgrade --install app ./chart \\\n    --set image.tag=${'$'}CI_SHA \\\n    --atomic --timeout 120s\nRelease "app" has been upgraded.`,
    desc: 'Канареечный деплой: 5% трафика на новую версию. Флаг --atomic откатит всё автоматически, если health-чеки не пройдут.',
  },
  {
    code: `$ promtool query instant 'up{job="api"}'\nup{job="api",pod="api-7d9f4b"} => 1\n$ grafana: p99 latency 142ms | err rate 0.01%`,
    desc: 'Метрики и алерты следят за релизом. Если SLO нарушен — автоматический откат и уведомление дежурному.',
  },
];

const stepBtns = document.querySelectorAll('.pstep');
const codeEl = document.getElementById('pipelineCode');
const descEl = document.getElementById('pipelineDesc');

function showStep(idx) {
  stepBtns.forEach((b, i) => {
    b.classList.toggle('is-active', i === idx);
    b.classList.toggle('is-done', i < idx);
  });
  codeEl.textContent = steps[idx].code;
  descEl.textContent = steps[idx].desc;
}
stepBtns.forEach((btn, i) => btn.addEventListener('click', () => showStep(i)));
showStep(0);

// Автопроигрывание пайплайна при появлении на экране
const pipelineEl = document.querySelector('.pipeline');
const pipelineObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      let i = 0;
      const run = () => {
        showStep(i);
        i++;
        if (i < steps.length) setTimeout(run, 1400);
      };
      run();
      pipelineObserver.unobserve(pipelineEl);
    }
  });
}, { threshold: 0.3 });
pipelineObserver.observe(pipelineEl);

// ===== Навигация =====
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('is-scrolled', window.scrollY > 40);
}, { passive: true });

const burger = document.getElementById('burger');
const navLinks = document.getElementById('navLinks');
burger.addEventListener('click', () => navLinks.classList.toggle('is-open'));
navLinks.querySelectorAll('a').forEach((a) =>
  a.addEventListener('click', () => navLinks.classList.remove('is-open'))
);

// ===== Мини-игра «Охотник за инцидентами» =====
const GAME_DURATION = 30; // секунд
const GRID_SIZE = 18;     // подов в кластере

const gameGrid = document.getElementById('gameGrid');
const gameOverlay = document.getElementById('gameOverlay');
const gameOverlayTitle = document.getElementById('gameOverlayTitle');
const gameOverlayText = document.getElementById('gameOverlayText');
const gameStartBtn = document.getElementById('gameStartBtn');
const gameUptimeEl = document.getElementById('gameUptime');
const gameFixedEl = document.getElementById('gameFixed');
const gameTimeEl = document.getElementById('gameTime');

const POD_NAMES = ['api', 'auth', 'billing', 'cache', 'search', 'worker', 'gateway', 'notify'];

let game = {
  running: false,
  pods: [],
  crashed: 0,
  fixed: 0,
  downtimeMs: 0,
  tickMs: 100,
  spawnTimer: null,
  gameTimer: null,
  clockTimer: null,
};

function initPods() {
  gameGrid.innerHTML = '';
  game.pods = [];
  for (let i = 0; i < GRID_SIZE; i++) {
    const pod = document.createElement('button');
    pod.className = 'pod';
    pod.type = 'button';
    const name = POD_NAMES[i % POD_NAMES.length];
    pod.textContent = `${name}-${i}`;
    pod.addEventListener('click', () => fixPod(i));
    gameGrid.appendChild(pod);
    game.pods.push({ el: pod, crashed: false, fixing: false, crashAt: 0 });
  }
}

function crashPod() {
  const healthy = game.pods.filter((p) => !p.crashed && !p.fixing);
  if (!healthy.length) return;
  const pod = healthy[Math.floor(Math.random() * healthy.length)];
  pod.crashed = true;
  pod.crashAt = performance.now();
  pod.el.classList.add('is-crashed');
  pod.el.textContent = pod.el.textContent.split(' ')[0] + ' 💥';
  game.crashed++;
}

function fixPod(i) {
  const pod = game.pods[i];
  if (!game.running || !pod.crashed || pod.fixing) return;
  pod.fixing = true;
  pod.el.classList.remove('is-crashed');
  pod.el.classList.add('is-fixing');
  pod.el.textContent = pod.el.textContent.replace(' 💥', ' ⏳');

  setTimeout(() => {
    pod.crashed = false;
    pod.fixing = false;
    game.fixed++;
    gameFixedEl.textContent = game.fixed;
    pod.el.classList.remove('is-fixing');
    pod.el.textContent = pod.el.textContent.replace(' ⏳', '');
  }, 700);
}

function updateUptime() {
  const total = GAME_DURATION * 1000;
  const uptime = Math.max(0, 100 - (game.downtimeMs / total) * 100);
  gameUptimeEl.textContent = uptime.toFixed(2) + '%';
  gameUptimeEl.classList.toggle('is-bad', uptime < 99);
  gameUptimeEl.classList.toggle('is-warn', uptime >= 99 && uptime < 99.9);
}

function startGame() {
  // Сброс
  game.running = true;
  game.crashed = 0;
  game.fixed = 0;
  game.downtimeMs = 0;
  gameFixedEl.textContent = '0';
  gameUptimeEl.textContent = '100.00%';
  gameUptimeEl.classList.remove('is-bad', 'is-warn');
  initPods();
  gameOverlay.classList.add('is-hidden');

  // Падения учащаются со временем
  const spawnLoop = () => {
    if (!game.running) return;
    crashPod();
    const elapsed = (GAME_DURATION * 1000 - remainingMs()) / 1000;
    const interval = Math.max(350, 1100 - elapsed * 25);
    game.spawnTimer = setTimeout(spawnLoop, interval);
  };
  game.spawnTimer = setTimeout(spawnLoop, 800);

  // Тик downtime: каждый упавший под копит простой, пока не починен
  game.clockTimer = setInterval(() => {
    if (!game.running) return;
    const now = performance.now();
    game.pods.forEach((p) => {
      if (p.crashed && !p.fixing) {
        game.downtimeMs += game.tickMs;
      }
    });
    updateUptime();
  }, game.tickMs);

  // Таймер смены
  gameTimeEl.textContent = GAME_DURATION;
  game.gameTimer = setInterval(() => {
    const left = remainingMs();
    gameTimeEl.textContent = Math.ceil(left / 1000);
    if (left <= 0) endGame();
  }, 250);
}

function remainingMs() {
  return Math.max(0, GAME_DURATION * 1000 - (performance.now() - game.startedAt));
}

function endGame() {
  game.running = false;
  clearTimeout(game.spawnTimer);
  clearInterval(game.gameTimer);
  clearInterval(game.clockTimer);

  const uptime = Math.max(0, 100 - (game.downtimeMs / (GAME_DURATION * 1000)) * 100);
  const won = uptime >= 99;

  gameOverlayTitle.textContent = won ? '🎉 Смена принята!' : '🔥 Инцидент P1!';
  gameOverlayText.textContent = won
    ? `Uptime ${uptime.toFixed(2)}% — error budget цел. Починено подов: ${game.fixed}. Дежурного можно отпустить домой.`
    : `Uptime ${uptime.toFixed(2)}% — ниже SLO. Починено подов: ${game.fixed}. Postmortem неизбежен...`;
  gameStartBtn.textContent = 'Ещё смена';
  gameOverlay.classList.remove('is-hidden');
}

gameStartBtn.addEventListener('click', () => {
  game.startedAt = performance.now();
  startGame();
});

initPods();

// ===== Год в футере =====
document.getElementById('year').textContent = new Date().getFullYear();
