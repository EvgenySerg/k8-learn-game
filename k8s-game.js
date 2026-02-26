const rawLevelData = Array.isArray(window.KUBECRAFT_LEVEL_DATA)
  ? window.KUBECRAFT_LEVEL_DATA
  : [];

const GROUP_CATALOG = window.KUBECRAFT_GROUP_CATALOG || {
  advancedTopics: {
    label: 'Advanced Topics',
    tags: ['kubernetes', 'operations']
  }
};

const COMMAND_PLACEHOLDER = '<span class="cmd-placeholder">click tokens below to build your command...</span>';
const ENABLE_JOURNEY_GAMIFICATION = false;
const DAILY_HIT_RATIO_STORAGE_KEY = 'kubecraft_daily_hit_ratio_v1';
const DAILY_WEAK_HIT_RATIO_THRESHOLD = 0.7;
const JOURNEY_ICONS = {
  knight: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M6.5 20h11l-1-5.5a4.5 4.5 0 0 0-9 0L6.5 20z" />
      <path d="M9 11h6" />
      <path d="M12 4v3" />
      <path d="M12 4c2.4 0 4 1.1 5 2.6" />
      <path d="M8.3 7.5L6 6" />
    </svg>`,
  road: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 20c4-3 4-13 8-16" />
      <path d="M20 20c-4-3-4-13-8-16" />
      <path d="M12 6v2" />
      <path d="M12 11v2" />
      <path d="M12 16v2" />
    </svg>`,
  quiz: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M5 20h14V10H5z" />
      <path d="M8 10V7h8v3" />
      <path d="M10.7 13.6a1.8 1.8 0 1 1 2.9 1.5c-.5.4-.8.8-.8 1.3" />
      <circle cx="12" cy="18" r="0.9" fill="currentColor" stroke="none" />
    </svg>`,
  command: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="4.5" y="11" width="15" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      <path d="M9.5 15h5" />
      <path d="M9.5 18h3.3" />
    </svg>`,
  scenario: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 20h16" />
      <path d="M5.5 20l2.1-6 2.1 6 2.1-8 2.1 8 2.1-6 2.1 6" />
      <path d="M12 5v3" />
      <path d="M12 10v.2" />
    </svg>`,
  boss: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M5 19c0-6.3 4.2-10.4 10.2-10.4 1.9 0 3.5.6 4.8 1.7-2 .4-3 1.7-3 3.6 0 2 1 3.4 3 3.8a6.8 6.8 0 0 1-5.2 2.3H5z" />
      <circle cx="14.7" cy="12.6" r="0.8" fill="currentColor" stroke="none" />
      <path d="M11.1 12l2 1-2 1z" fill="currentColor" stroke="none" />
      <path d="M9.8 9.5L8 7.8" />
    </svg>`
};

const JOURNEY_THEMES = {
  quiz: {
    kind: 'quiz',
    label: 'Riddle Gate',
    story: 'A puzzle gate blocks the road. Solve the riddle to keep moving.',
    success: 'Riddle gate opened.',
    fail: 'The gate remains closed.'
  },
  command: {
    kind: 'command',
    label: 'Runic Lock',
    story: 'A runic lock seals the road. Build the exact command to break it.',
    success: 'Runic lock unlocked.',
    fail: 'The lock rejects that sequence.'
  },
  scenario: {
    kind: 'scenario',
    label: 'Ambush Pass',
    story: 'An ambush blocks the pass. Choose the safest operational response.',
    success: 'Ambush avoided cleanly.',
    fail: 'The ambush slowed your march.'
  },
  boss: {
    kind: 'boss',
    label: 'Dragon Gate',
    story: 'A dragon guards the final turn. Precision and calm are mandatory.',
    success: 'Dragon gate breached.',
    fail: 'The dragon still holds the pass.'
  }
};

function inferDynamicTags(question) {
  const tags = [];
  const text = `${question.q || ''} ${question.explain || ''} ${question.deepDive || ''}`.toLowerCase();

  if (question.type === 'command') tags.push('kubectl');
  if (question.type === 'scenario') tags.push('incident-response');

  if (/security|rbac|secret|non-root|tls|networkpolicy/.test(text)) tags.push('security');
  if (/autoscal|hpa|keda|replica/.test(text)) tags.push('scaling');
  if (/metrics|prometheus|trace|latency|observability|events/.test(text)) tags.push('observability');
  if (/operator|reconcile|crd/.test(text)) tags.push('operator-pattern');
  if (/ingress|service|dns|loadbalancer|network/.test(text)) tags.push('networking');
  if (/deployment|rollout|helm|gitops|argocd/.test(text)) tags.push('delivery');
  if (/configmap|secret|volume|storage|statefulset/.test(text)) tags.push('config-storage');

  return tags;
}

function normalizeQuestion(question, level, levelQuestionIndex, sourceIndex, hasExplicitBoss) {
  const rawGroupId = typeof question.groupId === 'string' ? question.groupId : 'advancedTopics';
  const groupId = GROUP_CATALOG[rawGroupId] ? rawGroupId : 'advancedTopics';
  const group = GROUP_CATALOG[groupId] || GROUP_CATALOG.advancedTopics;
  const isBoss = Boolean(question.isBoss) || (!hasExplicitBoss && levelQuestionIndex === (level.questions || []).length - 1);
  const tags = Array.from(new Set([
    ...(group.tags || []),
    question.type,
    ...(Array.isArray(question.tags) ? question.tags : []),
    ...inferDynamicTags(question),
    ...(isBoss ? ['boss', 'complex'] : [])
  ].filter(Boolean))).slice(0, isBoss ? 8 : 7);

  return {
    ...question,
    sourceIndex,
    uid: `q-${sourceIndex + 1}`,
    groupId,
    groupLabel: group.label || 'Advanced Topics',
    tags,
    isBoss,
    levelId: level.id,
    levelTitle: level.title,
    levelDifficulty: level.difficulty
  };
}

function normalizeLevels(levelData) {
  let sourceIndex = 0;

  return levelData.map((level, levelPosition) => {
    const rawQuestions = Array.isArray(level.questions) ? level.questions : [];
    const hasExplicitBoss = rawQuestions.some(question => Boolean(question.isBoss));
    const questions = rawQuestions.map((question, questionIndex) => {
      const normalizedQuestion = normalizeQuestion(
        question,
        level,
        questionIndex,
        sourceIndex,
        hasExplicitBoss
      );
      sourceIndex++;
      return normalizedQuestion;
    });

    return {
      id: level.id || `level-${levelPosition + 1}`,
      title: level.title || `Level ${levelPosition + 1}`,
      difficulty: level.difficulty || 'Unspecified',
      badgeIcon: level.badgeIcon || '🏅',
      badgeName: level.badgeName || `Badge ${levelPosition + 1}`,
      description: level.description || '',
      focus: Array.isArray(level.focus) ? level.focus : [],
      status: level.status || (questions.length > 0 ? 'active' : 'planned'),
      targetQuestionCount: Number.isFinite(level.targetQuestionCount)
        ? level.targetQuestionCount
        : questions.length,
      shuffleQuestions: level.shuffleQuestions !== false,
      questions
    };
  });
}

function fisherYatesShuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function shuffleLevelQuestions(questions) {
  const boss = questions.filter(q => q.isBoss);
  const rest = questions.filter(q => !q.isBoss);

  if (!rest.some(q => q.shuffleGroup != null)) {
    return [...fisherYatesShuffle(rest), ...boss];
  }

  const queues = new Map();
  const slots = [];

  rest.forEach(q => {
    if (q.shuffleGroup != null) {
      if (!queues.has(q.shuffleGroup)) queues.set(q.shuffleGroup, []);
      queues.get(q.shuffleGroup).push(q);
      slots.push({ type: 'group', key: q.shuffleGroup });
    } else {
      slots.push({ type: 'single', q });
    }
  });

  fisherYatesShuffle(slots);

  const result = [];
  slots.forEach(slot => {
    if (slot.type === 'single') {
      result.push(slot.q);
    } else {
      const queue = queues.get(slot.key);
      if (queue && queue.length) result.push(queue.shift());
    }
  });

  return [...result, ...boss];
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function sanitizeDailyStats(rawStats) {
  const sanitized = {};
  if (!rawStats || typeof rawStats !== 'object') return sanitized;

  Object.entries(rawStats).forEach(([uid, stat]) => {
    if (!uid || typeof uid !== 'string') return;
    if (!stat || typeof stat !== 'object') return;

    const attempts = Number.isFinite(stat.attempts) ? Math.max(0, Math.floor(stat.attempts)) : 0;
    const correct = Number.isFinite(stat.correct) ? Math.max(0, Math.floor(stat.correct)) : 0;

    sanitized[uid] = {
      attempts,
      correct: Math.min(correct, attempts)
    };
  });

  return sanitized;
}

function loadDailyHitRatioStore() {
  const today = getLocalDateKey();
  if (typeof window === 'undefined' || !window.localStorage) {
    return { date: today, stats: {} };
  }

  try {
    const raw = window.localStorage.getItem(DAILY_HIT_RATIO_STORAGE_KEY);
    if (!raw) return { date: today, stats: {} };

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { date: today, stats: {} };
    if (parsed.date !== today) return { date: today, stats: {} };

    return {
      date: today,
      stats: sanitizeDailyStats(parsed.stats)
    };
  } catch (_) {
    return { date: today, stats: {} };
  }
}

let dailyHitRatioStore = loadDailyHitRatioStore();

function saveDailyHitRatioStore() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(DAILY_HIT_RATIO_STORAGE_KEY, JSON.stringify(dailyHitRatioStore));
  } catch (_) {
    // Ignore storage failures (private mode, quota, etc.)
  }
}

function ensureTodayHitRatioStore() {
  const today = getLocalDateKey();
  if (!dailyHitRatioStore || dailyHitRatioStore.date !== today) {
    dailyHitRatioStore = { date: today, stats: {} };
    saveDailyHitRatioStore();
  } else if (!dailyHitRatioStore.stats || typeof dailyHitRatioStore.stats !== 'object') {
    dailyHitRatioStore.stats = {};
  }

  return dailyHitRatioStore;
}

function getQuestionStatsKey(question) {
  if (!question || typeof question !== 'object') return '';
  if (typeof question.id === 'string' && question.id.trim()) {
    return `id:${question.id.trim()}`;
  }
  if (typeof question.q === 'string' && question.q.trim()) {
    const levelPart = typeof question.levelId === 'string' && question.levelId.trim()
      ? `${question.levelId.trim()}|`
      : '';
    return `q:${levelPart}${question.q.trim().toLowerCase()}`;
  }
  if (typeof question.uid === 'string' && question.uid.trim()) {
    return `uid:${question.uid.trim()}`;
  }
  return '';
}

function getQuestionTodayStats(question) {
  const store = ensureTodayHitRatioStore();
  const key = getQuestionStatsKey(question);
  const raw = (key && store.stats[key]) ? store.stats[key] : { attempts: 0, correct: 0 };
  const attempts = Number.isFinite(raw.attempts) ? Math.max(0, raw.attempts) : 0;
  const correct = Number.isFinite(raw.correct) ? Math.max(0, raw.correct) : 0;
  const hitRatio = attempts > 0 ? correct / attempts : null;

  return { attempts, correct: Math.min(correct, attempts), hitRatio };
}

function recordQuestionTodayResult(question, correct) {
  const key = getQuestionStatsKey(question);
  if (!key) return;

  const store = ensureTodayHitRatioStore();
  const current = store.stats[key] || { attempts: 0, correct: 0 };
  const attempts = (Number.isFinite(current.attempts) ? current.attempts : 0) + 1;
  const correctCount = (Number.isFinite(current.correct) ? current.correct : 0) + (correct ? 1 : 0);

  store.stats[key] = {
    attempts,
    correct: Math.min(correctCount, attempts)
  };

  saveDailyHitRatioStore();
}

function getQuestionPriorityBucket(stats) {
  if (stats.attempts > 0 && stats.hitRatio < DAILY_WEAK_HIT_RATIO_THRESHOLD) return 0;
  if (stats.attempts === 0) return 1;
  return 2;
}

function prioritizeQuestionsByDailyHitRatio(questions) {
  const orderMap = new Map(questions.map((question, index) => [getQuestionStatsKey(question) || `idx-${index}`, index]));
  const bossQuestions = questions.filter(question => question.isBoss);
  const regularQuestions = questions.filter(question => !question.isBoss);

  regularQuestions.sort((a, b) => {
    const aStats = getQuestionTodayStats(a);
    const bStats = getQuestionTodayStats(b);
    const aBucket = getQuestionPriorityBucket(aStats);
    const bBucket = getQuestionPriorityBucket(bStats);

    if (aBucket !== bBucket) return aBucket - bBucket;

    if (aStats.attempts !== 0 || bStats.attempts !== 0) {
      if ((aStats.hitRatio || 0) !== (bStats.hitRatio || 0)) {
        return (aStats.hitRatio || 0) - (bStats.hitRatio || 0);
      }
      if (aStats.attempts !== bStats.attempts) {
        return bStats.attempts - aStats.attempts;
      }
    }

    const aOrder = orderMap.get(getQuestionStatsKey(a)) ?? 0;
    const bOrder = orderMap.get(getQuestionStatsKey(b)) ?? 0;
    return aOrder - bOrder;
  });

  return [...regularQuestions, ...bossQuestions];
}

function reprioritizeRemainingQuestions(level, answeredQuestionIndex) {
  if (!level || !Array.isArray(level.questions)) return;

  const completedSlice = level.questions.slice(0, answeredQuestionIndex + 1);
  const remainingSlice = level.questions.slice(answeredQuestionIndex + 1);
  if (remainingSlice.length < 2) return;

  level.questions = [
    ...completedSlice,
    ...prioritizeQuestionsByDailyHitRatio(remainingSlice)
  ];
}

function formatTodayHitRatio(stats) {
  if (!stats || stats.attempts === 0) {
    return 'Today hit ratio: — (0 attempts)';
  }

  const percent = Math.round((stats.correct / stats.attempts) * 100);
  return `Today hit ratio: ${percent}% (${stats.correct}/${stats.attempts})`;
}

function addFailedReviewItem(question, chosenIdx, builtCmd) {
  if (!question) return;

  const key = getQuestionStatsKey(question) || question.uid || question.q || '';
  if (!key) return;
  if (failedReviewItems.some(item => item.key === key)) return;

  const options = Array.isArray(question.options) ? [...question.options] : [];
  const chosenOption = chosenIdx >= 0 && chosenIdx < options.length ? options[chosenIdx] : '';

  failedReviewItems.push({
    key,
    levelTitle: question.levelTitle || '',
    groupLabel: question.groupLabel || '',
    type: question.type || '',
    q: question.q || '',
    context: question.context || '',
    options,
    answer: Array.isArray(question.answer) ? [...question.answer] : question.answer,
    explain: question.explain || '',
    tip: question.tip || '',
    deepDive: question.deepDive || '',
    wrongReason: (question.wrongReasons && chosenIdx >= 0) ? (question.wrongReasons[chosenIdx] || '') : '',
    chosenOption,
    builtCmd: Array.isArray(builtCmd) ? [...builtCmd] : [],
    isBoss: Boolean(question.isBoss)
  });
}

function renderFailedReviewCard(item, index) {
  const contextHtml = item.context
    ? `<div class="question-context">${escapeHtml(item.context)}</div>`
    : '';

  const wrongReasonHtml = item.wrongReason
    ? `
      <div class="feedback-wrong-reason">
        <strong>❌ Why your answer was wrong:</strong>
        ${escapeHtml(item.wrongReason)}
      </div>`
    : '';

  const yourAttemptHtml = item.type === 'command'
    ? (item.builtCmd.length > 0
      ? `
        <div class="feedback-correct-box">
          <strong>🛠️ Your command:</strong>
          ${escapeHtml(item.builtCmd.join(' '))}
        </div>`
      : '')
    : (item.chosenOption
      ? `
        <div class="feedback-correct-box">
          <strong>🛠️ Your answer:</strong>
          ${escapeHtml(item.chosenOption)}
        </div>`
      : '');

  const correctAnswerText = item.type === 'command'
    ? (Array.isArray(item.answer) ? item.answer.join(' ') : '')
    : (Array.isArray(item.options) && Number.isInteger(item.answer) ? (item.options[item.answer] || '') : '');

  const correctAnswerHtml = correctAnswerText
    ? `
      <div class="feedback-correct-box">
        <strong>✅ Correct ${item.type === 'command' ? 'command' : 'answer'}:</strong>
        ${escapeHtml(correctAnswerText)}
      </div>`
    : '';

  const tipHtml = item.tip
    ? `
      <div class="feedback-tip">
        <strong>🐹 Go Tip:</strong>
        <pre class="feedback-code">${escapeHtml(item.tip)}</pre>
      </div>`
    : '';

  const deepDiveHtml = item.deepDive
    ? `
      <div class="feedback-deep-dive">
        <strong>🔬 Deep Dive:</strong>
        <pre class="feedback-code">${formatRichTextWithLinks(item.deepDive)}</pre>
      </div>`
    : '';

  return `
    <article class="failed-review-card">
      <div class="failed-review-card-header">
        <span class="failed-review-chip">Mistake #${index + 1}</span>
        <span class="failed-review-chip">${escapeHtml(item.groupLabel || 'General')}</span>
        ${item.isBoss ? '<span class="failed-review-chip failed-review-chip-boss">Boss</span>' : ''}
      </div>
      <div class="question-text">${escapeHtml(item.q)}</div>
      ${contextHtml}
      <div class="feedback show bad">
        <div class="feedback-header">❌ Not quite — learn from this!</div>
        <div class="feedback-body">
          ${wrongReasonHtml}
          ${yourAttemptHtml}
          ${correctAnswerHtml}
          <div class="feedback-explain">${escapeHtml(item.explain)}</div>
          ${tipHtml}
          ${deepDiveHtml}
        </div>
      </div>
    </article>`;
}

function showFailedReview() {
  missionOutcome = 'failed';
  document.getElementById('progress').style.width = `${Math.min((totalAnswered / Math.max(totalChallenges, 1)) * 100, 100)}%`;

  const activeLevel = levels[Math.max(0, Math.min(
    Number.isInteger(failedLevelIndex) ? failedLevelIndex : levelIndex,
    levels.length - 1
  ))] || null;
  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  const cardsHtml = failedReviewItems.length > 0
    ? failedReviewItems.map(renderFailedReviewCard).join('')
    : '<div class="failed-review-empty">No failed cards were captured for this run.</div>';

  const gameArea = document.getElementById('game-area');
  gameArea.innerHTML = `
    <div class="card failed-review-screen">
      <h2>Mission Failed — Review</h2>
      <p class="end-summary">Hearts depleted before run completion.</p>
      <div class="failed-review-stats">
        <div class="failed-review-stat"><span class="label">Score</span><span class="value">${score}</span></div>
        <div class="failed-review-stat"><span class="label">Accuracy</span><span class="value">${accuracy}%</span></div>
        <div class="failed-review-stat"><span class="label">Answered</span><span class="value">${totalAnswered}/${totalChallenges}</span></div>
        <div class="failed-review-stat"><span class="label">Failed Cards</span><span class="value">${failedReviewItems.length}</span></div>
        <div class="failed-review-stat"><span class="label">Level</span><span class="value">${escapeHtml(activeLevel ? activeLevel.title : 'N/A')}</span></div>
        <div class="failed-review-stat"><span class="label">Longest Streak</span><span class="value">${maxStreak}</span></div>
      </div>
      <div class="failed-review-actions">
        <button class="btn show restart-btn" onclick="repeatFailedLevel()">Repeat Level ↺</button>
        <button class="btn show restart-btn failed-review-secondary" onclick="restartGame()">Restart Campaign ↺</button>
      </div>
      <div class="failed-review-list">${cardsHtml}</div>
    </div>`;

  updateHUD();
}

function repeatFailedLevel() {
  const targetLevelIndex = Number.isInteger(failedLevelIndex)
    ? Math.max(0, Math.min(failedLevelIndex, levels.length - 1))
    : Math.max(0, Math.min(levelIndex, levels.length - 1));

  levelIndex = targetLevelIndex;
  questionIndex = 0;
  score = 0;
  lives = 3;
  streak = 0;
  maxStreak = 0;
  answered = false;
  cmdBuilt = [];
  usedTokens = new Set();
  wrongAnsweredIdx = -1;
  optionMap = [];
  tokenPool = [];
  totalAnswered = 0;
  totalCorrect = 0;
  completedBadges = [];
  missionOutcome = 'in_progress';
  failedReviewItems = [];
  failedLevelIndex = null;

  updateHUD();
  render();
}

const campaignLevels = normalizeLevels(rawLevelData);
campaignLevels.forEach(level => {
  if (level.shuffleQuestions !== false) {
    level.questions = shuffleLevelQuestions(level.questions);
  }
  level.questions = prioritizeQuestionsByDailyHitRatio(level.questions);
});
const levels = campaignLevels.filter(level => level.questions.length > 0);
const plannedLevels = campaignLevels.filter(level => level.questions.length === 0);
const roadmapTargetQuestions = campaignLevels.reduce((sum, level) => (
  sum + (Number.isFinite(level.targetQuestionCount) ? level.targetQuestionCount : level.questions.length)
), 0);
const totalChallenges = levels.reduce((sum, level) => sum + level.questions.length, 0);

let levelIndex = 0;
let questionIndex = 0;
let score = 0;
let lives = 3;
let streak = 0;
let maxStreak = 0;
let answered = false;
let cmdBuilt = [];
let usedTokens = new Set();
let wrongAnsweredIdx = -1;
let optionMap = [];
let tokenPool = [];
let totalAnswered = 0;
let totalCorrect = 0;
let completedBadges = [];
let missionOutcome = 'in_progress';
let failedReviewItems = [];
let failedLevelIndex = null;

function getCurrentLevel() {
  return levels[levelIndex] || null;
}

function getCurrentQuestion() {
  const level = getCurrentLevel();
  if (!level) return null;
  return level.questions[questionIndex] || null;
}

function getCompletedChallengeCount() {
  let completed = 0;
  for (let i = 0; i < levelIndex; i++) {
    completed += levels[i].questions.length;
  }

  const currentLevel = getCurrentLevel();
  if (!currentLevel) {
    return completed;
  }

  completed += Math.min(questionIndex, currentLevel.questions.length);
  return completed;
}

function updateStaticLabels() {
  const subtitle = document.getElementById('campaign-subtitle');
  if (subtitle) {
    const plannedSuffix = plannedLevels.length > 0 ? ` · ${plannedLevels.length} upcoming levels` : '';
    const roadmapSuffix = roadmapTargetQuestions > 0 ? ` · roadmap ${roadmapTargetQuestions} questions` : '';
    subtitle.textContent = `// ${totalChallenges} live challenges · ${levels.length} playable levels${plannedSuffix}${roadmapSuffix}`;
  }
}

function getLevelOptionLabel(level, index) {
  const title = String(level.title || `Level ${index}`);
  const parts = title.split('·');
  const shortTitle = (parts[parts.length - 1] || title).trim();
  return `L${index} · ${shortTitle}`;
}

function populateLevelSelector() {
  const levelSelect = document.getElementById('level-select');
  if (!levelSelect) return;

  if (levels.length === 0) {
    levelSelect.innerHTML = '<option value="">No playable levels</option>';
    levelSelect.disabled = true;
    return;
  }

  levelSelect.innerHTML = levels
    .map((level, index) => (
      `<option value="${index}">${escapeHtml(getLevelOptionLabel(level, index))}</option>`
    ))
    .join('');

  levelSelect.disabled = false;
  levelSelect.value = String(Math.min(levelIndex, levels.length - 1));
  levelSelect.onchange = handleLevelSelectChange;
}

function handleLevelSelectChange(event) {
  if (missionOutcome === 'failed') return;

  const selectedLevelIndex = Number(event.target.value);
  const isValidIndex = Number.isInteger(selectedLevelIndex)
    && selectedLevelIndex >= 0
    && selectedLevelIndex < levels.length;

  if (!isValidIndex) return;
  if (selectedLevelIndex === levelIndex && questionIndex === 0) return;

  levelIndex = selectedLevelIndex;
  questionIndex = 0;
  answered = false;
  cmdBuilt = [];
  usedTokens = new Set();
  wrongAnsweredIdx = -1;
  optionMap = [];
  tokenPool = [];

  render();
}

function updateHUD() {
  document.getElementById('score').textContent = score;
  const hearts = ['❤️ ❤️ ❤️', '❤️ ❤️ 🖤', '❤️ 🖤 🖤', '🖤 🖤 🖤'];
  document.getElementById('lives').textContent = hearts[3 - lives] || '🖤 🖤 🖤';
  document.getElementById('streak').textContent = `🔥 ${streak}`;

  const currentLevel = getCurrentLevel();
  const completedChallenges = getCompletedChallengeCount();
  const safeTotalChallenges = Math.max(totalChallenges, 1);
  const displayNumber = currentLevel
    ? Math.min(completedChallenges + 1, totalChallenges)
    : totalChallenges > 0 ? totalChallenges : 0;

  document.getElementById('qcount').textContent = `${displayNumber} / ${totalChallenges}`;
  const progressPercent = missionOutcome === 'failed'
    ? Math.min((totalAnswered / safeTotalChallenges) * 100, 100)
    : (missionOutcome === 'complete' || levelIndex >= levels.length)
      ? 100
      : Math.min((completedChallenges / safeTotalChallenges) * 100, 100);
  document.getElementById('progress').style.width = `${progressPercent}%`;

  const levelHud = document.getElementById('level-label');
  if (levelHud) {
    levelHud.textContent = currentLevel
      ? `L${levelIndex} · ${currentLevel.difficulty}`
      : levels.length > 0
        ? `L${levels.length - 1} · Complete`
        : 'No levels';
  }

  const badgesHud = document.getElementById('badges-earned');
  if (badgesHud) {
    if (completedBadges.length === 0) {
      badgesHud.textContent = '0';
    } else {
      badgesHud.innerHTML = completedBadges
        .map(b => `<span class="hud-badge" title="${escapeHtml(b.badgeName)}">${escapeHtml(b.badgeIcon)}</span>`)
        .join('');
    }
  }

  const levelSelect = document.getElementById('level-select');
  if (levelSelect && levels.length > 0) {
    const selectedIndex = currentLevel ? levelIndex : levels.length - 1;
    const selectedValue = String(selectedIndex);
    if (levelSelect.value !== selectedValue) {
      levelSelect.value = selectedValue;
    }
  }
}

function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatRichTextWithLinks(str) {
  const escaped = escapeHtml(str || '');
  return escaped.replace(
    /https?:\/\/[^\s<)]+/g,
    url => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
  );
}

function renderMeta(level, question) {
  const focusHtml = (level.focus || [])
    .map(topic => `<span class="focus-chip">${escapeHtml(topic)}</span>`)
    .join('');

  const tagsHtml = (question.tags || [])
    .map(tag => `<span class="tag-chip">#${escapeHtml(tag)}</span>`)
    .join('');

  const focusSectionHtml = focusHtml
    ? `
      <div class="meta-section">
        <div class="meta-section-label">Focus Areas</div>
        <div class="focus-topics">${focusHtml}</div>
      </div>`
    : '';

  const tagsSectionHtml = tagsHtml
    ? `
      <div class="meta-section">
        <div class="meta-section-label">Question Tags</div>
        <div class="question-tags">${tagsHtml}</div>
      </div>`
    : '';

  const levelCardHtml = level.description
    ? `
      <details class="context-level-details">
        <summary class="context-card context-level">
          <span class="context-label-row">
            <span class="context-label">Level</span>
            <span class="context-hint">details</span>
          </span>
          <span class="context-value">${escapeHtml(level.title)}</span>
        </summary>
        <div class="level-description level-description-pop">${escapeHtml(level.description)}</div>
      </details>`
    : `
      <div class="context-card context-level">
        <span class="context-label">Level</span>
        <span class="context-value">${escapeHtml(level.title)}</span>
      </div>`;

  return `
    <div class="mission-context">
      ${levelCardHtml}
      <div class="context-card context-difficulty">
        <span class="context-label">Difficulty</span>
        <span class="context-value">${escapeHtml(level.difficulty)}</span>
      </div>
      <div class="context-card context-group">
        <span class="context-label">Track</span>
        <span class="context-value">${escapeHtml(question.groupLabel)}</span>
      </div>
      ${question.isBoss ? `
        <div class="context-card context-boss">
          <span class="context-label">Mission</span>
          <span class="context-value">Boss Challenge</span>
        </div>` : ''}
    </div>
    ${focusSectionHtml}
    ${tagsSectionHtml}`;
}

function getJourneyTheme(question) {
  if (question.isBoss) {
    return {
      ...JOURNEY_THEMES.boss,
      icon: JOURNEY_ICONS.boss
    };
  }

  if (question.type === 'command') {
    return {
      ...JOURNEY_THEMES.command,
      icon: JOURNEY_ICONS.command
    };
  }

  if (question.type === 'scenario') {
    return {
      ...JOURNEY_THEMES.scenario,
      icon: JOURNEY_ICONS.scenario
    };
  }

  return {
    ...JOURNEY_THEMES.quiz,
    icon: JOURNEY_ICONS.quiz
  };
}

function renderJourneyStrip(question) {
  const maxStep = Math.max(totalChallenges, 1);
  const currentStep = Math.min(getCompletedChallengeCount() + 1, maxStep);
  const progress = maxStep <= 1
    ? 100
    : Math.round(((currentStep - 1) / (maxStep - 1)) * 100);
  const marker = Math.max(4, Math.min(progress, 96));
  const journeyTheme = getJourneyTheme(question);

  return `
    <div class="journey-strip journey-${journeyTheme.kind}">
      <div class="journey-head">
        <div class="journey-item">
          <span class="journey-icon">${JOURNEY_ICONS.knight}</span>
          <span class="journey-copy">
            <span class="journey-kicker">Knight</span>
            <span class="journey-value">On the march</span>
          </span>
        </div>
        <div class="journey-item">
          <span class="journey-icon">${JOURNEY_ICONS.road}</span>
          <span class="journey-copy">
            <span class="journey-kicker">Road</span>
            <span class="journey-value">Mile ${currentStep}/${maxStep}</span>
          </span>
        </div>
        <div class="journey-item">
          <span class="journey-icon">${journeyTheme.icon}</span>
          <span class="journey-copy">
            <span class="journey-kicker">Hindrance</span>
            <span class="journey-value">${escapeHtml(journeyTheme.label)}</span>
          </span>
        </div>
      </div>
      <div class="journey-road-track" aria-hidden="true">
        <div class="journey-road-fill" style="width: ${progress}%"></div>
        <div class="journey-road-marker" style="left: ${marker}%">
          <span class="journey-icon">${JOURNEY_ICONS.knight}</span>
        </div>
      </div>
      <p class="journey-story">${escapeHtml(journeyTheme.story)}</p>
    </div>`;
}

function getQuestionBadge(question) {
  if (question.type === 'quiz') {
    return `
      <span class="question-type question-type-quiz">
        <span class="question-type-kicker">Mode</span>
        <span class="question-type-name">Quiz</span>
      </span>`;
  }

  if (question.type === 'command') {
    return `
      <span class="question-type question-type-command">
        <span class="question-type-kicker">Mode</span>
        <span class="question-type-name">Command Builder</span>
      </span>`;
  }

  return `
    <span class="question-type question-type-scenario">
      <span class="question-type-kicker">Mode</span>
      <span class="question-type-name">Scenario</span>
    </span>`;
}

function render() {
  if (missionOutcome === 'failed') {
    showFailedReview();
    return;
  }

  if (levelIndex >= levels.length) {
    showEnd();
    return;
  }

  const level = getCurrentLevel();
  const q = getCurrentQuestion();
  if (!level || !q) {
    showEnd();
    return;
  }

  answered = false;
  cmdBuilt = [];
  usedTokens = new Set();
  wrongAnsweredIdx = -1;
  optionMap = [];
  tokenPool = [];
  updateHUD();

  const gameArea = document.getElementById('game-area');
  const ctxHtml = q.context ? `<div class="question-context">${escapeHtml(q.context)}</div>` : '';
  const metaHtml = renderMeta(level, q);
  const journeyHtml = ENABLE_JOURNEY_GAMIFICATION ? renderJourneyStrip(q) : '';
  const questionBadgeHtml = `
    <div class="badge-row">
      ${getQuestionBadge(q)}
      ${q.isBoss ? '<span class="boss-indicator">Boss Fight</span>' : ''}
    </div>`;
  const questionTodayStats = getQuestionTodayStats(q);
  const questionHitRatioHtml = `<div class="question-hit-ratio">${escapeHtml(formatTodayHitRatio(questionTodayStats))}</div>`;
  const levelProgressPercent = Math.round(((questionIndex + 1) / Math.max(level.questions.length, 1)) * 100);
  const questionLevelCounterHtml = `
    <div class="question-level-counter" aria-label="Challenge position in level">
      <span class="qlc-label">Challenge</span>
      <span class="qlc-value">
        <span class="qlc-current">${questionIndex + 1}</span>
        <span class="qlc-sep">/</span>
        <span class="qlc-total">${level.questions.length}</span>
      </span>
      <span class="qlc-track" aria-hidden="true">
        <span class="qlc-fill" style="width: ${levelProgressPercent}%"></span>
      </span>
    </div>`;

  if (q.type === 'quiz' || q.type === 'scenario') {
    optionMap = q.options.map((_, i) => i);
    fisherYatesShuffle(optionMap);
  } else {
    optionMap = [];
  }

  if (q.type === 'quiz') {
    gameArea.innerHTML = `
      <div class="card question-card">
        ${metaHtml}
        ${journeyHtml}
        ${questionBadgeHtml}
        ${questionLevelCounterHtml}
        ${questionHitRatioHtml}
        <div class="question-text">${escapeHtml(q.q)}</div>
        ${ctxHtml}
        <div class="options">
          ${optionMap.map((origIdx, dispIdx) => `
            <button class="option-btn" onclick="answerQuiz(${dispIdx})" id="opt${dispIdx}">
              <span class="option-letter">${['A', 'B', 'C', 'D'][dispIdx]}</span>
              ${escapeHtml(q.options[origIdx])}
            </button>`).join('')}
        </div>
        <div class="feedback" id="feedback"></div>
        <button class="btn" id="next-btn" onclick="nextQ()">Next Challenge →</button>
      </div>`;
  } else if (q.type === 'command') {
    tokenPool = [...q.tokens].sort(() => Math.random() - 0.5);
    gameArea.innerHTML = `
      <div class="card question-card">
        ${metaHtml}
        ${journeyHtml}
        ${questionBadgeHtml}
        ${questionLevelCounterHtml}
        ${questionHitRatioHtml}
        <div class="question-text">${escapeHtml(q.q)}</div>
        ${ctxHtml}
        <div class="cmd-area" id="cmd-display">
          ${COMMAND_PLACEHOLDER}
        </div>
        <div class="token-pool" id="token-pool">
          ${tokenPool.map((t, i) => `<span class="pool-token" id="pt${i}" onclick="addTokenByIndex(${i})">${escapeHtml(t)}</span>`).join('')}
        </div>
        <div class="cmd-actions">
          <button class="cmd-action-btn cmd-action-primary" onclick="checkCommand()">Check Command ✓</button>
          <button class="cmd-action-btn cmd-action-secondary" onclick="resetCmd()">Reset ↺</button>
        </div>
        <div class="feedback" id="feedback"></div>
        <button class="btn" id="next-btn" onclick="nextQ()">Next Challenge →</button>
      </div>`;
  } else {
    gameArea.innerHTML = `
      <div class="card question-card">
        ${metaHtml}
        ${journeyHtml}
        ${questionBadgeHtml}
        ${questionLevelCounterHtml}
        ${questionHitRatioHtml}
        <div class="question-text">${escapeHtml(q.q)}</div>
        ${ctxHtml}
        <div class="scenario-options">
          ${optionMap.map((origIdx, dispIdx) => `
            <button class="scenario-btn" onclick="answerScenario(${dispIdx})" id="sopt${dispIdx}">${escapeHtml(q.options[origIdx])}</button>`).join('')}
        </div>
        <div class="feedback" id="feedback"></div>
        <button class="btn" id="next-btn" onclick="nextQ()">Next Challenge →</button>
      </div>`;
  }
}

function answerQuiz(displayIdx) {
  if (answered) return;
  answered = true;
  const origIdx = optionMap[displayIdx];
  wrongAnsweredIdx = origIdx;
  const q = getCurrentQuestion();
  if (!q) return;

  const correct = origIdx === q.answer;
  handleResult(correct, q, origIdx);
  const correctDisplayIdx = optionMap.indexOf(q.answer);
  document.querySelectorAll('.option-btn').forEach((button, idx) => {
    button.disabled = true;
    if (idx === correctDisplayIdx) button.classList.add('correct');
    else if (idx === displayIdx && !correct) button.classList.add('wrong');
  });
}

function answerScenario(displayIdx) {
  if (answered) return;
  answered = true;
  const origIdx = optionMap[displayIdx];
  wrongAnsweredIdx = origIdx;
  const q = getCurrentQuestion();
  if (!q) return;

  const correct = origIdx === q.answer;
  handleResult(correct, q, origIdx);
  const correctDisplayIdx = optionMap.indexOf(q.answer);
  document.querySelectorAll('.scenario-btn').forEach((button, idx) => {
    button.disabled = true;
    if (idx === correctDisplayIdx) button.classList.add('correct');
    else if (idx === displayIdx && !correct) button.classList.add('wrong');
  });
}

function addToken(token, idx) {
  if (usedTokens.has(idx)) return;
  const tokenEl = document.getElementById(`pt${idx}`);
  if (!tokenEl) return;

  usedTokens.add(idx);
  tokenEl.classList.add('used');
  cmdBuilt.push({ token, idx });
  renderCmd();
}

function addTokenByIndex(idx) {
  if (idx < 0 || idx >= tokenPool.length) return;
  addToken(tokenPool[idx], idx);
}

function renderCmd() {
  const display = document.getElementById('cmd-display');
  if (!display) return;

  if (cmdBuilt.length === 0) {
    display.innerHTML = COMMAND_PLACEHOLDER;
    return;
  }

  display.innerHTML = cmdBuilt
    .map((token, idx) => `<span class="cmd-token" onclick="removeToken(${idx})">${escapeHtml(token.token)}</span>`)
    .join('');
}

function removeToken(i) {
  const removed = cmdBuilt.splice(i, 1)[0];
  if (!removed) return;

  usedTokens.delete(removed.idx);
  const tokenEl = document.getElementById(`pt${removed.idx}`);
  if (tokenEl) tokenEl.classList.remove('used');
  renderCmd();
}

function resetCmd() {
  cmdBuilt = [];
  usedTokens = new Set();
  document.querySelectorAll('.pool-token').forEach(token => token.classList.remove('used'));
  renderCmd();
}

function checkCommand() {
  if (answered) return;
  const q = getCurrentQuestion();
  if (!q) return;

  const built = cmdBuilt.map(token => token.token);
  const correct = JSON.stringify(built) === JSON.stringify(q.answer);
  answered = true;
  handleResult(correct, q, -1, built);
}

function handleResult(correct, question, chosenIdx, builtCmd) {
  totalAnswered++;
  recordQuestionTodayResult(question, correct);

  if (correct) {
    score += 10 + (streak * 2);
    streak++;
    totalCorrect++;
    maxStreak = Math.max(maxStreak, streak);
  } else {
    addFailedReviewItem(question, chosenIdx, builtCmd);
    lives = Math.max(0, lives - 1);
    streak = 0;
  }

  updateHUD();
  showFeedback(correct, question, chosenIdx, builtCmd);

  const nextBtn = document.getElementById('next-btn');
  const hasLivesLeft = lives > 0;
  if (nextBtn && hasLivesLeft) {
    const level = getCurrentLevel();
    const isLevelLastQuestion = level && questionIndex === level.questions.length - 1;
    if (isLevelLastQuestion && question.isBoss) {
      nextBtn.textContent = 'Claim Badge →';
    } else {
      nextBtn.textContent = 'Next Challenge →';
    }
    nextBtn.classList.add('show');
  }

  if (!correct && lives <= 0) {
    failedLevelIndex = levelIndex;
    missionOutcome = 'failed';
    setTimeout(() => showFailedReview(), 2800);
  }
}

function showFeedback(correct, question, chosenIdx, builtCmd) {
  const feedback = document.getElementById('feedback');
  if (!feedback) return;
  const journeyTheme = ENABLE_JOURNEY_GAMIFICATION ? getJourneyTheme(question) : null;

  feedback.className = `feedback show ${correct ? 'good' : 'bad'}`;

  let wrongReasonHtml = '';
  if (!correct && question.wrongReasons && chosenIdx >= 0 && question.wrongReasons[chosenIdx]) {
    wrongReasonHtml = `
      <div class="feedback-wrong-reason">
        <strong>❌ Why your answer was wrong:</strong>
        ${escapeHtml(question.wrongReasons[chosenIdx])}
      </div>`;
  }

  let correctAnswerHtml = '';
  if (!correct) {
    if (question.type === 'command' && question.answer) {
      correctAnswerHtml = `
        <div class="feedback-correct-box">
          <strong>✅ Correct command:</strong>
          ${escapeHtml(question.answer.join(' '))}
        </div>`;
    } else if (question.options && question.answer !== undefined) {
      correctAnswerHtml = `
        <div class="feedback-correct-box">
          <strong>✅ Correct answer:</strong>
          ${escapeHtml(question.options[question.answer])}
        </div>`;
    }
  }

  const deepDiveHtml = question.deepDive
    ? `
      <div class="feedback-deep-dive">
        <strong>🔬 Deep Dive:</strong>
        <pre class="feedback-code">${formatRichTextWithLinks(question.deepDive)}</pre>
      </div>`
    : '';

  const bossHtml = question.isBoss
    ? `<div class="feedback-boss-note">${correct ? '🏁 Boss defeated. Badge unlocked after this step.' : '⚠️ Boss challenge missed. You can still continue if you have lives left.'}</div>`
    : '';

  const feedbackHeaderHtml = ENABLE_JOURNEY_GAMIFICATION && journeyTheme
    ? `
      <span class="feedback-mode-icon">${journeyTheme.icon}</span>
      ${correct
        ? `✅ ${escapeHtml(journeyTheme.success)} +${10 + Math.max(0, (streak - 1) * 2)} pts`
        : `❌ ${escapeHtml(journeyTheme.fail)} Keep learning.`}`
    : (correct
      ? `✅ Correct! +${10 + Math.max(0, (streak - 1) * 2)} pts`
      : '❌ Not quite — learn from this!');

  feedback.innerHTML = `
    <div class="feedback-header">
      ${feedbackHeaderHtml}
    </div>
    <div class="feedback-body">
      ${wrongReasonHtml}
      ${correctAnswerHtml}
      <div class="feedback-explain">${escapeHtml(question.explain)}</div>
      <div class="feedback-tip">
        <strong>🐹 Go Tip:</strong>
        <pre class="feedback-code">${escapeHtml(question.tip)}</pre>
      </div>
      ${deepDiveHtml}
      ${bossHtml}
    </div>`;
}

function nextQ() {
  if (!answered) return;
  if (missionOutcome === 'failed' || lives <= 0) {
    showFailedReview();
    return;
  }
  if (levelIndex >= levels.length) {
    showEnd();
    return;
  }

  const level = getCurrentLevel();
  if (!level) {
    showEnd();
    return;
  }

  reprioritizeRemainingQuestions(level, questionIndex);
  questionIndex++;
  if (questionIndex >= level.questions.length) {
    if (!completedBadges.some(badge => badge.levelId === level.id)) {
      completedBadges.push({
        levelId: level.id,
        title: level.title,
        badgeIcon: level.badgeIcon,
        badgeName: level.badgeName,
        difficulty: level.difficulty
      });
    }
    showLevelComplete(level);
    return;
  }

  render();
}

function showLevelComplete(level) {
  updateHUD();

  const isFinalLevel = levelIndex === levels.length - 1;
  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  const gameArea = document.getElementById('game-area');
  gameArea.innerHTML = `
    <div class="card level-complete-screen">
      <div class="end-emoji">${escapeHtml(level.badgeIcon)}</div>
      <h2>Level Complete!</h2>
      <div class="rank-badge level-badge-claim">${escapeHtml(level.badgeName)}</div>
      <p class="end-summary">${escapeHtml(level.title)} cleared</p>
      <p>Boss challenge completed. Completion badge added.</p>
      <p>Campaign accuracy: ${accuracy}%</p>
      <button class="btn show restart-btn" onclick="${isFinalLevel ? 'showEnd()' : 'startNextLevel()'}">
        ${isFinalLevel ? 'Finish Campaign →' : `Enter ${escapeHtml(levels[levelIndex + 1].title)} →`}
      </button>
    </div>`;
}

function startNextLevel() {
  if (missionOutcome === 'failed' || lives <= 0) {
    showFailedReview();
    return;
  }

  levelIndex++;
  questionIndex = 0;

  if (levelIndex >= levels.length) {
    showEnd();
    return;
  }

  render();
}

function showEnd() {
  if (missionOutcome === 'failed') {
    showFailedReview();
    return;
  }

  missionOutcome = 'complete';
  document.getElementById('progress').style.width = '100%';

  let rank;
  let rankColor;
  let emoji;

  if (score >= 1700) {
    rank = 'Kubernetes Architect';
    rankColor = '#00d4ff';
    emoji = '🏆';
  } else if (score >= 1200) {
    rank = 'Senior SRE';
    rankColor = '#00ff88';
    emoji = '⭐';
  } else if (score >= 800) {
    rank = 'Platform Engineer';
    rankColor = '#ffd700';
    emoji = '🎯';
  } else if (score >= 450) {
    rank = 'Cluster Operator';
    rankColor = '#a78bfa';
    emoji = '🔧';
  } else {
    rank = 'Cluster Apprentice';
    rankColor = '#5a7090';
    emoji = '🌱';
  }

  const badgeHtml = completedBadges.length > 0
    ? completedBadges
      .map(badge => `<span class="earned-badge">${escapeHtml(badge.badgeIcon)} ${escapeHtml(badge.badgeName)}</span>`)
      .join('')
    : '<span class="earned-badge empty">No badges earned yet</span>';

  const gameArea = document.getElementById('game-area');
  const endTitle = 'Mission Complete!';
  const endSummaryLine = `Questions answered: ${totalAnswered} / ${totalChallenges}`;
  const statusLine = '<p>points earned</p>';

  gameArea.innerHTML = `
    <div class="card end-screen">
      <div class="end-emoji">${emoji}</div>
      <h2>${endTitle}</h2>
      <div class="score-big">${score}</div>
      ${statusLine}
      <div class="rank-badge" id="rank-badge">${rank}</div>
      <p class="end-summary">${endSummaryLine}</p>
      <p>Correct answers: ${totalCorrect}</p>
      <p>Longest streak: ${maxStreak > 0 ? '🔥 ' + maxStreak : '—'}</p>
      <div class="badge-collection">${badgeHtml}</div>
      <div class="learning-path">
        <div class="learning-path-title">🐹 Your Go + K8s Learning Path</div>
        <div class="learning-path-content">
          ✦ <strong>Now:</strong> Add /healthz, /readyz, /metrics to all your Go HTTP servers<br>
          ✦ <strong>Next:</strong> Explore client-go for Kubernetes API access from Go<br>
          ✦ <strong>Build:</strong> Write a simple operator with kubebuilder<br>
          ✦ <strong>Observe:</strong> Add OpenTelemetry tracing to your Go services<br>
          ✦ <strong>Secure:</strong> Run your Go containers as non-root with distroless images<br>
          ✦ <strong>Scale:</strong> Set up KEDA for event-driven autoscaling of Go workers<br>
          ✦ <strong>Practice:</strong> Use kind (Kubernetes in Docker) for local k8s clusters
        </div>
      </div>
      <button class="btn show restart-btn" onclick="restartGame()">Play Again ↺</button>
    </div>`;

  const rankBadge = document.getElementById('rank-badge');
  if (rankBadge) {
    rankBadge.style.backgroundColor = `${rankColor}22`;
    rankBadge.style.borderColor = rankColor;
    rankBadge.style.color = rankColor;
  }

  updateHUD();
}

function restartGame() {
  levelIndex = 0;
  questionIndex = 0;
  score = 0;
  lives = 3;
  streak = 0;
  maxStreak = 0;
  answered = false;
  cmdBuilt = [];
  usedTokens = new Set();
  wrongAnsweredIdx = -1;
  optionMap = [];
  tokenPool = [];
  totalAnswered = 0;
  totalCorrect = 0;
  completedBadges = [];
  missionOutcome = 'in_progress';
  failedReviewItems = [];
  failedLevelIndex = null;

  updateHUD();
  render();
}

updateStaticLabels();
populateLevelSelector();
render();
