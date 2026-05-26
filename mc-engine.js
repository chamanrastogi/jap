/* MC Engine — shared multi-choice renderer, state, themes */
const MC = (() => {
  const LEVELS = ['junior', 'mid', 'senior', 'lead'];
  const LEVEL_COLORS = {
    junior: '#22c55e',
    mid: '#3b82f6',
    senior: '#f59e0b',
    lead: '#ef4444'
  };
  const LEVEL_LABELS = {
    junior: 'Junior (0-2 yr)',
    mid: 'Mid (3-5 yr)',
    senior: 'Senior (6-9 yr)',
    lead: 'Lead (10+ yr)'
  };
  const DIFF_LABELS = { easy: 'Easy', med: 'Medium', hard: 'Hard' };
  const STORAGE_PROGRESS = 'mc_progress';
  const STORAGE_LEVEL = 'mc_level';

  let currentLevel = 'mid';
  let questions = [];
  let filtered = [];
  let currentIndex = 0;
  let progress = {};
  let score = { correct: 0, total: 0 };
  let onScoreChange = null;

  function loadLevel() {
    try { return localStorage.getItem(STORAGE_LEVEL) || 'mid'; } catch { return 'mid'; }
  }
  function saveLevel(l) {
    try { localStorage.setItem(STORAGE_LEVEL, l); } catch {}
  }
  function loadProgress() {
    try { return JSON.parse(localStorage.getItem(STORAGE_PROGRESS)) || {}; } catch { return {}; }
  }
  function saveProgress() {
    try { localStorage.setItem(STORAGE_PROGRESS, JSON.stringify(progress)); } catch {}
  }

  function init(data, callbacks) {
    questions = data;
    currentLevel = loadLevel();
    progress = loadProgress();
    if (callbacks && callbacks.onScoreChange) onScoreChange = callbacks.onScoreChange;
    recalcScore();
  }

  function recalcScore() {
    score.correct = 0;
    score.total = 0;
    Object.keys(progress).forEach(id => {
      const p = progress[id];
      if (p && p.correct !== undefined) {
        score.total++;
        if (p.correct) score.correct++;
      }
    });
    if (onScoreChange) onScoreChange(score);
  }

  function setLevel(level) {
    if (!LEVELS.includes(level)) return;
    currentLevel = level;
    saveLevel(level);
    document.documentElement.setAttribute('data-profession', level);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = LEVEL_COLORS[level];
    applyLevelCSS(level);
  }

  function applyLevelCSS(level) {
    const color = LEVEL_COLORS[level];
    const root = document.documentElement;
    root.style.setProperty('--prof-color', color);
    root.style.setProperty('--prof-rgb', hexToRgb(color));
  }

  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r},${g},${b}`;
  }

  function getLevel() { return currentLevel; }
  function getLevelColor() { return LEVEL_COLORS[currentLevel]; }

  function recordAnswer(qId, selectedIdx, correctIdx) {
    progress[qId] = { selected: selectedIdx, correct: selectedIdx === correctIdx, answeredAt: Date.now() };
    saveProgress();
    recalcScore();
  }

  function getProgress(qId) {
    return progress[qId] || null;
  }

  function resetProgress() {
    progress = {};
    score = { correct: 0, total: 0 };
    saveProgress();
    recalcScore();
  }

  function renderOptions(question, container, opts) {
    opts = opts || {};
    const qId = question.id;
    const options = question.options || [];
    const correctIdx = question.correct;
    const prev = getProgress(qId);
    const isAnswered = !!prev;
    const isCorrect = prev && prev.correct;
    const wasSelected = prev ? prev.selected : -1;

    container.innerHTML = '';
    const ol = document.createElement('div');
    ol.className = 'mc-options';

    const letters = ['A', 'B', 'C', 'D'];
    options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'mc-option';
      btn.dataset.idx = idx;
      btn.disabled = isAnswered;

      if (isAnswered) {
        if (idx === correctIdx) btn.classList.add('correct');
        else if (idx === wasSelected && idx !== correctIdx) btn.classList.add('wrong');
        else btn.classList.add('dimmed');
      }

      btn.innerHTML = `<span class="mc-opt-letter">${letters[idx]}</span><span class="mc-opt-text">${opt}</span>`;
      if (!isAnswered) {
        btn.addEventListener('click', () => {
          recordAnswer(qId, idx, correctIdx);
          container.innerHTML = '';
          renderOptions(question, container, opts);
          if (opts.onAnswer) opts.onAnswer(qId, idx, correctIdx);
        });
      }
      ol.appendChild(btn);
    });

    if (isAnswered) {
      const feedback = document.createElement('div');
      feedback.className = `mc-feedback ${isCorrect ? 'correct' : 'wrong'}`;
      if (isCorrect) {
        feedback.innerHTML = `<i class="bi bi-check-circle-fill"></i> Correct!`;
      } else {
        feedback.innerHTML = `<i class="bi bi-x-circle-fill"></i> Incorrect. The correct answer was <strong>${letters[correctIdx]}</strong>.`;
      }
      container.appendChild(ol);
      container.appendChild(feedback);
      if (opts.showExplanation && question.a) {
        const expl = document.createElement('div');
        expl.className = 'mc-explanation';
        expl.innerHTML = `<div class="mc-explanation-header"><i class="bi bi-info-circle"></i> Explanation</div><div class="mc-explanation-body">${question.a}</div>`;
        container.appendChild(expl);
      }
    } else {
      container.appendChild(ol);
    }
  }

  function renderLevelPicker(container, onChange) {
    container.innerHTML = '';
    const levels = ['junior', 'mid', 'senior', 'lead'];
    levels.forEach(level => {
      const chip = document.createElement('button');
      chip.className = `level-chip${level === currentLevel ? ' active' : ''}`;
      chip.dataset.level = level;
      chip.innerHTML = `<span class="level-dot" style="background:${LEVEL_COLORS[level]}"></span> ${LEVEL_LABELS[level]}`;
      chip.addEventListener('click', () => {
        setLevel(level);
        container.querySelectorAll('.level-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        if (onChange) onChange(level);
      });
      container.appendChild(chip);
    });
  }

  function renderProgressBar(container) {
    const total = filtered.length || questions.length;
    const answered = Object.keys(progress).filter(id => {
      const q = questions.find(q => q.id == id);
      return q && (filtered.length === 0 || filtered.some(f => f.id == id));
    }).length;
    const pct = total > 0 ? (answered / total) * 100 : 0;
    container.innerHTML = `
      <div class="mc-progress-bar">
        <div class="mc-progress-fill" style="width:${pct}%;background:${LEVEL_COLORS[currentLevel]}"></div>
      </div>
      <div class="mc-progress-text">${answered}/${total} answered &middot; ${score.correct}/${score.total} correct (${score.total > 0 ? Math.round(score.correct/score.total*100) : 0}%)</div>
    `;
  }

  function setupKeyboardNav(handlers) {
    document.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const key = e.key;
      if (key === '1') { if (handlers.onOpt1) handlers.onOpt1(); }
      else if (key === '2') { if (handlers.onOpt2) handlers.onOpt2(); }
      else if (key === '3') { if (handlers.onOpt3) handlers.onOpt3(); }
      else if (key === '4') { if (handlers.onOpt4) handlers.onOpt4(); }
      else if (key === 'ArrowLeft' || key === 'a') { if (handlers.onPrev) handlers.onPrev(); }
      else if (key === 'ArrowRight' || key === 'd') { if (handlers.onNext) handlers.onNext(); }
      else if (key === ' ') { e.preventDefault(); if (handlers.onNext) handlers.onNext(); }
    });
  }

  return {
    LEVELS, LEVEL_COLORS, LEVEL_LABELS, DIFF_LABELS, STORAGE_PROGRESS, STORAGE_LEVEL,
    init, setLevel, getLevel, getLevelColor, recordAnswer, getProgress,
    resetProgress, recalcScore,
    renderOptions, renderLevelPicker, renderProgressBar, setupKeyboardNav,
    loadProgress, saveProgress,
    get score() { return score; },
    get filtered() { return filtered; },
    set filtered(f) { filtered = f; },
    get currentIndex() { return currentIndex; },
    set currentIndex(i) { currentIndex = i; },
    get currentLevel() { return currentLevel; },
    get questions() { return questions; },
    set questions(q) { questions = q; }
  };
})();
