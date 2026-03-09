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
const RUN_HISTORY_STORAGE_KEY = 'kubecraft_run_history_v1';
const LEGACY_TYPED_RUN_HISTORY_STORAGE_KEY = 'kubecraft_typed_run_history_v1';
const RUN_HISTORY_LIMIT = 300;
const CHALLENGE_MODE_MAIN = 'main';
const CHALLENGE_MODE_TYPED = 'typed';
const DEFAULT_CHALLENGE_CONFIG = Object.freeze({
  typedPickCount: 20,
  regularCommandPickCount: 6,
  baseQuestionTimeSec: 40
});
const QUESTION_SHORT_ID_LENGTH = 3;
const QUESTION_SHORT_ID_RADIX = 36;
const MAX_QUESTION_SHORT_IDS = QUESTION_SHORT_ID_RADIX ** QUESTION_SHORT_ID_LENGTH;
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

function normalizeChallengeConfig(config) {
  const raw = (config && typeof config === 'object') ? config : {};
  const typedPickCount = Number.isFinite(raw.typedPickCount)
    ? Math.max(1, Math.floor(raw.typedPickCount))
    : DEFAULT_CHALLENGE_CONFIG.typedPickCount;
  const regularCommandPickCount = Number.isFinite(raw.regularCommandPickCount)
    ? Math.max(1, Math.floor(raw.regularCommandPickCount))
    : DEFAULT_CHALLENGE_CONFIG.regularCommandPickCount;
  const baseQuestionTimeSec = Number.isFinite(raw.baseQuestionTimeSec)
    ? Math.max(1, Math.floor(raw.baseQuestionTimeSec))
    : DEFAULT_CHALLENGE_CONFIG.baseQuestionTimeSec;

  return {
    typedPickCount,
    regularCommandPickCount,
    baseQuestionTimeSec
  };
}

function sanitizeQuestionRequires(requires) {
  if (!Array.isArray(requires)) return [];
  return Array.from(new Set(
    requires
      .filter(item => typeof item === 'string')
      .map(item => item.trim())
      .filter(Boolean)
  ));
}

const KUBECTL_RESOURCE_ALIASES = [
  'deployment',
  'deploy',
  'service',
  'svc',
  'pod',
  'po',
  'statefulset',
  'sts',
  'daemonset',
  'ds',
  'replicaset',
  'rs',
  'job',
  'cronjob',
  'cj',
  'ingress',
  'ing',
  'namespace',
  'ns',
  'node',
  'no',
  'configmap',
  'cm',
  'secret',
  'sa',
  'pvc',
  'pv'
];

const KUBECTL_RESOURCE_REF_PATTERN = new RegExp(
  `\\b(${KUBECTL_RESOURCE_ALIASES.join('|')})\\/([a-z0-9](?:[a-z0-9._-]*[a-z0-9])?)\\b`,
  'gi'
);

function normalizeKubectlResourceRefs(value) {
  if (typeof value !== 'string') return value;
  return value.replace(KUBECTL_RESOURCE_REF_PATTERN, (_, resource, name) => `${resource} ${name}`);
}

function normalizeCommandParts(parts) {
  if (!Array.isArray(parts)) return parts;

  return parts.flatMap(part => {
    if (typeof part !== 'string') return [];
    const normalizedPart = normalizeKubectlResourceRefs(part).trim();
    return normalizedPart ? normalizedPart.split(/\s+/) : [];
  });
}

function normalizeQuestionShortId(value) {
  if (typeof value !== 'string') return '';
  const normalized = value.trim().toUpperCase();
  return /^[0-9A-Z]{3}$/.test(normalized) ? normalized : '';
}

function createQuestionShortId(sourceIndex) {
  const safeIndex = Number.isFinite(sourceIndex)
    ? Math.max(0, Math.floor(sourceIndex))
    : 0;

  if (safeIndex >= MAX_QUESTION_SHORT_IDS) {
    throw new Error(`Question short ID space exhausted at index ${safeIndex}.`);
  }

  return safeIndex
    .toString(QUESTION_SHORT_ID_RADIX)
    .toUpperCase()
    .padStart(QUESTION_SHORT_ID_LENGTH, '0');
}

function normalizeQuestion(question, level, levelId, levelQuestionIndex, sourceIndex, hasExplicitBoss) {
  const normalizedContent = question.type === 'command'
    ? {
      ...question,
      q: normalizeKubectlResourceRefs(question.q),
      context: normalizeKubectlResourceRefs(question.context),
      explain: normalizeKubectlResourceRefs(question.explain),
      tip: normalizeKubectlResourceRefs(question.tip),
      deepDive: normalizeKubectlResourceRefs(question.deepDive),
      wrongReasons: Array.isArray(question.wrongReasons)
        ? question.wrongReasons.map(item => normalizeKubectlResourceRefs(item))
        : question.wrongReasons,
      tokens: normalizeCommandParts(question.tokens),
      answer: Array.isArray(question.answer)
        ? normalizeCommandParts(question.answer)
        : normalizeKubectlResourceRefs(question.answer)
    }
    : question;
  const rawGroupId = typeof question.groupId === 'string' ? question.groupId : 'advancedTopics';
  const groupId = GROUP_CATALOG[rawGroupId] ? rawGroupId : 'advancedTopics';
  const group = GROUP_CATALOG[groupId] || GROUP_CATALOG.advancedTopics;
  const isBoss = Boolean(question.isBoss) || (!hasExplicitBoss && levelQuestionIndex === (level.questions || []).length - 1);
  const questionId = (typeof question.id === 'string' && question.id.trim())
    ? question.id.trim()
    : `${levelId}-q-${String(levelQuestionIndex + 1).padStart(2, '0')}`;
  const shortId = normalizeQuestionShortId(question.shortId) || createQuestionShortId(sourceIndex);
  const requires = sanitizeQuestionRequires(question.requires);
  const tags = Array.from(new Set([
    ...(group.tags || []),
    question.type,
    ...(Array.isArray(question.tags) ? question.tags : []),
    ...inferDynamicTags(question),
    ...(isBoss ? ['boss', 'complex'] : [])
  ].filter(Boolean))).slice(0, isBoss ? 8 : 7);

  return {
    ...normalizedContent,
    id: questionId,
    shortId,
    requires,
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
    const levelId = level.id || `level-${levelPosition + 1}`;
    const rawQuestions = Array.isArray(level.questions) ? level.questions : [];
    const hasExplicitBoss = rawQuestions.some(question => Boolean(question.isBoss));
    const questions = rawQuestions.map((question, questionIndex) => {
      const normalizedQuestion = normalizeQuestion(
        question,
        level,
        levelId,
        questionIndex,
        sourceIndex,
        hasExplicitBoss
      );
      sourceIndex++;
      return normalizedQuestion;
    });

    return {
      id: levelId,
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
      challengeConfig: normalizeChallengeConfig(level.challengeConfig),
      questions
    };
  });
}

function getQuestionShortId(question) {
  if (!question || typeof question !== 'object') return '';
  return normalizeQuestionShortId(question.shortId);
}

function buildQuestionShortIdLookup(sourceLevels) {
  const lookup = new Map();

  sourceLevels.forEach((level, sourceLevelIndex) => {
    (level.questions || []).forEach(question => {
      const shortId = getQuestionShortId(question);
      if (!shortId) return;
      if (lookup.has(shortId)) {
        throw new Error(`Duplicate question short ID detected: ${shortId}`);
      }

      lookup.set(shortId, {
        sourceLevelIndex,
        level,
        question
      });
    });
  });

  return lookup;
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

function cloneQuestionForRun(question) {
  return {
    ...question,
    options: Array.isArray(question.options) ? [...question.options] : question.options,
    wrongReasons: Array.isArray(question.wrongReasons) ? [...question.wrongReasons] : question.wrongReasons,
    tokens: Array.isArray(question.tokens) ? [...question.tokens] : question.tokens,
    answer: Array.isArray(question.answer) ? [...question.answer] : question.answer,
    requires: Array.isArray(question.requires) ? [...question.requires] : []
  };
}

function cloneLevelForRun(level, questions) {
  return {
    ...level,
    challengeConfig: normalizeChallengeConfig(level.challengeConfig),
    questions: questions.map(cloneQuestionForRun),
    runtime: null
  };
}

function sampleQuestions(sourceQuestions, targetCount) {
  if (!Array.isArray(sourceQuestions) || sourceQuestions.length === 0) return [];
  const safeTarget = Number.isFinite(targetCount) ? Math.max(1, Math.floor(targetCount)) : sourceQuestions.length;
  const actualPick = Math.min(safeTarget, sourceQuestions.length);
  if (actualPick >= sourceQuestions.length) return [...sourceQuestions];
  return fisherYatesShuffle([...sourceQuestions]).slice(0, actualPick);
}

function buildMainChallengeLevel(level) {
  const sourceQuestions = Array.isArray(level.questions) ? level.questions : [];
  const commandQuestions = sourceQuestions.filter(question => question.type === 'command');
  const selectedCommands = sampleQuestions(
    commandQuestions,
    normalizeChallengeConfig(level.challengeConfig).regularCommandPickCount
  );
  const selectedCommandIds = new Set(selectedCommands.map(question => question.id));
  const sampledQuestions = sourceQuestions.filter(question => (
    question.type !== 'command' || selectedCommandIds.has(question.id)
  ));

  return cloneLevelForRun(level, sampledQuestions);
}

function buildMainRunLevels(playableLevels) {
  return playableLevels.map(buildMainChallengeLevel);
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

function sanitizeRunHistoryEntry(rawEntry) {
  if (!rawEntry || typeof rawEntry !== 'object') return null;

  const startedAtMs = Number.isFinite(rawEntry.startedAtMs)
    ? Math.max(0, Math.floor(rawEntry.startedAtMs))
    : Date.now();
  const endedAtMs = Number.isFinite(rawEntry.endedAtMs)
    ? Math.max(startedAtMs, Math.floor(rawEntry.endedAtMs))
    : startedAtMs;
  const answered = Number.isFinite(rawEntry.answered)
    ? Math.max(0, Math.floor(rawEntry.answered))
    : 0;
  const totalQuestions = Number.isFinite(rawEntry.totalQuestions)
    ? Math.max(0, Math.floor(rawEntry.totalQuestions))
    : 0;
  const correct = Number.isFinite(rawEntry.correct)
    ? Math.max(0, Math.floor(rawEntry.correct))
    : 0;
  const score = Number.isFinite(rawEntry.score)
    ? Math.floor(rawEntry.score)
    : 0;
  const longestStreak = Number.isFinite(rawEntry.longestStreak)
    ? Math.max(0, Math.floor(rawEntry.longestStreak))
    : 0;
  const accuracy = answered > 0
    ? Math.min(100, Math.max(0, Math.round((correct / answered) * 100)))
    : 0;
  const mode = rawEntry.mode === CHALLENGE_MODE_MAIN
    ? CHALLENGE_MODE_MAIN
    : CHALLENGE_MODE_TYPED;
  const normalizedOutcome = ['complete', 'failed', 'aborted'].includes(rawEntry.outcome)
    ? rawEntry.outcome
    : 'complete';

  return {
    mode,
    startedAtMs,
    endedAtMs,
    levelId: String(rawEntry.levelId || ''),
    levelTitle: String(rawEntry.levelTitle || 'Unknown level'),
    levelDifficulty: String(rawEntry.levelDifficulty || ''),
    score,
    correct: Math.min(correct, answered),
    answered: Math.min(answered, totalQuestions || answered),
    totalQuestions,
    accuracy,
    longestStreak,
    outcome: normalizedOutcome
  };
}

function loadRunHistoryStore() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }

  try {
    let raw = window.localStorage.getItem(RUN_HISTORY_STORAGE_KEY);
    if (!raw) {
      raw = window.localStorage.getItem(LEGACY_TYPED_RUN_HISTORY_STORAGE_KEY);
    }
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(sanitizeRunHistoryEntry)
      .filter(Boolean)
      .slice(0, RUN_HISTORY_LIMIT);
  } catch (_) {
    return [];
  }
}

let runHistory = loadRunHistoryStore();

function saveRunHistoryStore() {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    window.localStorage.setItem(
      RUN_HISTORY_STORAGE_KEY,
      JSON.stringify(runHistory.slice(0, RUN_HISTORY_LIMIT))
    );
  } catch (_) {
    // Ignore storage failures (private mode, quota, etc.)
  }
}

function appendRunHistory(rawEntry) {
  const entry = sanitizeRunHistoryEntry(rawEntry);
  if (!entry) return;

  runHistory = [entry, ...runHistory].slice(0, RUN_HISTORY_LIMIT);
  saveRunHistoryStore();
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

function addTypedFailedReviewItem(question, enteredCommand) {
  if (!question || !typedRun || !Array.isArray(typedRun.failedReviewItems)) return;

  const keyBase = getQuestionStatsKey(question) || question.uid || question.q || `typed-${typedRun.questionIndex}`;
  const key = `typed:${keyBase}`;
  if (!key) return;
  if (typedRun.failedReviewItems.some(item => item.key === key)) return;

  const normalizedAttempt = canonicalizeTypedCommand(enteredCommand);
  const builtCmd = normalizedAttempt ? normalizedAttempt.split(' ') : [];

  typedRun.failedReviewItems.push({
    key,
    levelTitle: question.levelTitle || '',
    groupLabel: question.groupLabel || '',
    type: question.type || 'command',
    q: question.q || '',
    context: question.context || '',
    options: Array.isArray(question.options) ? [...question.options] : [],
    answer: Array.isArray(question.answer) ? [...question.answer] : question.answer,
    explain: question.explain || '',
    tip: question.tip || '',
    deepDive: question.deepDive || '',
    wrongReason: '',
    chosenOption: '',
    builtCmd,
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
        <div class="feedback-attempt-box">
          <strong>🛠️ Your command:</strong>
          ${escapeHtml(item.builtCmd.join(' '))}
        </div>`
      : '')
    : (item.chosenOption
      ? `
        <div class="feedback-attempt-box">
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
    ? renderFoldableFeedbackBlock(
      'feedback-tip',
      '🐹 Go Tip:',
      `<pre class="feedback-code">${escapeHtml(item.tip)}</pre>`
    )
    : '';

  const deepDiveHtml = item.deepDive
    ? renderFoldableFeedbackBlock(
      'feedback-deep-dive',
      '🔬 Deep Dive:',
      `<pre class="feedback-code">${formatRichTextWithLinks(item.deepDive)}</pre>`
    )
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

function renderFoldableFeedbackBlock(containerClass, title, contentHtml) {
  return `
      <div class="${containerClass} feedback-foldable">
        <button
          type="button"
          class="feedback-fold-toggle"
          onclick="toggleFeedbackFold(event)"
          aria-expanded="false"
        >
          <span class="feedback-fold-caret" aria-hidden="true">▸</span>
          <strong>${title}</strong>
        </button>
        <div class="feedback-fold-track">
          <div class="feedback-fold-content">
            ${contentHtml}
          </div>
        </div>
      </div>`;
}

function toggleFeedbackFold(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const toggleButton = event && event.currentTarget;
  if (!toggleButton) return;
  const section = toggleButton.closest('.feedback-foldable');
  if (!section) return;

  const isExpanded = section.classList.toggle('open');
  toggleButton.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
}

function showFailedReview() {
  missionOutcome = 'failed';
  persistMainRunIfNeeded('failed');
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

  runHistoryViewActive = false;
  activeChallengeMode = CHALLENGE_MODE_MAIN;
  directQuestionMode = false;
  directQuestionSourceLevelIndex = -1;
  clearQuestionHash();
  resetTypedRunState();
  rebuildMainRun();
  levelIndex = Math.max(0, Math.min(targetLevelIndex, levels.length - 1));
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
  beginNewMainRun();

  resetMainLevelRuntime(levels[levelIndex]);
  populateLevelSelector();
  updateStaticLabels();
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
const playableSourceLevels = campaignLevels.filter(level => level.questions.length > 0);
let levels = buildMainRunLevels(playableSourceLevels);
let totalChallenges = levels.reduce((sum, level) => sum + level.questions.length, 0);
let activeChallengeMode = CHALLENGE_MODE_MAIN;
const questionShortIdLookup = buildQuestionShortIdLookup(playableSourceLevels);
let directQuestionMode = false;
let directQuestionSourceLevelIndex = -1;

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
let runHistoryViewActive = false;
let mainRunStartedAtMs = Date.now();
let mainRunHistorySaved = false;
let typedRun = {
  sourceLevelIndex: -1,
  levelId: '',
  levelTitle: '',
  levelDifficulty: '',
  questions: [],
  questionIndex: 0,
  score: 0,
  lives: 3,
  streak: 0,
  maxStreak: 0,
  totalAnswered: 0,
  totalCorrect: 0,
  answered: false,
  missionOutcome: 'idle',
  baseQuestionTimeSec: DEFAULT_CHALLENGE_CONFIG.baseQuestionTimeSec,
  carryFromPreviousSec: 0,
  currentQuestionTimeSec: DEFAULT_CHALLENGE_CONFIG.baseQuestionTimeSec,
  questionStartedAtMs: 0,
  currentRemainingSec: DEFAULT_CHALLENGE_CONFIG.baseQuestionTimeSec,
  timerIntervalId: null,
  lastSubmissionFeedback: null,
  runStartedAtMs: 0,
  runEndedAtMs: 0,
  historySaved: false,
  failedReviewItems: []
};

function createMainLevelRuntime() {
  return {
    answeredIds: new Set(),
    askedIds: new Set(),
    currentQuestionId: null,
    hardBlocked: false
  };
}

function ensureMainLevelRuntime(level) {
  if (!level) return createMainLevelRuntime();
  if (!level.runtime) {
    level.runtime = createMainLevelRuntime();
  }
  return level.runtime;
}

function resetMainLevelRuntime(level) {
  if (!level) return;
  level.runtime = createMainLevelRuntime();
}

function resetAllMainLevelRuntime() {
  levels.forEach(resetMainLevelRuntime);
}

function rebuildMainRun() {
  levels = buildMainRunLevels(playableSourceLevels);
  totalChallenges = levels.reduce((sum, level) => sum + level.questions.length, 0);
  resetAllMainLevelRuntime();
}

function startNormalMainRunAtLevel(targetLevelIndex = 0) {
  directQuestionMode = false;
  directQuestionSourceLevelIndex = -1;
  activeChallengeMode = CHALLENGE_MODE_MAIN;
  runHistoryViewActive = false;
  clearQuestionHash();
  resetTypedRunState();
  rebuildMainRun();
  levelIndex = Math.max(0, Math.min(targetLevelIndex, levels.length - 1));
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
  beginNewMainRun();
  resetMainLevelRuntime(levels[levelIndex]);
  updateStaticLabels();
  populateLevelSelector();
  updateHUD();
  render();
  return true;
}

function getQuestionShortIdFromHash() {
  if (typeof window === 'undefined' || !window.location) return '';
  const rawHash = typeof window.location.hash === 'string'
    ? window.location.hash.slice(1)
    : '';
  if (!rawHash) return '';

  try {
    return normalizeQuestionShortId(decodeURIComponent(rawHash));
  } catch (_) {
    return normalizeQuestionShortId(rawHash);
  }
}

function clearQuestionHash() {
  if (typeof window === 'undefined' || !window.location) return;
  if (!window.location.hash) return;

  if (window.history && typeof window.history.replaceState === 'function') {
    const nextUrl = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState(null, '', nextUrl);
    return;
  }

  window.location.hash = '';
}

function replaceQuestionHash(shortId) {
  if (typeof window === 'undefined' || !window.location) return;
  const normalizedShortId = normalizeQuestionShortId(shortId);
  if (!normalizedShortId) return;

  const nextHash = `#${normalizedShortId}`;
  if (window.location.hash === nextHash) return;

  if (window.history && typeof window.history.replaceState === 'function') {
    const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`;
    window.history.replaceState(null, '', nextUrl);
    return;
  }

  window.location.hash = normalizedShortId;
}

function openQuestionByShortId(shortId) {
  const normalizedShortId = normalizeQuestionShortId(shortId);
  if (!normalizedShortId) return false;

  const target = questionShortIdLookup.get(normalizedShortId);
  if (!target) return false;

  runHistoryViewActive = false;
  activeChallengeMode = CHALLENGE_MODE_MAIN;
  directQuestionMode = true;
  directQuestionSourceLevelIndex = target.sourceLevelIndex;
  resetTypedRunState();
  levels = [cloneLevelForRun(target.level, [target.question])];
  totalChallenges = 1;
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
  beginNewMainRun();
  resetAllMainLevelRuntime();
  updateStaticLabels();
  populateLevelSelector();
  updateHUD();
  replaceQuestionHash(target.question.shortId);
  render();
  return true;
}

function exitDirectQuestionMode() {
  if (!directQuestionMode) return false;
  return startNormalMainRunAtLevel(0);
}

function handleQuestionHashChange() {
  const shortId = getQuestionShortIdFromHash();
  if (!shortId) {
    return exitDirectQuestionMode();
  }
  return openQuestionByShortId(shortId);
}

function stopTypedTimer() {
  if (typedRun.timerIntervalId !== null) {
    window.clearInterval(typedRun.timerIntervalId);
    typedRun.timerIntervalId = null;
  }
}

function resetTypedRunState() {
  stopTypedTimer();
  typedRun = {
    sourceLevelIndex: -1,
    levelId: '',
    levelTitle: '',
    levelDifficulty: '',
    questions: [],
    questionIndex: 0,
    score: 0,
    lives: 3,
    streak: 0,
    maxStreak: 0,
    totalAnswered: 0,
    totalCorrect: 0,
    answered: false,
    missionOutcome: 'idle',
    baseQuestionTimeSec: DEFAULT_CHALLENGE_CONFIG.baseQuestionTimeSec,
    carryFromPreviousSec: 0,
    currentQuestionTimeSec: DEFAULT_CHALLENGE_CONFIG.baseQuestionTimeSec,
    questionStartedAtMs: 0,
    currentRemainingSec: DEFAULT_CHALLENGE_CONFIG.baseQuestionTimeSec,
    timerIntervalId: null,
    lastSubmissionFeedback: null,
    runStartedAtMs: 0,
    runEndedAtMs: 0,
    historySaved: false,
    failedReviewItems: []
  };
}

function getCurrentLevel() {
  return levels[levelIndex] || null;
}

function getCurrentTypedQuestion() {
  return typedRun.questions[typedRun.questionIndex] || null;
}

function getValidPrerequisiteIds(question, levelQuestionIdSet) {
  if (!question || !Array.isArray(question.requires)) return [];
  return question.requires.filter(requiredId => levelQuestionIdSet.has(requiredId));
}

function isMainQuestionEligible(question, runtime, levelQuestionIdSet) {
  const validPrerequisites = getValidPrerequisiteIds(question, levelQuestionIdSet);
  return validPrerequisites.every(requiredId => runtime.answeredIds.has(requiredId));
}

function pickNextMainQuestion(level, runtime) {
  if (!level || !runtime) return null;

  const unanswered = level.questions.filter(question => !runtime.askedIds.has(question.id));
  if (unanswered.length === 0) {
    runtime.hardBlocked = false;
    return null;
  }

  const levelQuestionIdSet = new Set(level.questions.map(question => question.id));
  const eligible = unanswered.filter(question => (
    isMainQuestionEligible(question, runtime, levelQuestionIdSet)
  ));

  if (eligible.length === 0) {
    runtime.hardBlocked = true;
    return null;
  }

  runtime.hardBlocked = false;
  const bossDeferredEligible = eligible.some(question => !question.isBoss)
    ? eligible.filter(question => !question.isBoss)
    : eligible;
  const eligibleWithBuckets = bossDeferredEligible.map(question => ({
    question,
    bucket: getQuestionPriorityBucket(getQuestionTodayStats(question))
  }));
  const minBucket = Math.min(...eligibleWithBuckets.map(item => item.bucket));
  const bucketCandidates = eligibleWithBuckets
    .filter(item => item.bucket === minBucket)
    .map(item => item.question);

  fisherYatesShuffle(bucketCandidates);
  const chosen = bucketCandidates[0] || null;
  if (!chosen) return null;

  runtime.currentQuestionId = chosen.id;
  runtime.askedIds.add(chosen.id);
  return chosen;
}

function getCurrentQuestion() {
  const level = getCurrentLevel();
  if (!level) return null;

  const runtime = ensureMainLevelRuntime(level);
  if (runtime.currentQuestionId) {
    const activeQuestion = level.questions.find(question => question.id === runtime.currentQuestionId);
    if (activeQuestion) return activeQuestion;
    runtime.currentQuestionId = null;
  }

  return pickNextMainQuestion(level, runtime);
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
    subtitle.textContent = '';
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
  const selectorLevels = directQuestionMode ? playableSourceLevels : levels;

  if (selectorLevels.length === 0) {
    levelSelect.innerHTML = '<option value="">No playable levels</option>';
    levelSelect.disabled = true;
    return;
  }

  levelSelect.innerHTML = selectorLevels
    .map((level, index) => (
      `<option value="${index}">${escapeHtml(getLevelOptionLabel(level, index))}</option>`
    ))
    .join('');

  levelSelect.disabled = false;
  const selectedIndex = directQuestionMode
    ? Math.max(0, Math.min(directQuestionSourceLevelIndex, selectorLevels.length - 1))
    : Math.min(levelIndex, selectorLevels.length - 1);
  levelSelect.value = String(selectedIndex);
  levelSelect.onchange = handleLevelSelectChange;
}

function handleLevelSelectChange(event) {
  if (activeChallengeMode === CHALLENGE_MODE_TYPED) return;
  if (missionOutcome === 'failed') return;

  const selectedLevelIndex = Number(event.target.value);
  const selectorLevels = directQuestionMode ? playableSourceLevels : levels;
  const isValidIndex = Number.isInteger(selectedLevelIndex)
    && selectedLevelIndex >= 0
    && selectedLevelIndex < selectorLevels.length;

  if (!isValidIndex) return;
  if (directQuestionMode) {
    startNormalMainRunAtLevel(selectedLevelIndex);
    return;
  }
  if (selectedLevelIndex === levelIndex && questionIndex === 0) return;

  levelIndex = selectedLevelIndex;
  questionIndex = 0;
  resetMainLevelRuntime(levels[levelIndex]);
  answered = false;
  cmdBuilt = [];
  usedTokens = new Set();
  wrongAnsweredIdx = -1;
  optionMap = [];
  tokenPool = [];

  render();
}

function closeQuickMenu() {
  const panel = document.getElementById('quick-menu-panel');
  const toggleBtn = document.getElementById('menu-toggle-btn');
  if (panel) panel.classList.remove('show');
  if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
}

function toggleQuickMenu(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const panel = document.getElementById('quick-menu-panel');
  const toggleBtn = document.getElementById('menu-toggle-btn');
  if (!panel) return;

  const nextState = !panel.classList.contains('show');
  if (nextState) {
    panel.classList.add('show');
  } else {
    panel.classList.remove('show');
  }

  if (toggleBtn) {
    toggleBtn.setAttribute('aria-expanded', nextState ? 'true' : 'false');
  }
}

function updateHUD() {
  const hearts = ['❤️ ❤️ ❤️', '❤️ ❤️ 🖤', '❤️ 🖤 🖤', '🖤 🖤 🖤'];
  const modeMainButton = document.getElementById('mode-main-btn');
  const modeTypedButton = document.getElementById('mode-typed-btn');

  if (modeMainButton) {
    const isMainMode = activeChallengeMode === CHALLENGE_MODE_MAIN;
    modeMainButton.classList.toggle('active', isMainMode);
    modeMainButton.setAttribute('aria-pressed', isMainMode ? 'true' : 'false');
  }

  if (modeTypedButton) {
    const isTypedMode = activeChallengeMode === CHALLENGE_MODE_TYPED;
    modeTypedButton.classList.toggle('active', isTypedMode);
    modeTypedButton.setAttribute('aria-pressed', isTypedMode ? 'true' : 'false');
  }

  const levelHud = document.getElementById('level-label');
  const badgesHud = document.getElementById('badges-earned');
  const levelSelect = document.getElementById('level-select');
  const scoreEl = document.getElementById('score');
  const livesEl = document.getElementById('lives');
  const streakEl = document.getElementById('streak');
  const questionCountEl = document.getElementById('qcount');
  const progressEl = document.getElementById('progress');

  if (activeChallengeMode === CHALLENGE_MODE_TYPED) {
    if (scoreEl) scoreEl.textContent = String(typedRun.score);
    if (livesEl) livesEl.textContent = hearts[3 - typedRun.lives] || '🖤 🖤 🖤';
    if (streakEl) streakEl.textContent = `🔥 ${typedRun.streak}`;

    const totalTypedQuestions = typedRun.questions.length;
    const typedDisplayNumber = totalTypedQuestions > 0
      ? Math.min(typedRun.questionIndex + 1, totalTypedQuestions)
      : 0;
    if (questionCountEl) {
      questionCountEl.textContent = `${typedDisplayNumber} / ${totalTypedQuestions}`;
    }

    const safeTypedTotal = Math.max(totalTypedQuestions, 1);
    const typedProgressPercent = typedRun.missionOutcome === 'complete'
      ? 100
      : Math.min((typedRun.totalAnswered / safeTypedTotal) * 100, 100);
    if (progressEl) {
      progressEl.style.width = `${typedProgressPercent}%`;
    }

    if (levelHud) {
      levelHud.textContent = typedRun.levelTitle
        ? `Typed · ${typedRun.levelDifficulty || 'Command Drill'}`
        : 'Typed · Not started';
    }

    if (badgesHud) {
      badgesHud.textContent = '—';
    }

    if (levelSelect) {
      levelSelect.disabled = true;
    }
    return;
  }

  if (scoreEl) scoreEl.textContent = String(score);
  if (livesEl) livesEl.textContent = hearts[3 - lives] || '🖤 🖤 🖤';
  if (streakEl) streakEl.textContent = `🔥 ${streak}`;

  const currentLevel = getCurrentLevel();
  const completedChallenges = getCompletedChallengeCount();
  const safeTotalChallenges = Math.max(totalChallenges, 1);
  const displayNumber = currentLevel
    ? Math.min(completedChallenges + 1, totalChallenges)
    : totalChallenges > 0 ? totalChallenges : 0;

  if (questionCountEl) {
    questionCountEl.textContent = `${displayNumber} / ${totalChallenges}`;
  }
  const progressPercent = missionOutcome === 'failed'
    ? Math.min((totalAnswered / safeTotalChallenges) * 100, 100)
    : (missionOutcome === 'complete' || levelIndex >= levels.length)
      ? 100
      : Math.min((completedChallenges / safeTotalChallenges) * 100, 100);
  if (progressEl) {
    progressEl.style.width = `${progressPercent}%`;
  }

  if (levelHud) {
    levelHud.textContent = currentLevel
      ? `L${levelIndex} · ${currentLevel.difficulty}`
      : levels.length > 0
        ? `L${levels.length - 1} · Complete`
        : 'No levels';
  }

  if (badgesHud) {
    if (completedBadges.length === 0) {
      badgesHud.textContent = '0';
    } else {
      badgesHud.innerHTML = completedBadges
        .map(b => `<span class="hud-badge" title="${escapeHtml(b.badgeName)}">${escapeHtml(b.badgeIcon)}</span>`)
        .join('');
    }
  }

  if (levelSelect && levels.length > 0) {
    const selectedIndex = currentLevel ? levelIndex : levels.length - 1;
    const selectedValue = String(selectedIndex);
    if (levelSelect.value !== selectedValue) {
      levelSelect.value = selectedValue;
    }
    levelSelect.disabled = false;
  }
}

function setChallengeMode(mode) {
  if (mode === CHALLENGE_MODE_TYPED) {
    if (activeChallengeMode === CHALLENGE_MODE_TYPED) {
      if (runHistoryViewActive) {
        runHistoryViewActive = false;
        render();
      }
      return;
    }

    startTypedChallenge();
    return;
  }

  if (mode === CHALLENGE_MODE_MAIN) {
    if (activeChallengeMode === CHALLENGE_MODE_MAIN) {
      if (runHistoryViewActive) {
        runHistoryViewActive = false;
        render();
      }
      return;
    }

    returnToMainChallenge();
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

function renderQuestionShortId(question) {
  const shortId = getQuestionShortId(question);
  if (!shortId) return '';
  return `<div class="question-short-id" aria-label="Question ID">${escapeHtml(shortId)}</div>`;
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

function canonicalizeTypedCommand(value) {
  return normalizeKubectlResourceRefs(String(value || ''))
    .trim()
    .replace(/\s+/g, ' ');
}

function getCommandAnswerText(question) {
  if (!question) return '';
  if (Array.isArray(question.answer)) return question.answer.join(' ');
  return canonicalizeTypedCommand(question.answer);
}

function formatSignedTimerSeconds(seconds) {
  if (!Number.isFinite(seconds)) return '0s';
  if (Math.abs(seconds) < 0.05) return '0s';
  if (seconds > 0) return `${Math.ceil(seconds)}s`;
  return `${Math.floor(seconds)}s`;
}

function getTypedTimerToneClass(seconds) {
  if (seconds > 0.05) return 'typed-timer-positive';
  if (seconds < -0.05) return 'typed-timer-negative';
  return 'typed-timer-zero';
}

function updateTypedTimerDisplay() {
  if (activeChallengeMode !== CHALLENGE_MODE_TYPED) return;
  const timerValueEl = document.getElementById('typed-timer-value');
  if (!timerValueEl) return;

  if (!typedRun.answered) {
    const elapsedSec = (Date.now() - typedRun.questionStartedAtMs) / 1000;
    typedRun.currentRemainingSec = typedRun.currentQuestionTimeSec - elapsedSec;
  }

  timerValueEl.textContent = formatSignedTimerSeconds(typedRun.currentRemainingSec);
  timerValueEl.classList.remove('typed-timer-positive', 'typed-timer-zero', 'typed-timer-negative');
  timerValueEl.classList.add(getTypedTimerToneClass(typedRun.currentRemainingSec));
}

function startTypedQuestionTimer() {
  stopTypedTimer();
  typedRun.questionStartedAtMs = Date.now();
  typedRun.currentRemainingSec = typedRun.currentQuestionTimeSec;
  updateTypedTimerDisplay();
  typedRun.timerIntervalId = window.setInterval(updateTypedTimerDisplay, 200);
}

function normalizeRunOutcome(outcome) {
  if (outcome === 'failed') return 'failed';
  if (outcome === 'aborted') return 'aborted';
  return 'complete';
}

function persistTypedRunIfNeeded(outcomeOverride) {
  if (!typedRun || typedRun.historySaved) return;
  if (!typedRun.levelTitle && !typedRun.levelId) return;

  const startedAtMs = Number.isFinite(typedRun.runStartedAtMs) && typedRun.runStartedAtMs > 0
    ? typedRun.runStartedAtMs
    : Date.now();
  const endedAtMs = Date.now();
  const answeredCount = Number.isFinite(typedRun.totalAnswered)
    ? Math.max(0, Math.floor(typedRun.totalAnswered))
    : 0;
  const totalQuestions = Array.isArray(typedRun.questions) ? typedRun.questions.length : 0;
  const correctCount = Number.isFinite(typedRun.totalCorrect)
    ? Math.max(0, Math.floor(typedRun.totalCorrect))
    : 0;
  const normalizedOutcome = normalizeRunOutcome(
    outcomeOverride || typedRun.missionOutcome
  );

  appendRunHistory({
    mode: CHALLENGE_MODE_TYPED,
    startedAtMs,
    endedAtMs,
    levelId: typedRun.levelId,
    levelTitle: typedRun.levelTitle,
    levelDifficulty: typedRun.levelDifficulty,
    score: typedRun.score,
    correct: correctCount,
    answered: answeredCount,
    totalQuestions,
    longestStreak: typedRun.maxStreak,
    outcome: normalizedOutcome
  });

  typedRun.historySaved = true;
  typedRun.runEndedAtMs = endedAtMs;
}

function beginNewMainRun() {
  mainRunStartedAtMs = Date.now();
  mainRunHistorySaved = false;
}

function getMainRunLevelTitle() {
  const level = levels[Math.max(0, Math.min(levelIndex, levels.length - 1))] || null;
  return level ? level.title : 'Campaign';
}

function persistMainRunIfNeeded(outcomeOverride) {
  if (mainRunHistorySaved) return;

  const normalizedOutcome = normalizeRunOutcome(outcomeOverride || missionOutcome);
  const hasProgress = totalAnswered > 0 || totalCorrect > 0 || score > 0;
  if (normalizedOutcome === 'aborted' && !hasProgress) return;

  const startedAtMs = Number.isFinite(mainRunStartedAtMs) && mainRunStartedAtMs > 0
    ? mainRunStartedAtMs
    : Date.now();
  const endedAtMs = Date.now();

  appendRunHistory({
    mode: CHALLENGE_MODE_MAIN,
    startedAtMs,
    endedAtMs,
    levelId: '',
    levelTitle: getMainRunLevelTitle(),
    levelDifficulty: 'Campaign',
    score,
    correct: totalCorrect,
    answered: totalAnswered,
    totalQuestions: totalChallenges,
    longestStreak: maxStreak,
    outcome: normalizedOutcome
  });

  mainRunHistorySaved = true;
}

function formatRunTimestamp(timestampMs) {
  if (!Number.isFinite(timestampMs) || timestampMs <= 0) return '—';
  return new Date(timestampMs).toLocaleString();
}

function getRunOutcomeLabel(outcome) {
  if (outcome === 'failed') return 'Failed';
  if (outcome === 'aborted') return 'Aborted';
  return 'Complete';
}

function getRunOutcomeClass(outcome) {
  if (outcome === 'failed') return 'typed-history-outcome-failed';
  if (outcome === 'aborted') return 'typed-history-outcome-aborted';
  return 'typed-history-outcome-complete';
}

function getRunModeLabel(mode) {
  return mode === CHALLENGE_MODE_MAIN ? 'Main' : 'Typed';
}

function renderRunHistoryScreen() {
  const gameArea = document.getElementById('game-area');
  if (!gameArea) return;

  const rowsHtml = runHistory.length > 0
    ? runHistory.map((run, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(formatRunTimestamp(run.endedAtMs || run.startedAtMs))}</td>
        <td>${escapeHtml(getRunModeLabel(run.mode))}</td>
        <td>${escapeHtml(run.levelTitle || 'N/A')}</td>
        <td>${run.score}</td>
        <td>${run.accuracy}%</td>
        <td>${run.answered} / ${run.totalQuestions}</td>
        <td>${run.longestStreak > 0 ? `🔥 ${run.longestStreak}` : '—'}</td>
        <td class="typed-history-outcome ${getRunOutcomeClass(run.outcome)}">${escapeHtml(getRunOutcomeLabel(run.outcome))}</td>
      </tr>
    `).join('')
    : `
      <tr>
        <td colspan="9" class="typed-history-empty">No runs saved yet.</td>
      </tr>
    `;

  gameArea.innerHTML = `
    <div class="card typed-history-screen">
      <h2>Runs History</h2>
      <p class="end-summary">Saved runs: ${runHistory.length}</p>
      <div class="typed-history-table-wrap">
        <table class="typed-history-table">
          <thead>
            <tr>
              <th>#</th>
              <th>When</th>
              <th>Mode</th>
              <th>Level</th>
              <th>Score</th>
              <th>Accuracy</th>
              <th>Answered</th>
              <th>Longest Streak</th>
              <th>Outcome</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
      <div class="typed-actions">
        <button class="btn show" onclick="closeRunHistory()">Back</button>
      </div>
    </div>`;

  updateHUD();
}

function pauseTypedRunTimerForHistory() {
  if (activeChallengeMode !== CHALLENGE_MODE_TYPED) return;
  if (typedRun.missionOutcome !== 'running' || typedRun.answered) return;
  if (typedRun.questionStartedAtMs <= 0) return;

  const elapsedSec = (Date.now() - typedRun.questionStartedAtMs) / 1000;
  typedRun.currentRemainingSec = typedRun.currentQuestionTimeSec - elapsedSec;
  typedRun.currentQuestionTimeSec = typedRun.currentRemainingSec;
  typedRun.questionStartedAtMs = 0;
}

function openRunHistory() {
  closeQuickMenu();
  pauseTypedRunTimerForHistory();
  stopTypedTimer();
  runHistoryViewActive = true;
  runHistory = loadRunHistoryStore();
  renderRunHistoryScreen();
}

function closeRunHistory() {
  runHistoryViewActive = false;
  render();
}

function openTypedRunHistory() {
  openRunHistory();
}

function closeTypedRunHistory() {
  closeRunHistory();
}

function renderTypedFailedReview() {
  persistTypedRunIfNeeded('failed');
  stopTypedTimer();
  const gameArea = document.getElementById('game-area');
  if (!gameArea) return;

  const totalQuestions = typedRun.questions.length;
  const accuracy = typedRun.totalAnswered > 0
    ? Math.round((typedRun.totalCorrect / typedRun.totalAnswered) * 100)
    : 0;
  const cardsHtml = typedRun.failedReviewItems.length > 0
    ? typedRun.failedReviewItems.map(renderFailedReviewCard).join('')
    : '<div class="failed-review-empty">No failed cards were captured for this typed run.</div>';
  const hasTypedSource = Number.isInteger(typedRun.sourceLevelIndex)
    && typedRun.sourceLevelIndex >= 0
    && typedRun.sourceLevelIndex < playableSourceLevels.length;
  const retryButtonHtml = hasTypedSource
    ? `<button class="btn show restart-btn" onclick="startTypedChallenge(${typedRun.sourceLevelIndex})">Repeat Typed Run ↺</button>`
    : '';

  gameArea.innerHTML = `
    <div class="card failed-review-screen">
      <h2>Mission Failed — Review</h2>
      <p class="end-summary">Typed run ended with no hearts left.</p>
      <div class="failed-review-stats">
        <div class="failed-review-stat"><span class="label">Score</span><span class="value">${typedRun.score}</span></div>
        <div class="failed-review-stat"><span class="label">Accuracy</span><span class="value">${accuracy}%</span></div>
        <div class="failed-review-stat"><span class="label">Answered</span><span class="value">${typedRun.totalAnswered}/${totalQuestions}</span></div>
        <div class="failed-review-stat"><span class="label">Failed Cards</span><span class="value">${typedRun.failedReviewItems.length}</span></div>
        <div class="failed-review-stat"><span class="label">Level</span><span class="value">${escapeHtml(typedRun.levelTitle || 'N/A')}</span></div>
        <div class="failed-review-stat"><span class="label">Longest Streak</span><span class="value">${typedRun.maxStreak}</span></div>
      </div>
      <div class="failed-review-actions">
        ${retryButtonHtml}
        <button class="btn show restart-btn failed-review-secondary" onclick="returnToMainChallenge()">Back to Main Challenge</button>
      </div>
      <div class="failed-review-list">${cardsHtml}</div>
    </div>`;
}

function renderTypedRunSummary() {
  if (typedRun.missionOutcome === 'complete' || typedRun.missionOutcome === 'failed') {
    persistTypedRunIfNeeded(typedRun.missionOutcome);
  }
  stopTypedTimer();
  const gameArea = document.getElementById('game-area');
  if (!gameArea) return;

  const totalQuestions = typedRun.questions.length;
  const accuracy = typedRun.totalAnswered > 0
    ? Math.round((typedRun.totalCorrect / typedRun.totalAnswered) * 100)
    : 0;
  const summaryTitle = typedRun.missionOutcome === 'failed'
    ? 'Typed Challenge Failed'
    : 'Typed Challenge Complete';
  const summaryLine = typedRun.missionOutcome === 'failed'
    ? 'Hearts depleted. Review and retry to improve command fluency.'
    : 'Run finished. Keep drilling until commands become muscle memory.';
  const hasTypedSource = Number.isInteger(typedRun.sourceLevelIndex)
    && typedRun.sourceLevelIndex >= 0
    && typedRun.sourceLevelIndex < playableSourceLevels.length;

  gameArea.innerHTML = `
    <div class="card end-screen">
      <h2>${summaryTitle}</h2>
      <p class="end-summary">${summaryLine}</p>
      <p>Level: ${escapeHtml(typedRun.levelTitle || 'N/A')}</p>
      <p>Score: ${typedRun.score}</p>
      <p>Accuracy: ${accuracy}%</p>
      <p>Answered: ${typedRun.totalAnswered} / ${totalQuestions}</p>
      <p>Longest streak: ${typedRun.maxStreak > 0 ? `🔥 ${typedRun.maxStreak}` : '—'}</p>
      <div class="typed-actions">
        ${hasTypedSource ? `<button class="btn show" onclick="startTypedChallenge(${typedRun.sourceLevelIndex})">Retry Typed Challenge ↺</button>` : ''}
        <button class="btn typed-action-secondary" onclick="returnToMainChallenge()">Back to Main Challenge</button>
      </div>
    </div>`;
}

function renderMainDependencyBlocked(level) {
  const gameArea = document.getElementById('game-area');
  if (!gameArea) return;

  gameArea.innerHTML = `
    <div class="card failed-review-screen">
      <h2>Challenge Flow Blocked</h2>
      <p class="end-summary">No eligible next question could be selected for this level.</p>
      <p>Likely cause: prerequisite cycle in this level's question graph.</p>
      <div class="failed-review-actions">
        <button class="btn show restart-btn" onclick="restartGame()">Restart Campaign ↺</button>
        <button class="btn show restart-btn failed-review-secondary" onclick="startTypedChallenge(${levelIndex})">Run Typed Challenge →</button>
      </div>
      <p class="question-hit-ratio">Affected level: ${escapeHtml(level ? level.title : 'Unknown level')}</p>
    </div>`;
}

function renderTypedChallenge() {
  if (typedRun.missionOutcome === 'failed') {
    renderTypedFailedReview();
    updateHUD();
    return;
  }

  if (typedRun.missionOutcome === 'complete') {
    renderTypedRunSummary();
    updateHUD();
    return;
  }

  const sourceLevel = playableSourceLevels[typedRun.sourceLevelIndex] || null;
  const q = getCurrentTypedQuestion();
  if (!q || !sourceLevel) {
    typedRun.missionOutcome = typedRun.questions.length === 0 ? 'complete' : typedRun.missionOutcome;
    renderTypedRunSummary();
    updateHUD();
    return;
  }

  const gameArea = document.getElementById('game-area');
  if (!gameArea) return;
  const ctxHtml = q.context ? `<div class="question-context">${escapeHtml(q.context)}</div>` : '';
  const metaHtml = renderMeta(sourceLevel, q);
  const questionShortIdHtml = renderQuestionShortId(q);
  const levelProgressPercent = Math.round(((typedRun.questionIndex + 1) / Math.max(typedRun.questions.length, 1)) * 100);
  const questionLevelCounterHtml = `
    <div class="question-level-counter" aria-label="Challenge position in typed command run">
      <span class="qlc-label">Typed Challenge</span>
      <span class="qlc-value">
        <span class="qlc-current">${typedRun.questionIndex + 1}</span>
        <span class="qlc-sep">/</span>
        <span class="qlc-total">${typedRun.questions.length}</span>
      </span>
      <span class="qlc-track" aria-hidden="true">
        <span class="qlc-fill" style="width: ${levelProgressPercent}%"></span>
      </span>
    </div>`;
  const nextButtonLabel = typedRun.questionIndex >= typedRun.questions.length - 1
    ? 'Finish Typed Run →'
    : 'Next Typed Challenge →';
  const nextActionButtonHtml = typedRun.answered
    ? `<button class="btn show" onclick="nextTypedQuestion()">${nextButtonLabel}</button>`
    : '';
  const feedback = typedRun.lastSubmissionFeedback;
  const feedbackClass = feedback
    ? `feedback show ${feedback.correct ? 'good' : 'bad'}`
    : 'feedback';
  const feedbackHtml = feedback
    ? `
      <div class="feedback-header">${feedback.correct ? '✅ Correct command syntax' : '❌ Command mismatch'}</div>
      <div class="feedback-body">
        <div class="feedback-correct-box">
          <strong>🛠️ Entered command:</strong>
          ${escapeHtml(feedback.enteredCommand || '∅')}
        </div>
        <div class="feedback-correct-box">
          <strong>✅ Correct command:</strong>
          ${escapeHtml(feedback.correctCommand)}
        </div>
        <div class="feedback-correct-box">
          <strong>⏱️ Next question budget:</strong>
          ${formatSignedTimerSeconds(feedback.nextQuestionTimeSec)}
        </div>
      </div>`
    : '';

  gameArea.innerHTML = `
    <div class="card question-card typed-command-card">
      ${metaHtml}
      <div class="badge-row">
        <span class="question-type question-type-command">
          <span class="question-type-kicker">Mode</span>
          <span class="question-type-name">Typed Command</span>
        </span>
      </div>
      ${questionLevelCounterHtml}
      <div class="typed-timer-row">
        <span class="typed-timer-label">Timer</span>
        <span id="typed-timer-value" class="typed-timer-value ${getTypedTimerToneClass(typedRun.currentRemainingSec)}">${formatSignedTimerSeconds(typedRun.currentRemainingSec)}</span>
      </div>
      <div class="question-text">${escapeHtml(q.q)}</div>
      ${ctxHtml}
      <div class="typed-input-row">
        <input
          id="typed-command-input"
          class="typed-command-input"
          type="text"
          placeholder="Type full kubectl command..."
          autocomplete="off"
          spellcheck="false"
          onkeydown="handleTypedCommandInputKeydown(event)"
          ${typedRun.answered ? 'disabled' : ''}
        />
        <button class="cmd-action-btn cmd-action-primary" onclick="submitTypedCommand()" ${typedRun.answered ? 'disabled' : ''}>
          Submit Command ✓
        </button>
      </div>
      <div class="${feedbackClass} typed-feedback" id="typed-feedback">
        ${feedbackHtml}
      </div>
      <div class="typed-actions">
        ${nextActionButtonHtml}
        <button class="btn typed-action-secondary" onclick="returnToMainChallenge()">Return to Main Challenge</button>
      </div>
      ${questionShortIdHtml}
    </div>`;

  if (!typedRun.answered) {
    const input = document.getElementById('typed-command-input');
    if (input) input.focus();
    if (typedRun.timerIntervalId === null) {
      startTypedQuestionTimer();
    } else {
      updateTypedTimerDisplay();
    }
  } else {
    stopTypedTimer();
    updateTypedTimerDisplay();
  }

  updateHUD();
}

function render() {
  if (runHistoryViewActive) {
    renderRunHistoryScreen();
    return;
  }

  if (activeChallengeMode === CHALLENGE_MODE_TYPED) {
    renderTypedChallenge();
    return;
  }

  if (missionOutcome === 'failed') {
    showFailedReview();
    return;
  }

  if (levelIndex >= levels.length) {
    showEnd();
    return;
  }

  const level = getCurrentLevel();
  const runtime = ensureMainLevelRuntime(level);
  const q = getCurrentQuestion();
  if (!level) {
    showEnd();
    return;
  }
  if (!q) {
    if (runtime.hardBlocked) {
      updateHUD();
      renderMainDependencyBlocked(level);
      return;
    }
    if (questionIndex >= level.questions.length) {
      showLevelComplete(level);
      return;
    }
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
  const questionShortIdHtml = renderQuestionShortId(q);
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
        ${questionShortIdHtml}
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
        ${questionShortIdHtml}
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
        ${questionShortIdHtml}
      </div>`;
  }
}

function answerQuiz(displayIdx) {
  if (activeChallengeMode !== CHALLENGE_MODE_MAIN) return;
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
  if (activeChallengeMode !== CHALLENGE_MODE_MAIN) return;
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
  if (activeChallengeMode !== CHALLENGE_MODE_MAIN) return;
  if (usedTokens.has(idx)) return;
  const tokenEl = document.getElementById(`pt${idx}`);
  if (!tokenEl) return;

  usedTokens.add(idx);
  tokenEl.classList.add('used');
  cmdBuilt.push({ token, idx });
  renderCmd();
}

function addTokenByIndex(idx) {
  if (activeChallengeMode !== CHALLENGE_MODE_MAIN) return;
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
  if (activeChallengeMode !== CHALLENGE_MODE_MAIN) return;
  const removed = cmdBuilt.splice(i, 1)[0];
  if (!removed) return;

  usedTokens.delete(removed.idx);
  const tokenEl = document.getElementById(`pt${removed.idx}`);
  if (tokenEl) tokenEl.classList.remove('used');
  renderCmd();
}

function resetCmd() {
  if (activeChallengeMode !== CHALLENGE_MODE_MAIN) return;
  cmdBuilt = [];
  usedTokens = new Set();
  document.querySelectorAll('.pool-token').forEach(token => token.classList.remove('used'));
  renderCmd();
}

function checkCommand() {
  if (activeChallengeMode !== CHALLENGE_MODE_MAIN) return;
  if (answered) return;
  const q = getCurrentQuestion();
  if (!q) return;

  const built = cmdBuilt.map(token => token.token);
  const correct = JSON.stringify(built) === JSON.stringify(q.answer);
  answered = true;
  handleResult(correct, q, -1, built);
}

function handleTypedCommandInputKeydown(event) {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  if (typedRun.answered) {
    nextTypedQuestion();
    return;
  }
  submitTypedCommand();
}

function startTypedChallenge(sourceLevelIndexOverride) {
  closeQuickMenu();
  if (activeChallengeMode === CHALLENGE_MODE_TYPED && !typedRun.historySaved) {
    const currentOutcome = typedRun.missionOutcome === 'running'
      ? 'aborted'
      : typedRun.missionOutcome;
    persistTypedRunIfNeeded(currentOutcome);
  }

  runHistoryViewActive = false;
  const fallbackLevelIndex = directQuestionMode && Number.isInteger(directQuestionSourceLevelIndex)
    ? Math.max(0, Math.min(directQuestionSourceLevelIndex, playableSourceLevels.length - 1))
    : Math.max(0, Math.min(levelIndex, playableSourceLevels.length - 1));
  const sourceLevelIndex = Number.isInteger(sourceLevelIndexOverride)
    ? sourceLevelIndexOverride
    : fallbackLevelIndex;
  const sourceLevel = playableSourceLevels[sourceLevelIndex] || null;
  if (!sourceLevel) return;

  const challengeConfig = normalizeChallengeConfig(sourceLevel.challengeConfig);
  const commandQuestions = sourceLevel.questions.filter(question => question.type === 'command');
  const sampledTypedQuestions = sampleQuestions(commandQuestions, challengeConfig.typedPickCount)
    .map(cloneQuestionForRun);
  fisherYatesShuffle(sampledTypedQuestions);

  stopTypedTimer();
  typedRun = {
    sourceLevelIndex,
    levelId: sourceLevel.id,
    levelTitle: sourceLevel.title,
    levelDifficulty: sourceLevel.difficulty,
    questions: sampledTypedQuestions,
    questionIndex: 0,
    score: 0,
    lives: 3,
    streak: 0,
    maxStreak: 0,
    totalAnswered: 0,
    totalCorrect: 0,
    answered: false,
    missionOutcome: sampledTypedQuestions.length > 0 ? 'running' : 'complete',
    baseQuestionTimeSec: challengeConfig.baseQuestionTimeSec,
    carryFromPreviousSec: 0,
    currentQuestionTimeSec: challengeConfig.baseQuestionTimeSec,
    questionStartedAtMs: 0,
    currentRemainingSec: challengeConfig.baseQuestionTimeSec,
    timerIntervalId: null,
    lastSubmissionFeedback: null,
    runStartedAtMs: Date.now(),
    runEndedAtMs: 0,
    historySaved: false,
    failedReviewItems: []
  };

  activeChallengeMode = CHALLENGE_MODE_TYPED;
  updateHUD();
  render();
}

function submitTypedCommand() {
  if (activeChallengeMode !== CHALLENGE_MODE_TYPED) return;
  if (typedRun.missionOutcome !== 'running') return;
  if (typedRun.answered) return;

  const question = getCurrentTypedQuestion();
  if (!question) return;

  const input = document.getElementById('typed-command-input');
  const enteredCommand = input ? input.value : '';
  const normalizedEntered = canonicalizeTypedCommand(enteredCommand);
  const correctCommand = getCommandAnswerText(question);
  const normalizedCorrect = canonicalizeTypedCommand(correctCommand);
  const isCorrect = normalizedEntered === normalizedCorrect;
  const elapsedSec = typedRun.questionStartedAtMs > 0
    ? (Date.now() - typedRun.questionStartedAtMs) / 1000
    : 0;
  const remainingSec = typedRun.currentQuestionTimeSec - elapsedSec;

  typedRun.currentRemainingSec = remainingSec;
  typedRun.answered = true;
  typedRun.totalAnswered++;
  recordQuestionTodayResult(question, isCorrect);

  if (isCorrect) {
    typedRun.score += 10 + (typedRun.streak * 2);
    typedRun.streak++;
    typedRun.totalCorrect++;
    typedRun.maxStreak = Math.max(typedRun.maxStreak, typedRun.streak);
    typedRun.carryFromPreviousSec = remainingSec;
  } else {
    addTypedFailedReviewItem(question, enteredCommand);
    typedRun.lives = Math.max(0, typedRun.lives - 1);
    typedRun.streak = 0;
    typedRun.carryFromPreviousSec = 0;
  }

  typedRun.lastSubmissionFeedback = {
    correct: isCorrect,
    enteredCommand: canonicalizeTypedCommand(enteredCommand),
    correctCommand: normalizedCorrect,
    remainingSec,
    nextQuestionTimeSec: typedRun.baseQuestionTimeSec + typedRun.carryFromPreviousSec
  };

  stopTypedTimer();
  if (!isCorrect && typedRun.lives <= 0) {
    typedRun.missionOutcome = 'failed';
    persistTypedRunIfNeeded('failed');
  }

  updateHUD();
  render();
}

function nextTypedQuestion() {
  if (activeChallengeMode !== CHALLENGE_MODE_TYPED) return;
  if (!typedRun.answered) return;

  if (typedRun.missionOutcome === 'failed') {
    render();
    return;
  }

  if (typedRun.questionIndex >= typedRun.questions.length - 1) {
    typedRun.missionOutcome = 'complete';
    persistTypedRunIfNeeded('complete');
    stopTypedTimer();
    render();
    return;
  }

  typedRun.questionIndex++;
  typedRun.answered = false;
  typedRun.lastSubmissionFeedback = null;
  typedRun.currentQuestionTimeSec = typedRun.baseQuestionTimeSec + typedRun.carryFromPreviousSec;
  typedRun.questionStartedAtMs = 0;
  typedRun.currentRemainingSec = typedRun.currentQuestionTimeSec;
  stopTypedTimer();
  render();
}

function returnToMainChallenge() {
  if (activeChallengeMode !== CHALLENGE_MODE_TYPED) {
    runHistoryViewActive = false;
    render();
    return;
  }

  const leaveOutcome = typedRun.missionOutcome === 'running'
    ? 'aborted'
    : typedRun.missionOutcome;
  persistTypedRunIfNeeded(leaveOutcome);
  stopTypedTimer();
  runHistoryViewActive = false;
  activeChallengeMode = CHALLENGE_MODE_MAIN;
  updateHUD();
  render();
}

function handleResult(correct, question, chosenIdx, builtCmd) {
  if (activeChallengeMode !== CHALLENGE_MODE_MAIN) return;
  const isReviewMode = directQuestionMode;

  const level = getCurrentLevel();
  if (!isReviewMode) {
    const runtime = ensureMainLevelRuntime(level);
    if (question && typeof question.id === 'string' && question.id) {
      runtime.answeredIds.add(question.id);
    }

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
  }

  updateHUD();
  showFeedback(correct, question, chosenIdx, builtCmd);

  const nextBtn = document.getElementById('next-btn');
  const hasLivesLeft = isReviewMode || lives > 0;
  if (nextBtn && hasLivesLeft) {
    if (isReviewMode) {
      nextBtn.textContent = 'Leave Review →';
    } else {
      const isLevelLastQuestion = level && questionIndex === level.questions.length - 1;
      if (isLevelLastQuestion && question.isBoss) {
        nextBtn.textContent = 'Claim Badge →';
      } else {
        nextBtn.textContent = 'Next Challenge →';
      }
    }
    nextBtn.classList.add('show');
  }

  if (!isReviewMode && !correct && lives <= 0) {
    failedLevelIndex = levelIndex;
    missionOutcome = 'failed';
    setTimeout(() => {
      if (activeChallengeMode === CHALLENGE_MODE_MAIN && missionOutcome === 'failed') {
        showFailedReview();
      }
    }, 2800);
  }
}

function showFeedback(correct, question, chosenIdx, builtCmd) {
  const feedback = document.getElementById('feedback');
  if (!feedback) return;
  const journeyTheme = ENABLE_JOURNEY_GAMIFICATION ? getJourneyTheme(question) : null;
  const isReviewMode = directQuestionMode;

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

  const tipHtml = question.tip
    ? renderFoldableFeedbackBlock(
      'feedback-tip',
      '🐹 Go Tip:',
      `<pre class="feedback-code">${escapeHtml(question.tip)}</pre>`
    )
    : '';

  const deepDiveHtml = question.deepDive
    ? renderFoldableFeedbackBlock(
      'feedback-deep-dive',
      '🔬 Deep Dive:',
      `<pre class="feedback-code">${formatRichTextWithLinks(question.deepDive)}</pre>`
    )
    : '';

  const bossHtml = question.isBoss
    ? `<div class="feedback-boss-note">${isReviewMode
      ? 'Review mode: boss questions do not award badges here.'
      : (correct ? '🏁 Boss defeated. Badge unlocked after this step.' : '⚠️ Boss challenge missed. You can still continue if you have lives left.')}</div>`
    : '';

  const feedbackHeaderHtml = isReviewMode
    ? (correct ? '✅ Correct' : '❌ Not quite — learn from this!')
    : (ENABLE_JOURNEY_GAMIFICATION && journeyTheme
    ? `
      <span class="feedback-mode-icon">${journeyTheme.icon}</span>
      ${correct
        ? `✅ ${escapeHtml(journeyTheme.success)} +${10 + Math.max(0, (streak - 1) * 2)} pts`
        : `❌ ${escapeHtml(journeyTheme.fail)} Keep learning.`}`
    : (correct
      ? `✅ Correct! +${10 + Math.max(0, (streak - 1) * 2)} pts`
      : '❌ Not quite — learn from this!'));

  feedback.innerHTML = `
    <div class="feedback-header">
      ${feedbackHeaderHtml}
    </div>
    <div class="feedback-body">
      ${wrongReasonHtml}
      ${correctAnswerHtml}
      <div class="feedback-explain">${escapeHtml(question.explain)}</div>
      ${tipHtml}
      ${deepDiveHtml}
      ${bossHtml}
    </div>`;
}

function nextQ() {
  if (activeChallengeMode === CHALLENGE_MODE_TYPED) {
    nextTypedQuestion();
    return;
  }

  if (!answered) return;
  if (directQuestionMode) {
    const targetLevelIndex = Number.isInteger(directQuestionSourceLevelIndex)
      ? directQuestionSourceLevelIndex
      : 0;
    startNormalMainRunAtLevel(targetLevelIndex);
    return;
  }
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

  const runtime = ensureMainLevelRuntime(level);
  runtime.currentQuestionId = null;
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
  if (activeChallengeMode === CHALLENGE_MODE_TYPED) {
    returnToMainChallenge();
    return;
  }

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

  resetMainLevelRuntime(levels[levelIndex]);
  render();
}

function showEnd() {
  if (missionOutcome === 'failed') {
    showFailedReview();
    return;
  }

  missionOutcome = 'complete';
  persistMainRunIfNeeded('complete');
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
  if (activeChallengeMode === CHALLENGE_MODE_TYPED && !typedRun.historySaved) {
    const leaveOutcome = typedRun.missionOutcome === 'running'
      ? 'aborted'
      : typedRun.missionOutcome;
    persistTypedRunIfNeeded(leaveOutcome);
  }
  if (activeChallengeMode === CHALLENGE_MODE_MAIN) {
    const mainLeaveOutcome = missionOutcome === 'failed'
      ? 'failed'
      : (missionOutcome === 'complete' ? 'complete' : 'aborted');
    persistMainRunIfNeeded(mainLeaveOutcome);
  }

  runHistoryViewActive = false;
  activeChallengeMode = CHALLENGE_MODE_MAIN;
  directQuestionMode = false;
  directQuestionSourceLevelIndex = -1;
  clearQuestionHash();
  resetTypedRunState();
  rebuildMainRun();
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
  beginNewMainRun();

  resetMainLevelRuntime(levels[levelIndex]);
  updateStaticLabels();
  populateLevelSelector();
  updateHUD();
  render();
}

if (typeof document !== 'undefined') {
  document.addEventListener('click', event => {
    const menu = document.getElementById('quick-menu');
    if (!menu) return;
    if (menu.contains(event.target)) return;
    closeQuickMenu();
  });
}

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', handleQuestionHashChange);
}

updateStaticLabels();
populateLevelSelector();
if (!handleQuestionHashChange()) {
  render();
}
