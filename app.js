(function runApp() {
  function reportFatalError(error) {
    try {
      var text = "APP_FATAL: ";
      if (error && error.message) {
        text += error.message;
      } else {
        text += String(error);
      }
      if (error && error.stack) {
        text += "\n" + String(error.stack);
      }

      if (!window.__bootLog) {
        window.__bootLog = [];
      }
      window.__bootLog.push(text);

      var box = document.getElementById("bootErrorBox");
      if (!box) {
        box = document.createElement("div");
        box.id = "bootErrorBox";
        box.style.position = "fixed";
        box.style.left = "12px";
        box.style.right = "12px";
        box.style.bottom = "12px";
        box.style.zIndex = "99999";
        box.style.background = "#fff4f4";
        box.style.border = "1px solid #d88484";
        box.style.borderRadius = "10px";
        box.style.padding = "10px 12px";
        box.style.font = "12px/1.4 monospace";
        box.style.color = "#6a1a1a";
        box.style.whiteSpace = "pre-wrap";
        if (document.body) {
          document.body.appendChild(box);
        }
      }
      box.textContent = text + "\n\nBoot log:\n" + (window.__bootLog || []).join("\n");
      if (window.console && console.error) {
        console.error(error);
      }
    } catch (ignore) {}
  }

  try {
  const MODES = {
    topic: "topic",
    mistakes: "mistakes",
    exam: "exam",
  };

  const EXAM_SCENARIOS = {
    mixedTrainer: "mixedTrainer",
    subjectModelExact: "subjectModelExact",
    subjectModelTraining: "subjectModelTraining",
  };

  const VIEWS = {
    trainer: "trainer",
    progress: "progress",
    coverage: "coverage",
    nextSteps: "nextSteps",
    report: "report",
  };

  const MASTERY = {
    strongAccuracy: 0.8,
    unstableAccuracy: 0.5,
    minQuestions: 5,
  };

  const STORAGE_KEYS = {
    v4: "ogeTrainerStatsV4",
    v3: "ogeTrainerStatsV3",
    legacyVariant: "ogeTrainerVariantStatsV2",
    resume: "ogeTrainerResumeV1",
    officialPack: "ogeOfficialPackV1",
  };

  const MAX_SAVED_SESSIONS = 400;
  const EXPORT_FORMAT_VERSION = 1;
  const storageFallback = {};

  function storageGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      if (Object.prototype.hasOwnProperty.call(storageFallback, key)) {
        return storageFallback[key];
      }
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (error) {
      storageFallback[key] = String(value);
      return false;
    }
  }

  function storageRemove(key) {
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      delete storageFallback[key];
      return false;
    }
  }

  function createExamDataFallback() {
    var subjects = [
      { key: "russian", title: "Русский язык", description: "Демо-режим (банк недоступен)" },
      { key: "math", title: "Математика", description: "Демо-режим (банк недоступен)" },
      { key: "physics", title: "Физика", description: "Демо-режим (банк недоступен)" },
      { key: "english", title: "Английский язык", description: "Демо-режим (банк недоступен)" },
    ];
    var defaults = {
      russian: { defaultQuestions: 30, defaultMinutes: 235, minQuestions: 10, maxQuestions: 45, fipiLinks: { codifier: "#", specification: "#", demo: "#", navigator: "#" } },
      math: { defaultQuestions: 30, defaultMinutes: 235, minQuestions: 10, maxQuestions: 50, fipiLinks: { codifier: "#", specification: "#", demo: "#", navigator: "#" } },
      physics: { defaultQuestions: 30, defaultMinutes: 180, minQuestions: 10, maxQuestions: 50, fipiLinks: { codifier: "#", specification: "#", demo: "#", navigator: "#" } },
      english: { defaultQuestions: 30, defaultMinutes: 135, minQuestions: 10, maxQuestions: 45, fipiLinks: { codifier: "#", specification: "#", demo: "#", navigator: "#" } },
    };

    function createVariantId(subjectKey, variant, modelKey, count) {
      return String(subjectKey) + "-" + String(modelKey || "mixedTrainer") + "-v" + String(variant) + "-q" + String(count || 30);
    }

    return {
      VARIANT_COUNT: 15,
      BASE_QUESTION_COUNT: 30,
      OFFICIAL_PACK_FORMAT_VERSION: 1,
      MIN_TIME_MINUTES: 15,
      MAX_TIME_MINUTES: 360,
      SUBJECTS: subjects,
      CONTENT_COVERAGE_MAP: {},
      QUESTION_TYPE_META: { "single-choice": { answerFormat: "single-select" } },
      getSubjectDefaults: function (subjectKey) {
        return defaults[subjectKey] || defaults.russian;
      },
      clampQuestionCount: function (subjectKey, count) {
        var d = defaults[subjectKey] || defaults.russian;
        var n = Number(count);
        if (!isFinite(n)) return d.defaultQuestions;
        n = Math.floor(n);
        if (n < d.minQuestions) n = d.minQuestions;
        if (n > d.maxQuestions) n = d.maxQuestions;
        return n;
      },
      clampTimeLimit: function (subjectKey, minutes) {
        var d = defaults[subjectKey] || defaults.russian;
        var n = Number(minutes);
        if (!isFinite(n)) return d.defaultMinutes;
        n = Math.floor(n);
        if (n < 15) n = 15;
        if (n > 360) n = 360;
        return n;
      },
      buildCoverageMatrix: function (subjectKey, count) {
        return {
          questionCount: Number(count) || 30,
          difficultyPlan: { basic: 10, medium: 10, hard: 10 },
          segmentPlan: {},
          mandatorySegments: [],
          hardShareMin: 0.3,
        };
      },
      getVariantDiagnostics: function (subjectKey, variant, count) {
        return {
          matrix: this.buildCoverageMatrix(subjectKey, count),
          validation: { ok: false, errors: ["Question bank unavailable"] },
          variantId: createVariantId(subjectKey, variant, "mixedTrainer", count),
        };
      },
      getQuestions: function () { return []; },
      getQuestionPool: function () { return []; },
      setOfficialPack: function () {
        return { ok: false, errors: ["Question bank unavailable"], warnings: [], inserted: {}, summary: { totalQuestions: 0 } };
      },
      getOfficialPackSummary: function () {
        return {
          version: 1,
          source: "",
          importedAt: null,
          years: [],
          totalQuestions: 0,
          bySubject: { russian: 0, math: 0, physics: 0, english: 0 },
        };
      },
      getSubjectBlueprint: function (subjectKey, modelKey) {
        return {
          subject: subjectKey,
          modelKey: modelKey || "mixedTrainer",
          title: "Демо-модель",
          resultMode: "final-review",
          rules: {},
          timeLimitMinutes: 60,
          warningAtMinutes: 10,
          strictness: "soft",
          examProfile: {},
          scoring: {},
          resultDisplay: {},
          orderPolicy: "balanced-randomized",
          notices: { selfCheck: "учебная самопроверка", disclaimer: "Банк недоступен." },
          blocks: [],
        };
      },
      getExamByBlueprint: function (subjectKey, options) {
        var variant = options && options.seedVariant ? options.seedVariant : 1;
        var count = options && options.questionCount ? options.questionCount : 30;
        return {
          questions: [],
          blueprint: this.getSubjectBlueprint(subjectKey, options && options.modelKey),
          diagnostics: {
            missingBlocks: [],
            requestedCount: count,
            selectedCount: 0,
            blockPlan: {},
            variantId: createVariantId(subjectKey, variant, options && options.modelKey, count),
            note: "Question bank unavailable",
          },
        };
      },
      getContentCoverageMap: function (subjectKey) {
        return {
          subject: subjectKey,
          generatedAt: new Date().toISOString(),
          summary: {
            subject: subjectKey,
            totalTopics: 0,
            noCoverage: 0,
            weakCoverage: 0,
            sufficientCoverage: 0,
            strongCoverage: 0,
            imbalanceTopics: 0,
            knownFormats: [],
          },
          items: [],
        };
      },
      validateQuestionBank: function () {
        return {
          ok: false,
          errors: ["Question bank unavailable"],
          warnings: [],
          summary: { totalSubjects: 4, totalQuestions: 0 },
          bySubject: {
            russian: { questionCount: 0, topicCount: 0, byDifficulty: { basic: 0, medium: 0, hard: 0 }, byType: {}, byFormat: {}, coverage: { noCoverage: 0, weakCoverage: 0 }, explanationQuality: { strong: 0, medium: 0, weak: 0 } },
            math: { questionCount: 0, topicCount: 0, byDifficulty: { basic: 0, medium: 0, hard: 0 }, byType: {}, byFormat: {}, coverage: { noCoverage: 0, weakCoverage: 0 }, explanationQuality: { strong: 0, medium: 0, weak: 0 } },
            physics: { questionCount: 0, topicCount: 0, byDifficulty: { basic: 0, medium: 0, hard: 0 }, byType: {}, byFormat: {}, coverage: { noCoverage: 0, weakCoverage: 0 }, explanationQuality: { strong: 0, medium: 0, weak: 0 } },
            english: { questionCount: 0, topicCount: 0, byDifficulty: { basic: 0, medium: 0, hard: 0 }, byType: {}, byFormat: {}, coverage: { noCoverage: 0, weakCoverage: 0 }, explanationQuality: { strong: 0, medium: 0, weak: 0 } },
          },
          coverageGaps: [],
          weakCoverage: [],
          lowDifficultyDiversity: [],
          missingExplanationFields: [],
          duplicateCandidates: [],
          nearDuplicateCandidates: [],
          explanationQuality: { strong: 0, medium: 0, weak: 0, averageScore: 0 },
        };
      },
      getOfficialAlignmentReport: function () {
        return {
          generatedAt: new Date().toISOString(),
          officialPack: this.getOfficialPackSummary(),
          bySubject: {},
        };
      },
      listStableVariants: function (subjectKey, options) {
        var modelKey = (options && options.modelKey) || "mixedTrainer";
        var count = (options && options.questionCount) || 30;
        var items = [];
        for (var i = 1; i <= 15; i += 1) {
          items.push({ variant: i, variantId: createVariantId(subjectKey, i, modelKey, count), subject: subjectKey, modelKey: modelKey, questionCount: count });
        }
        return items;
      },
      createVariantId: createVariantId,
      rebuildVariant: function () { return []; },
      createQuestionSignature: function (question) {
        return [question.subject, question.segment, question.topic, question.prompt].join("|");
      },
      normalizeQuestionShape: function (question) { return question; },
    };
  }

  function createAssessmentEngineFallback() {
    return {
      TYPE_LABELS: { "single-choice": "Один ответ" },
      normalizeType: function () { return "single-choice"; },
      normalizeText: function (value) { return String(value || "").toLowerCase().replace(/\s+/g, " ").trim(); },
      renderQuestionInput: function (container, question) {
        container.innerHTML = "";
        var p = document.createElement("p");
        p.textContent = "Банк вопросов недоступен.";
        container.appendChild(p);
        return {
          getUserAnswer: function () { return null; },
          lock: function () {},
        };
      },
      evaluateAnswer: function () { return { isAnswered: false, isCorrect: false, score: 0, detail: {} }; },
      formatCorrectAnswer: function (question) { return (question && question.options && question.options[question.correctIndex]) || ""; },
    };
  }

  function createPlanningEngineFallback() {
    return {
      ROUTES: {
        planned: {
          key: "planned",
          title: "Плановая подготовка",
          description: "Демо-режим",
          defaults: { sessionSize: 10, examEverySessions: 3 },
        },
      },
      buildNextActions: function () { return []; },
      buildParentReport: function (payload) {
        var subjects = (payload && payload.subjects) || [];
        return {
          generatedAt: new Date().toISOString(),
          bySubject: subjects.map(function (subject) {
            return {
              subject: subject.key,
              title: subject.title,
              sessions: 0,
              attempted: 0,
              accuracy: 0,
              weakTopics: 0,
              staleTopics: 0,
              dynamics: 0,
              readiness: { readinessScore: 0, level: "Низкая" },
              coverageSummary: { noCoverage: 0, weakCoverage: 0 },
              weekly: [],
            };
          }),
        };
      },
      computeReadiness: function () {
        return { readinessScore: 0, level: "Низкая", components: {}, note: "Fallback mode" };
      },
    };
  }

  var ExamData = window.ExamData;
  var AssessmentEngine = window.AssessmentEngine;
  var PlanningEngine = window.PlanningEngine;

  if (!ExamData) {
    ExamData = createExamDataFallback();
    window.ExamData = ExamData;
    if (!window.__bootLog) {
      window.__bootLog = [];
    }
    window.__bootLog.push("Warning: window.ExamData missing, fallback activated");
  }
  if (!AssessmentEngine) {
    AssessmentEngine = createAssessmentEngineFallback();
    window.AssessmentEngine = AssessmentEngine;
    if (!window.__bootLog) {
      window.__bootLog = [];
    }
    window.__bootLog.push("Warning: window.AssessmentEngine missing, fallback activated");
  }
  if (!PlanningEngine) {
    PlanningEngine = createPlanningEngineFallback();
    window.PlanningEngine = PlanningEngine;
    if (!window.__bootLog) {
      window.__bootLog = [];
    }
    window.__bootLog.push("Warning: window.PlanningEngine missing, fallback activated");
  }

  const ui = {
    onboardingView: document.querySelector("#onboardingView"),
    onboardingStartBtn: document.querySelector("#onboardingStartBtn"),
    onboardingSkipBtn: document.querySelector("#onboardingSkipBtn"),

    openTrainerBtn: document.querySelector("#openTrainerBtn"),
    openProgressBtn: document.querySelector("#openProgressBtn"),
    openCoverageBtn: document.querySelector("#openCoverageBtn"),
    openNextStepsBtn: document.querySelector("#openNextStepsBtn"),
    openReportBtn: document.querySelector("#openReportBtn"),

    trainerView: document.querySelector("#trainerView"),
    sessionView: document.querySelector("#sessionView"),
    resultView: document.querySelector("#resultView"),
    progressView: document.querySelector("#progressView"),
    coverageView: document.querySelector("#coverageView"),
    nextStepsView: document.querySelector("#nextStepsView"),
    reportView: document.querySelector("#reportView"),

    modeGrid: document.querySelector("#modeGrid"),
    subjectCards: document.querySelector("#subjectCards"),
    quickExactExamBtn: document.querySelector("#quickExactExamBtn"),
    quickWeakTopicsBtn: document.querySelector("#quickWeakTopicsBtn"),
    quickMistakesBtn: document.querySelector("#quickMistakesBtn"),
    quickContinueBtn: document.querySelector("#quickContinueBtn"),

    subjectSelect: document.querySelector("#subjectSelect"),
    examModelSelect: document.querySelector("#examModelSelect"),
    variantSelect: document.querySelector("#variantSelect"),
    segmentSelect: document.querySelector("#segmentSelect"),
    difficultySelect: document.querySelector("#difficultySelect"),
    questionCountInput: document.querySelector("#questionCountInput"),
    timeLimitInput: document.querySelector("#timeLimitInput"),

    limitsHint: document.querySelector("#limitsHint"),
    modeHint: document.querySelector("#modeHint"),
    fipiLinks: document.querySelector("#fipiLinks"),
    resumeSessionBox: document.querySelector("#resumeSessionBox"),
    clearResumeSessionBtn: document.querySelector("#clearResumeSessionBtn"),
    weakTopicsBox: document.querySelector("#weakTopicsBox"),
    resetSubjectStatsFromWeakBtn: document.querySelector("#resetSubjectStatsFromWeakBtn"),
    coverageBox: document.querySelector("#coverageBox"),
    variantStatusBox: document.querySelector("#variantStatusBox"),
    bankDiagnosticsBox: document.querySelector("#bankDiagnosticsBox"),
    openVariantBtn: document.querySelector("#openVariantBtn"),
    generateVariantBtn: document.querySelector("#generateVariantBtn"),
    rebuildVariantBtn: document.querySelector("#rebuildVariantBtn"),
    compareVariantsBtn: document.querySelector("#compareVariantsBtn"),
    closeBankDiagnosticsBtn: document.querySelector("#closeBankDiagnosticsBtn"),

    startBtn: document.querySelector("#startBtn"),
    resetDefaultsBtn: document.querySelector("#resetDefaultsBtn"),
    resetSubjectStatsBtn: document.querySelector("#resetSubjectStatsBtn"),
    resetAllStatsBtn: document.querySelector("#resetAllStatsBtn"),
    runBankDiagnosticsBtn: document.querySelector("#runBankDiagnosticsBtn"),

    metaSubject: document.querySelector("#metaSubject"),
    metaTitle: document.querySelector("#metaTitle"),
    progressText: document.querySelector("#progressText"),
    progressBar: document.querySelector("#progressBar"),
    timerBox: document.querySelector("#timerBox"),
    timerText: document.querySelector("#timerText"),
    questionTopic: document.querySelector("#questionTopic"),
    questionMeta: document.querySelector("#questionMeta"),
    questionPrompt: document.querySelector("#questionPrompt"),
    questionSupplement: document.querySelector("#questionSupplement"),
    optionsBox: document.querySelector("#optionsBox"),
    feedbackBox: document.querySelector("#feedbackBox"),
    nextBtn: document.querySelector("#nextBtn"),
    finishEarlyBtn: document.querySelector("#finishEarlyBtn"),
    exitSessionBtn: document.querySelector("#exitSessionBtn"),

    resultMeta: document.querySelector("#resultMeta"),
    scoreValue: document.querySelector("#scoreValue"),
    percentValue: document.querySelector("#percentValue"),
    readinessValue: document.querySelector("#readinessValue"),
    difficultyStats: document.querySelector("#difficultyStats"),
    segmentStats: document.querySelector("#segmentStats"),
    nextStepBox: document.querySelector("#nextStepBox"),
    reviewList: document.querySelector("#reviewList"),

    repeatSimilarBtn: document.querySelector("#repeatSimilarBtn"),
    startMistakesBtn: document.querySelector("#startMistakesBtn"),
    startExamBtn: document.querySelector("#startExamBtn"),
    backToSetupBtn: document.querySelector("#backToSetupBtn"),

    progressSessions: document.querySelector("#progressSessions"),
    progressQuestions: document.querySelector("#progressQuestions"),
    progressAccuracy: document.querySelector("#progressAccuracy"),
    progressBySubject: document.querySelector("#progressBySubject"),
    progressWeakTopics: document.querySelector("#progressWeakTopics"),
    variantCompareBox: document.querySelector("#variantCompareBox"),
    recentSessions: document.querySelector("#recentSessions"),
    refreshProgressBtn: document.querySelector("#refreshProgressBtn"),
    toTrainerBtn: document.querySelector("#toTrainerBtn"),

    coverageSummaryBox: document.querySelector("#coverageSummaryBox"),
    coverageTableBox: document.querySelector("#coverageTableBox"),
    refreshCoverageBtn: document.querySelector("#refreshCoverageBtn"),
    coverageToTrainerBtn: document.querySelector("#coverageToTrainerBtn"),

    routeSelect: document.querySelector("#routeSelect"),
    buildNextStepsBtn: document.querySelector("#buildNextStepsBtn"),
    nextActionsBox: document.querySelector("#nextActionsBox"),
    nextStepsToTrainerBtn: document.querySelector("#nextStepsToTrainerBtn"),

    reportSummaryBox: document.querySelector("#reportSummaryBox"),
    reportTableBox: document.querySelector("#reportTableBox"),
    exportJsonBtn: document.querySelector("#exportJsonBtn"),
    importJsonBtn: document.querySelector("#importJsonBtn"),
    importJsonInput: document.querySelector("#importJsonInput"),
    exportHtmlReportBtn: document.querySelector("#exportHtmlReportBtn"),
    refreshReportBtn: document.querySelector("#refreshReportBtn"),
    reportToTrainerBtn: document.querySelector("#reportToTrainerBtn"),
  };

  const state = {
    activeView: VIEWS.trainer,
    activeMode: MODES.topic,
    activeRoute: "planned",
    subjectKey: (ExamData.SUBJECTS[0] && ExamData.SUBJECTS[0].key) || "",
    poolCache: {},
    timerId: null,
    supplementTimerId: null,
    currentSession: null,
    resumeSession: null,
    lastResult: null,
    coverageCache: {},
    bankDiagnostics: null,
    onboardingVisible: false,
    stats: loadStats(),
  };

  function nowIso() {
    return new Date().toISOString();
  }

  function createEmptyStats() {
    return {
      version: 4,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      onboardingSeen: false,
      bySubject: {},
      byTopic: {},
      byMode: {},
      questionHistory: {},
      weakTopics: [],
      sessions: [],
      variantStatus: {},
      routeHistory: [],
      coverageSnapshots: {},
      recommendationHistory: [],
      readinessSnapshots: {},
      bankDiagnostics: null,
    };
  }

  function safeJsonParse(raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function migrateLegacyStats() {
    const legacyRaw = storageGet(STORAGE_KEYS.legacyVariant);
    const base = createEmptyStats();

    if (!legacyRaw) {
      return base;
    }

    const legacy = safeJsonParse(legacyRaw);
    if (!legacy || typeof legacy !== "object") {
      return base;
    }

    base.variantStatus = legacy;

    Object.entries(legacy).forEach(([subject, variants]) => {
      if (!variants || typeof variants !== "object") {
        return;
      }

      Object.entries(variants).forEach(([variant, record]) => {
        if (!record || typeof record !== "object") {
          return;
        }

        const total = Number(record.total || 0);
        const correct = Number(record.correct || 0);
        const wrong = Number(record.wrong || 0);
        const unanswered = Number(record.unanswered || Math.max(0, total - correct - wrong));

        if (!base.bySubject[subject]) {
          base.bySubject[subject] = {
            subject,
            sessions: 0,
            attempted: 0,
            correct: 0,
            wrong: 0,
            unanswered: 0,
            totalScore: 0,
            totalTimeSec: 0,
            avgTimePerQuestionSec: 0,
            accuracy: 0,
            updatedAt: nowIso(),
          };
        }

        const subjectStats = base.bySubject[subject];
        subjectStats.sessions += 1;
        subjectStats.attempted += total;
        subjectStats.correct += correct;
        subjectStats.wrong += wrong;
        subjectStats.unanswered += unanswered;
        subjectStats.totalScore += correct;
        subjectStats.accuracy = subjectStats.attempted
          ? subjectStats.correct / subjectStats.attempted
          : 0;
        subjectStats.updatedAt = nowIso();

        base.sessions.push({
          id: `legacy-${subject}-${variant}`,
          mode: MODES.exam,
          subject,
          variant: Number(variant),
          examScenario: EXAM_SCENARIOS.mixedTrainer,
          questionCount: total,
          answered: correct + wrong,
          correct,
          wrong,
          unanswered,
          totalScore: correct,
          accuracy: total ? correct / total : 0,
          durationSec: 0,
          avgTimePerQuestionSec: 0,
          startedAt: record.updatedAt || nowIso(),
          endedAt: record.updatedAt || nowIso(),
          topics: {},
          difficulties: {},
          questionKeys: [],
        });
      });
    });

    base.sessions = base.sessions.slice(-MAX_SAVED_SESSIONS);
    base.updatedAt = nowIso();

    return base;
  }

  function loadStats() {
    const rawV4 = storageGet(STORAGE_KEYS.v4);
    if (rawV4) {
      const parsedV4 = safeJsonParse(rawV4);
      if (parsedV4 && Number(parsedV4.version) >= 4) {
        return {
          ...createEmptyStats(),
          ...parsedV4,
          version: 4,
        };
      }
    }

    const raw = storageGet(STORAGE_KEYS.v3);
    if (raw) {
      const parsed = safeJsonParse(raw);
      if (parsed && Number(parsed.version) === 3) {
        const migratedFromV3 = {
          ...createEmptyStats(),
          ...parsed,
          version: 4,
          onboardingSeen: Boolean(parsed.onboardingSeen),
          recommendationHistory: Array.isArray(parsed.recommendationHistory)
            ? parsed.recommendationHistory
            : [],
          readinessSnapshots: parsed.readinessSnapshots || {},
        };
        storageSet(STORAGE_KEYS.v4, JSON.stringify(migratedFromV3));
        return migratedFromV3;
      }
    }

    const migrated = migrateLegacyStats();
    storageSet(STORAGE_KEYS.v4, JSON.stringify(migrated));
    return migrated;
  }

  function saveStats(nextStats = state.stats) {
    nextStats.updatedAt = nowIso();
    nextStats.version = 4;
    storageSet(STORAGE_KEYS.v4, JSON.stringify(nextStats));
    state.stats = nextStats;
  }

  function saveResumeSnapshot(session) {
    if (!session) {
      return;
    }

    const snapshot = {
      version: 1,
      savedAt: Date.now(),
      session: {
        id: session.id,
        mode: session.mode,
        subject: session.subject,
        variant: session.variant,
        variantId: session.variantId || null,
        examScenario: session.examScenario,
        questionCount: session.questionCount,
        timeLimitMinutes: session.timeLimitMinutes,
        remainingSeconds: session.remainingSeconds,
        diagnostics: session.diagnostics || null,
        questions: session.questions,
        answers: session.answers,
        currentIndex: session.currentIndex,
        startedAt: session.startedAt,
        startedAtMs: session.startedAtMs,
      },
    };

    storageSet(STORAGE_KEYS.resume, JSON.stringify(snapshot));
    state.resumeSession = snapshot;
  }

  function clearResumeSnapshot() {
    storageRemove(STORAGE_KEYS.resume);
    state.resumeSession = null;
  }

  function loadResumeSnapshot() {
    const raw = storageGet(STORAGE_KEYS.resume);
    if (!raw) {
      return null;
    }

    const payload = safeJsonParse(raw);
    if (!payload || !payload.session || !Array.isArray(payload.session.questions)) {
      return null;
    }

    payload.session.questions = sanitizeSessionQuestions(payload.session.questions, {
      subject: payload.session.subject || state.subjectKey,
      mode: payload.session.mode || MODES.topic,
      targetCount:
        Number(payload.session.questionCount) || payload.session.questions.length,
    });
    if (Array.isArray(payload.session.answers)) {
      payload.session.answers = payload.session.answers.slice(0, payload.session.questions.length);
    }

    return payload;
  }

  function saveOfficialPackPayload(payload) {
    if (!payload || typeof payload !== "object") {
      storageRemove(STORAGE_KEYS.officialPack);
      return;
    }
    storageSet(STORAGE_KEYS.officialPack, JSON.stringify(payload));
  }

  function loadOfficialPackPayload() {
    const raw = storageGet(STORAGE_KEYS.officialPack);
    if (!raw) {
      return null;
    }
    const parsed = safeJsonParse(raw);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    return parsed;
  }

  function applyOfficialPack(payload, options = {}) {
    if (!ExamData || typeof ExamData.setOfficialPack !== "function") {
      return { ok: false, errors: ["setOfficialPack API недоступен"], warnings: [], inserted: {}, summary: null };
    }
    const result = ExamData.setOfficialPack(payload, {
      replace: options.replace !== false,
    });
    if (result && result.ok) {
      if (options.persist !== false) {
        saveOfficialPackPayload(payload);
      }
      state.poolCache = {};
      state.coverageCache = {};
    }
    return result || { ok: false, errors: ["Не удалось применить пакет"], warnings: [], inserted: {}, summary: null };
  }

  function loadOfficialPackFromStorage() {
    const payload = loadOfficialPackPayload();
    if (!payload) {
      return null;
    }
    return applyOfficialPack(payload, { replace: true });
  }

  function loadBuiltInOfficialPack() {
    const payload = window.__OGE_OFFICIAL_PACK__;
    if (!payload || typeof payload !== "object" || payload.type !== "oge-official-bank-pack") {
      return null;
    }
    return applyOfficialPack(payload, { replace: true, persist: false });
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatTime(totalSeconds) {
    const safe = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const seconds = safe % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(
        seconds,
      ).padStart(2, "0")}`;
    }

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function stripVariantToken(text) {
    const source = String(text || "");
    return source
      .replace(/\s*·\s*[a-z0-9_-]+-[a-z0-9_-]+-v\d{2}-[a-z0-9]+/gi, "")
      .replace(/\s*[·|]\s*[a-z]+-[a-z]+(?:[a-z]+)?-v\d{2}-[a-z0-9]+/gi, "")
      .trim();
  }

  function setSessionMetaTitle(text) {
    ui.metaTitle.textContent = stripVariantToken(text);
  }

  function modeLabel(modeKey) {
    const map = {
      [MODES.topic]: "Тренировка по темам",
      [MODES.mistakes]: "Работа над ошибками",
      [MODES.exam]: "Экзамен",
      "exam-exact": "Экзамен (точный макет)",
      "exam-training": "Экзаменационная тренировка",
    };
    return map[modeKey] || String(modeKey || "—");
  }

  function scenarioLabel(scenarioKey) {
    const map = {
      [EXAM_SCENARIOS.mixedTrainer]: "Смешанный экзамен-тренажёр",
      [EXAM_SCENARIOS.subjectModelExact]: "Точный экзаменационный макет",
      [EXAM_SCENARIOS.subjectModelTraining]: "Экзаменационная тренировка",
    };
    return map[scenarioKey] || "—";
  }

  function difficultyLabel(level) {
    const map = {
      basic: "базовая",
      medium: "средняя",
      hard: "высокая",
    };
    return map[level] || String(level || "—");
  }

  function orderPolicyLabel(policy) {
    const map = {
      "fixed-by-block": "фиксированный по блокам",
      "balanced-randomized": "сбалансированный",
    };
    return map[policy] || String(policy || "—");
  }

  function buildQuestionSourceLabel(question) {
    const source = String((question && question.sourceHint) || "").trim();
    const tag = String((question && question.examBlueprintTag) || "").trim();
    const yearMatch = String(source + " " + tag).match(/(20\d{2})/);
    const year = yearMatch ? yearMatch[1] : "";

    if (
      /^OFFICIAL-[A-Z]+-\d{4}/i.test(tag) ||
      /фипи|официальн|демоверси/i.test(source)
    ) {
      return year ? `Источник: демоверсия ФИПИ ${year}` : "Источник: демоверсия ФИПИ";
    }

    if (!source || /локальный банк огэ-тренажера/i.test(source)) {
      return "";
    }

    const normalized = source.replace(/^Официальный материал\s*/i, "").trim();
    if (!normalized) {
      return "";
    }
    return normalized.length > 90 ? `Источник: ${normalized.slice(0, 87)}...` : `Источник: ${normalized}`;
  }

  function isBlueprintScenario(scenarioKey) {
    return (
      scenarioKey === EXAM_SCENARIOS.subjectModelExact ||
      scenarioKey === EXAM_SCENARIOS.subjectModelTraining
    );
  }

  function isExactScenario(scenarioKey) {
    return scenarioKey === EXAM_SCENARIOS.subjectModelExact;
  }

  function getBlueprintModelKey(scenarioKey) {
    if (scenarioKey === EXAM_SCENARIOS.subjectModelTraining) {
      return "subjectModelTraining";
    }
    return "subjectModelExact";
  }

  function blueprintQuestionCount(blueprint, subjectKey = state.subjectKey) {
    if (!blueprint || !Array.isArray(blueprint.blocks) || !blueprint.blocks.length) {
      return getSubjectConfig(subjectKey).defaultQuestions;
    }
    const total = blueprint.blocks.reduce((acc, block) => acc + Number(block.count || 0), 0);
    return ExamData.clampQuestionCount(subjectKey, total || getSubjectConfig(subjectKey).defaultQuestions);
  }

  function getExpectedTypesForSubject(subjectKey) {
    const types = new Set();
    const fallback = ["single-choice"];

    ["subjectModelExact", "subjectModelTraining"].forEach((modelKey) => {
      try {
        const blueprint = ExamData.getSubjectBlueprint(subjectKey, modelKey);
        (blueprint.blocks || []).forEach((block) => {
          (block.allowedTypes || []).forEach((type) => {
            if (type) {
              types.add(type);
            }
          });
        });
      } catch (error) {
        console.error(error);
      }
    });

    if (!types.size && ExamData.CONTENT_COVERAGE_MAP && ExamData.CONTENT_COVERAGE_MAP[subjectKey]) {
      (ExamData.CONTENT_COVERAGE_MAP[subjectKey] || []).forEach((item) => {
        if (item && item.questionType) {
          types.add(item.questionType);
        }
      });
    }

    fallback.forEach((item) => types.add(item));
    return Array.from(types);
  }

  function getExpectedTypesBySubject() {
    const map = {};
    ExamData.SUBJECTS.forEach((subject) => {
      map[subject.key] = getExpectedTypesForSubject(subject.key);
    });
    return map;
  }

  function getScenarioBlueprint(subjectKey, examScenario) {
    if (!isBlueprintScenario(examScenario)) {
      return null;
    }
    try {
      return ExamData.getSubjectBlueprint(subjectKey, getBlueprintModelKey(examScenario));
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  function buildSessionTitleText(session) {
    const modeText = modeLabel(session.mode);
    if (session.mode !== MODES.exam) {
      return `${modeText} · ${session.questionCount} вопросов`;
    }

    const scenarioText = scenarioLabel(session.examScenario);
    const blueprint = getScenarioBlueprint(session.subject, session.examScenario);
    if (blueprint) {
      const structure = (blueprint.blocks || [])
        .map((block) => `${block.title}: ${block.count}`)
        .join(" · ");
      return `${modeText}: ${scenarioText} · заданий: ${session.questionCount} · время: ${session.timeLimitMinutes} мин.${structure ? ` · ${structure}` : ""}`;
    }

    return `${modeText}: ${scenarioText} · заданий: ${session.questionCount} · время: ${session.timeLimitMinutes} мин.`;
  }

  function readinessLabel(readiness) {
    if (!readiness) {
      return "Н/Д";
    }
    const levelMap = {
      weak: "слабая",
      unstable: "нестабильная",
      strong: "сильная",
    };
    return `${levelMap[readiness.level] || readiness.level} (${readiness.readinessScore}%)`;
  }

  function buildSubjectReadiness(subjectKey) {
    const coverageSummary = getCoverage(subjectKey).summary;
    const sessions = (state.stats.sessions || []).filter((session) => session.subject === subjectKey);
    const readiness = PlanningEngine.computeReadiness({
      subjectStats: (state.stats.bySubject && state.stats.bySubject[subjectKey]) || {},
      coverageSummary,
      sessions,
      questionHistory: state.stats.questionHistory || {},
      variantStatus:
        (state.stats.variantStatus && state.stats.variantStatus[subjectKey]) || {},
      subject: subjectKey,
      expectedTypes: getExpectedTypesForSubject(subjectKey),
    });
    state.stats.readinessSnapshots[subjectKey] = {
      ...readiness,
      updatedAt: nowIso(),
    };
    return readiness;
  }

  function topicKey(question) {
    return `${question.subject}::${question.segment}::${question.topic}`;
  }

  function questionKey(question) {
    if (typeof ExamData.createQuestionSignature === "function") {
      return ExamData.createQuestionSignature(question);
    }
    return `${question.subject}|${question.segment}|${question.topic}|${question.prompt}`;
  }

  function normalizeQuestion(question) {
    if (typeof ExamData.normalizeQuestionShape === "function") {
      return ExamData.normalizeQuestionShape(question);
    }
    return question;
  }

  function sanitizeSessionQuestions(questions, context) {
    const isUsableQuestion = (question) => {
      const prompt = String((question && question.prompt) || "").toLowerCase();
      if (!prompt.trim()) {
        return false;
      }
      const suspicious =
        prompt.includes("при оценке грамотности") ||
        prompt.includes("система оценивания экзаменационной работы") ||
        prompt.includes("номер задания правильный ответ") ||
        prompt.includes("критерии оценивания выполнения заданий") ||
        prompt.includes("в соответствии с порядком") ||
        prompt.includes("третья проверка");
      if (suspicious) {
        return false;
      }
      if (prompt.length > 2600) {
        return false;
      }
      return true;
    };

    const normalized = Array.isArray(questions)
      ? questions.map(normalizeQuestion).filter((question) => question && question.prompt && isUsableQuestion(question))
      : [];
    const unique = [];
    const seen = new Set();

    normalized.forEach((question) => {
      const key = questionKey(question);
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(question);
      }
    });

    const targetCount = Math.max(
      1,
      Number(
        (context && context.targetCount) || (Array.isArray(questions) ? questions.length : unique.length),
      ) || unique.length,
    );

    if (!context || !context.subject || unique.length >= targetCount) {
      return unique.slice(0, targetCount);
    }

    const pool = getSubjectPool(context.subject);
    const candidates = pool.filter((question) => !seen.has(questionKey(question)));
    const extras = pickQuestionsByScore(candidates, targetCount - unique.length, {
      mode: context.mode || MODES.topic,
      recentSet: recentQuestionSet(context.subject),
      weakSet: getWeakTopicSet(context.subject),
    }).map(normalizeQuestion);

    extras.forEach((question) => {
      const key = questionKey(question);
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(question);
      }
    });

    return unique.slice(0, targetCount);
  }

  function getSubjectConfig(subjectKey = state.subjectKey) {
    return ExamData.getSubjectDefaults(subjectKey);
  }

  function getSubjectInfo(subjectKey) {
    return ExamData.SUBJECTS.find((subject) => subject.key === subjectKey);
  }

  function getSubjectPool(subjectKey) {
    if (!state.poolCache[subjectKey]) {
      try {
        const config = getSubjectConfig(subjectKey);
        state.poolCache[subjectKey] = ExamData.getQuestionPool(subjectKey, {
          variantFrom: 1,
          variantTo: ExamData.VARIANT_COUNT,
          questionCount: config.defaultQuestions,
        }).map(normalizeQuestion);
      } catch (error) {
        console.error(error);
        state.poolCache[subjectKey] = [];
      }
    }
    return state.poolCache[subjectKey];
  }

  function getCoverage(subjectKey) {
    if (!state.coverageCache[subjectKey]) {
      try {
        state.coverageCache[subjectKey] = ExamData.getContentCoverageMap(subjectKey);
      } catch (error) {
        console.error(error);
        state.coverageCache[subjectKey] = {
          subject: subjectKey,
          generatedAt: nowIso(),
          summary: {
            subject: subjectKey,
            totalTopics: 0,
            noCoverage: 0,
            weakCoverage: 0,
            sufficientCoverage: 0,
            strongCoverage: 0,
            imbalanceTopics: 0,
            knownFormats: [],
          },
          items: [],
        };
      }
    }
    return state.coverageCache[subjectKey];
  }

  function refreshCoverage(subjectKey) {
    try {
      state.coverageCache[subjectKey] = ExamData.getContentCoverageMap(subjectKey);
    } catch (error) {
      console.error(error);
      delete state.coverageCache[subjectKey];
      return getCoverage(subjectKey);
    }
    return state.coverageCache[subjectKey];
  }

  function recentQuestionSet(subjectKey, sessionsBack = 6) {
    const set = new Set();
    const recent = state.stats.sessions
      .filter((session) => session.subject === subjectKey)
      .slice(-sessionsBack);

    recent.forEach((session) => {
      (session.questionKeys || []).forEach((key) => set.add(key));
    });

    return set;
  }

  function getWeakTopicSet(subjectKey) {
    return new Set(
      (state.stats.weakTopics || [])
        .filter((entry) => entry.subject === subjectKey && entry.status !== "strong")
        .map((entry) => `${entry.subject}::${entry.segment}::${entry.topic}`),
    );
  }

  function scoreCandidate(question, options) {
    const history = state.stats.questionHistory[questionKey(question)];
    const recentSet = options.recentSet || new Set();
    const weakSet = options.weakSet || new Set();

    let score = 50;

    if (!history) {
      score += 40;
    } else {
      score += Math.max(0, 15 - Math.min(15, history.attempts));
      if (history.wrong > history.correct) {
        score += 20;
      }
      if (history.lastAnsweredAt) {
        const days = (Date.now() - new Date(history.lastAnsweredAt).getTime()) / (1000 * 60 * 60 * 24);
        score += Math.min(20, Math.max(0, days));
      }
    }

    if (recentSet.has(questionKey(question))) {
      score -= 70;
    }
    if (weakSet.has(topicKey(question))) {
      score += 25;
    }
    if (options.mode === MODES.mistakes && history && history.wrong > history.correct) {
      score += 25;
    }

    return score + Math.random() * 2;
  }

  function pickQuestionsByScore(candidates, count, options) {
    const unique = [];
    const seen = new Set();

    candidates.forEach((question) => {
      const key = questionKey(question);
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(question);
      }
    });

    const limit = Math.min(count, unique.length);
    if (!limit) {
      return [];
    }

    const recentSet = options.recentSet || new Set();
    const usePool = unique.filter((question) => !recentSet.has(questionKey(question)));
    const pool = usePool.length >= limit ? usePool : unique.slice();

    const selected = [];
    const usedKeys = new Set();
    const topicCounts = {};
    const segmentCounts = {};
    const typeCounts = {};

    while (selected.length < limit && usedKeys.size < pool.length) {
      let best = null;

      for (let index = 0; index < pool.length; index += 1) {
        const question = pool[index];
        const key = questionKey(question);
        if (usedKeys.has(key)) {
          continue;
        }

        let candidateScore = scoreCandidate(question, options);
        const topicId = topicKey(question);
        const segmentId = `${question.subject}::${question.segment}`;
        const typeId = question.type || "single-choice";

        candidateScore -= (topicCounts[topicId] || 0) * 22;
        candidateScore -= (segmentCounts[segmentId] || 0) * 8;
        candidateScore -= (typeCounts[typeId] || 0) * 6;

        if (!best || candidateScore > best.score) {
          best = { question, key, score: candidateScore, topicId, segmentId, typeId };
        }
      }

      if (!best) {
        break;
      }

      selected.push(best.question);
      usedKeys.add(best.key);
      topicCounts[best.topicId] = (topicCounts[best.topicId] || 0) + 1;
      segmentCounts[best.segmentId] = (segmentCounts[best.segmentId] || 0) + 1;
      typeCounts[best.typeId] = (typeCounts[best.typeId] || 0) + 1;
    }

    return selected;
  }

  function buildSessionQuestions(config) {
    const safeFallback = (reason) => {
      const pool = getSubjectPool(config.subject);
      const weakSet = getWeakTopicSet(config.subject);
      const recentSet = recentQuestionSet(config.subject);
      const emergency = pickQuestionsByScore(pool, config.count, {
        mode: config.mode,
        recentSet,
        weakSet,
      }).map(normalizeQuestion);
      return {
        questions: emergency,
        diagnostics: {
          kind: "fallback",
          reason,
          variantId:
            config.mode === MODES.exam && config.variant
              ? ExamData.createVariantId(
                  config.subject,
                  config.variant,
                  config.examScenario || EXAM_SCENARIOS.mixedTrainer,
                  config.count,
                )
              : null,
        },
      };
    };

    if (config.mode === MODES.exam) {
      if (
        config.examScenario === EXAM_SCENARIOS.subjectModelExact ||
        config.examScenario === EXAM_SCENARIOS.subjectModelTraining
      ) {
        try {
          const modelKey =
            config.examScenario === EXAM_SCENARIOS.subjectModelTraining
              ? "subjectModelTraining"
              : "subjectModelExact";
          const built = ExamData.getExamByBlueprint(config.subject, {
            modelKey,
            questionCount: config.count,
            seedVariant: config.variant,
          });
          return {
            questions: built.questions.map(normalizeQuestion),
            diagnostics: {
              kind: "subject-blueprint",
              ...built.diagnostics,
              blueprint: built.blueprint,
            },
          };
        } catch (error) {
          console.error(error);
          return safeFallback(`subject-blueprint-failed: ${error && error.message ? error.message : error}`);
        }
      }

      try {
        const questions = ExamData.getQuestions(config.subject, config.variant, config.count).map(normalizeQuestion);
        return {
          questions,
          diagnostics: {
            kind: "mixed",
            variantId: ExamData.createVariantId(
              config.subject,
              config.variant,
              EXAM_SCENARIOS.mixedTrainer,
              config.count,
            ),
            matrix: ExamData.getVariantDiagnostics(config.subject, config.variant, config.count),
          },
        };
      } catch (error) {
        console.error(error);
        return safeFallback(`mixed-variant-failed: ${error && error.message ? error.message : error}`);
      }
    }

    const pool = getSubjectPool(config.subject);
    const weakSet = getWeakTopicSet(config.subject);
    const recentSet = recentQuestionSet(config.subject);

    let filtered = pool.slice();

    if (config.mode === MODES.topic) {
      if (config.segment !== "any") {
        filtered = filtered.filter((question) => question.segment === config.segment);
      }
      if (config.difficulty !== "any") {
        filtered = filtered.filter((question) => question.difficulty === config.difficulty);
      }
    }

    if (config.mode === MODES.mistakes) {
      const wrongDominant = new Set(
        Object.entries(state.stats.questionHistory)
          .filter(([, history]) => history.subject === config.subject && history.wrong > history.correct)
          .map(([key]) => key),
      );

      const priority = filtered.filter(
        (question) => weakSet.has(topicKey(question)) || wrongDominant.has(questionKey(question)),
      );

      if (priority.length >= Math.max(5, config.count / 2)) {
        filtered = priority;
      }
    }

    if (!filtered.length) {
      filtered = pool;
    }

    const questions = pickQuestionsByScore(filtered, config.count, {
      mode: config.mode,
      recentSet,
      weakSet,
    }).map(normalizeQuestion);

    return {
      questions,
      diagnostics: null,
    };
  }

  function setView(view) {
    state.activeView = view;

    const map = {
      [VIEWS.trainer]: ui.openTrainerBtn,
      [VIEWS.progress]: ui.openProgressBtn,
      [VIEWS.coverage]: ui.openCoverageBtn,
      [VIEWS.nextSteps]: ui.openNextStepsBtn,
      [VIEWS.report]: ui.openReportBtn,
    };

    Object.values(map).forEach((button) => button.classList.remove("active"));
    if (map[view]) {
      map[view].classList.add("active");
    }

    ui.trainerView.classList.toggle("hidden", view !== VIEWS.trainer);
    ui.onboardingView.classList.toggle("hidden", !(state.onboardingVisible && view === VIEWS.trainer));
    ui.progressView.classList.toggle("hidden", view !== VIEWS.progress);
    ui.coverageView.classList.toggle("hidden", view !== VIEWS.coverage);
    ui.nextStepsView.classList.toggle("hidden", view !== VIEWS.nextSteps);
    ui.reportView.classList.toggle("hidden", view !== VIEWS.report);

    if (view !== VIEWS.trainer) {
      ui.sessionView.classList.add("hidden");
      ui.resultView.classList.add("hidden");
    }

    if (view === VIEWS.progress) {
      renderProgressScreen();
    }
    if (view === VIEWS.coverage) {
      renderCoverageScreen();
    }
    if (view === VIEWS.nextSteps) {
      renderNextStepsScreen();
    }
    if (view === VIEWS.report) {
      renderReportScreen();
    }
  }

  function setMode(mode) {
    state.activeMode = mode;

    ui.modeGrid.querySelectorAll(".mode-card").forEach((card) => {
      card.classList.toggle("active", card.dataset.mode === mode);
    });

    const showExam = mode === MODES.exam;
    const showTopic = mode === MODES.topic;

    document.querySelectorAll(".exam-only").forEach((element) => {
      element.classList.toggle("mode-only-hidden", !showExam);
    });

    document.querySelectorAll(".topic-only").forEach((element) => {
      element.classList.toggle("mode-only-hidden", !showTopic);
    });

    if (showExam) {
      renderVariantSelect();
    }
    syncExamScenarioControls();

    if (mode === MODES.topic) {
      ui.modeHint.textContent = "Режим по темам: выберите сегмент, сложность и объём заданий.";
    } else if (mode === MODES.mistakes) {
      ui.modeHint.textContent = "Работа над ошибками: приоритет слабых тем и проблемных навыков.";
    } else {
      if (isExactScenario(ui.examModelSelect.value)) {
        const blueprint = getScenarioBlueprint(state.subjectKey, EXAM_SCENARIOS.subjectModelExact);
        const structure = blueprint
          ? (blueprint.blocks || []).map((block) => `${block.title}: ${block.count}`).join(" · ")
          : "структура предметной модели";
        ui.modeHint.textContent =
          `Точный экзаменационный макет: параметры фиксированы по модели предмета. ${structure}.`;
      } else {
        ui.modeHint.textContent =
          "Экзамен: выберите смешанный режим, точный макет или тренировочный макет. Подсказки скрыты до завершения.";
      }
    }

    renderVariantStatuses();
    renderCoveragePreview();
  }

  function renderSubjectCards() {
    const expectedTypesBySubject = getExpectedTypesBySubject();
    ui.subjectCards.innerHTML = ExamData.SUBJECTS.map((subject) => {
      const subjectStats = state.stats.bySubject[subject.key];
      const solved = subjectStats ? subjectStats.attempted : 0;
      const accuracy = subjectStats ? Math.round((subjectStats.accuracy || 0) * 100) : 0;
      const readiness = buildSubjectReadiness(subject.key);
      const weakCount = (state.stats.weakTopics || []).filter(
        (item) => item.subject === subject.key && item.status !== "strong",
      ).length;
      const sessions = (state.stats.sessions || []).filter((item) => item.subject === subject.key);
      const last = sessions.length ? sessions[sessions.length - 1] : null;
      const lastText = last
        ? `${Math.round((last.accuracy || 0) * 100)}% (${last.correct}/${last.questionCount})`
        : "нет сессий";
      const nextActions = PlanningEngine.buildNextActions({
        stats: state.stats,
        subject: subject.key,
        routeKey: state.activeRoute,
        coverage: getCoverage(subject.key),
        expectedTypesBySubject,
      });
      const nextTitle = (nextActions[0] && nextActions[0].title) || "Продолжить регулярную практику";

      return `
        <button class="subject-card ${subject.key === state.subjectKey ? "active" : ""}" data-subject="${subject.key}">
          <strong>${escapeHtml(subject.title)}</strong>
          <small>готовность: ${readiness.readinessScore}% · слабых тем: ${weakCount}</small>
          <small>решено: ${solved} · точность: ${accuracy}% · последний результат: ${escapeHtml(lastText)}</small>
          <small>следующий шаг: ${escapeHtml(nextTitle)}</small>
        </button>
      `;
    }).join("");
  }

  function renderSubjectSelect() {
    ui.subjectSelect.innerHTML = ExamData.SUBJECTS.map((subject) => {
      const selected = subject.key === state.subjectKey ? "selected" : "";
      return `<option value="${subject.key}" ${selected}>${escapeHtml(subject.title)}</option>`;
    }).join("");
  }

  function renderRouteSelect() {
    ui.routeSelect.innerHTML = Object.values(PlanningEngine.ROUTES)
      .map((route) => {
        const selected = route.key === state.activeRoute ? "selected" : "";
        return `<option value="${route.key}" ${selected}>${escapeHtml(route.title)}</option>`;
      })
      .join("");
  }

  function renderVariantSelect() {
    const variants = ExamData.listStableVariants(state.subjectKey, {
      modelKey: (ui.examModelSelect && ui.examModelSelect.value) || EXAM_SCENARIOS.mixedTrainer,
      questionCount: Number((ui.questionCountInput && ui.questionCountInput.value) || 0) || getSubjectConfig().defaultQuestions,
    });
    ui.variantSelect.innerHTML = variants
      .map(
        (item) =>
          `<option value="${item.variant}" title="${escapeHtml(item.variantId || "")}">Вариант ${item.variant}</option>`,
      )
      .join("");
  }

  function renderSegmentSelect() {
    const metadata = (ExamData.CONTENT_COVERAGE_MAP && ExamData.CONTENT_COVERAGE_MAP[state.subjectKey]) || [];
    let segments = Array.from(new Set(metadata.map((item) => item.section))).sort();
    if (!segments.length) {
      const pool = getSubjectPool(state.subjectKey);
      segments = Array.from(new Set(pool.map((question) => question.segment))).sort();
    }

    ui.segmentSelect.innerHTML = ["<option value=\"any\">Все сегменты</option>"]
      .concat(segments.map((segment) => `<option value="${escapeHtml(segment)}">${escapeHtml(segment)}</option>`))
      .join("");
  }

  function renderFipiLinks() {
    const config = getSubjectConfig();
    const links = [
      { label: "Кодификатор", href: config.fipiLinks.codifier },
      { label: "Спецификация", href: config.fipiLinks.specification },
      { label: "Демоверсия", href: config.fipiLinks.demo },
      { label: "Навигатор", href: config.fipiLinks.navigator },
    ];

    ui.fipiLinks.innerHTML = links
      .map(
        (link) =>
          `<a class="chip-link" href="${escapeHtml(link.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(
            link.label,
          )}</a>`,
      )
      .join("");
  }

  function renderCoveragePreview() {
    if (state.activeMode !== MODES.exam) {
      ui.coverageBox.innerHTML = "<p class=\"setup-note\">Матрица используется в режиме экзамена.</p>";
      return;
    }

    const scenario = ui.examModelSelect.value;

    if (
      scenario === EXAM_SCENARIOS.subjectModelExact ||
      scenario === EXAM_SCENARIOS.subjectModelTraining
    ) {
      const modelKey =
        scenario === EXAM_SCENARIOS.subjectModelTraining ? "subjectModelTraining" : "subjectModelExact";
      const blueprint = ExamData.getSubjectBlueprint(state.subjectKey, modelKey);
      if (!blueprint.blocks || !blueprint.blocks.length) {
        ui.coverageBox.innerHTML = '<p class="setup-note">Для предмета нет блочной модели экзамена.</p>';
        return;
      }

      const structureSummary = blueprint.blocks
        .map((block) => `${block.title}: ${block.count}`)
        .join(" · ");

      const rows = blueprint.blocks
        .map(
          (block) => `<tr>
            <td>${escapeHtml(block.title)}</td>
            <td>${block.count}</td>
            <td>${escapeHtml((block.segments || []).join(", "))}</td>
            <td>${escapeHtml(
              (block.allowedTypes || [])
                .map((type) => AssessmentEngine.TYPE_LABELS[type] || type)
                .join(", "),
            )}</td>
          </tr>`,
        )
        .join("");

      ui.coverageBox.innerHTML = `
        <table class="matrix-table">
          <thead><tr><th>Блок</th><th>Вопросов</th><th>Сегменты</th><th>Типы</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p class="setup-note">Модель: ${escapeHtml(blueprint.title)} · лимит времени ${blueprint.timeLimitMinutes} мин. · порядок: ${escapeHtml(
          orderPolicyLabel(blueprint.orderPolicy),
        )}</p>
        <p class="setup-note">Структура: ${escapeHtml(structureSummary)}</p>
        <p class="info-banner">${escapeHtml((blueprint.notices && blueprint.notices.disclaimer) || "")}</p>
      `;
      return;
    }

    const count = ExamData.clampQuestionCount(state.subjectKey, Number(ui.questionCountInput.value));
    const matrix = ExamData.buildCoverageMatrix(state.subjectKey, count);

    const segmentRows = Object.entries(matrix.segmentPlan)
      .map(([segment, amount]) => `<tr><td>${escapeHtml(segment)}</td><td>${amount}</td></tr>`)
      .join("");

    const difficultyRows = Object.entries(matrix.difficultyPlan)
      .map(([level, amount]) => `<tr><td>${escapeHtml(difficultyLabel(level))}</td><td>${amount}</td></tr>`)
      .join("");

    ui.coverageBox.innerHTML = `
      <table class="matrix-table">
        <thead><tr><th>Сегмент</th><th>План</th></tr></thead>
        <tbody>${segmentRows}</tbody>
      </table>
      <table class="matrix-table" style="margin-top:8px">
        <thead><tr><th>Сложность</th><th>План</th></tr></thead>
        <tbody>${difficultyRows}</tbody>
      </table>
      <p class="setup-note">Минимальная доля сложных заданий: ${Math.round(matrix.hardShareMin * 100)}%</p>
    `;
  }

  function getVariantRecord(subjectKey, variant) {
    return (
      state.stats.variantStatus &&
      state.stats.variantStatus[subjectKey] &&
      state.stats.variantStatus[subjectKey][String(variant)]
    ) || null;
  }

  function getVariantStatusChip(record) {
    if (!record) {
      return { label: "не пройдено", className: "status-none" };
    }

    if (record.status === "done") {
      return { label: "пройдено", className: "status-done" };
    }

    return { label: "пройдено частично", className: "status-partial" };
  }

  function renderVariantStatuses() {
    if (state.activeMode !== MODES.exam) {
      ui.variantStatusBox.innerHTML = '<p class="setup-note">Статусы вариантов доступны в режиме экзамена.</p>';
      return;
    }

    const rows = Array.from({ length: ExamData.VARIANT_COUNT }, (_, index) => {
      const variant = index + 1;
      const record = getVariantRecord(state.subjectKey, variant);
      const chip = getVariantStatusChip(record);

      return `
        <tr>
          <td>Вариант ${variant}</td>
          <td><span class="status-chip ${chip.className}">${chip.label}</span></td>
          <td>${record ? record.total : "-"}</td>
          <td>${record ? record.correct : "-"}</td>
          <td>${record ? record.wrong : "-"}</td>
          <td>${record ? record.unanswered : "-"}</td>
        </tr>
      `;
    }).join("");

    ui.variantStatusBox.innerHTML = `
      <table class="status-table">
        <thead>
          <tr>
            <th>Вариант</th>
            <th>Статус</th>
            <th>Вопросов</th>
            <th>Правильно</th>
            <th>Неправильно</th>
            <th>Без ответа</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
    stripLegacyVariantIdColumn();
  }

  function stripLegacyVariantIdColumn() {
    if (!ui.variantStatusBox) {
      return;
    }
    const table = ui.variantStatusBox.querySelector("table");
    if (!table) {
      return;
    }
    const headCells = table.querySelectorAll("thead th");
    if (!headCells.length) {
      return;
    }
    let legacyIndex = -1;
    headCells.forEach((cell, index) => {
      const label = String(cell.textContent || "").trim().toLowerCase();
      if (label === "variantid" || label === "variant id") {
        legacyIndex = index;
      }
    });
    if (legacyIndex < 0) {
      return;
    }
    table.querySelectorAll("tr").forEach((row) => {
      const cells = row.querySelectorAll("th,td");
      if (cells[legacyIndex]) {
        cells[legacyIndex].remove();
      }
    });
  }

  function getTopicStatusLabel(status) {
    if (status === "strong") {
      return { label: "сильная", badge: "badge-strong" };
    }
    if (status === "weak") {
      return { label: "слабая", badge: "badge-weak" };
    }
    return { label: "нестабильная", badge: "badge-unstable" };
  }

  function renderWeakTopicsBlock() {
    const weak = (state.stats.weakTopics || []).filter(
      (item) => item.subject === state.subjectKey && item.status !== "strong",
    );

    if (!weak.length) {
      ui.weakTopicsBox.innerHTML =
        '<p class="setup-note">Пока нет выраженных слабых тем. Продолжайте решать задания.</p>';
      return;
    }

    ui.weakTopicsBox.innerHTML = `<div class="weak-list">${weak
      .slice(0, 8)
      .map((item) => {
        const badge = getTopicStatusLabel(item.status);
        return `<div class="weak-item"><strong>${escapeHtml(item.segment)} · ${escapeHtml(
          item.topic,
        )}</strong><br><span class="badge ${badge.badge}">${badge.label}</span> · точность ${Math.round(
          (item.accuracy || 0) * 100,
        )}% · вопросов ${item.attempted}</div>`;
      })
      .join("")}</div>`;
  }

  function renderResumeSessionBox() {
    const snapshot = state.resumeSession || loadResumeSnapshot();
    state.resumeSession = snapshot;
    if (!snapshot || !snapshot.session) {
      ui.resumeSessionBox.innerHTML = '<p class="setup-note">Активной незавершенной сессии нет.</p>';
      return;
    }

    const subject = getSubjectInfo(snapshot.session.subject);
    const answered = (snapshot.session.answers || []).filter(Boolean).length;
    const total =
      snapshot.session.questionCount ||
      ((snapshot.session.questions && snapshot.session.questions.length) || 0);
    const savedAt = new Date(snapshot.savedAt || Date.now()).toLocaleString();

    ui.resumeSessionBox.innerHTML = `
      <div class="resume-card">
        <strong>${escapeHtml(subject ? subject.title : snapshot.session.subject)} · ${escapeHtml(
          modeLabel(snapshot.session.mode),
        )}</strong>
        <p>Прогресс: ${answered}/${total} · сохранено: ${escapeHtml(savedAt)}</p>
        <div class="exam-actions">
          <button id="resumeSessionBtn" class="primary-btn">Продолжить</button>
          <button id="discardResumeBtn" class="ghost-btn">Отменить сохранение</button>
        </div>
      </div>
    `;
  }

  function applyDefaultsForSubject() {
    const config = getSubjectConfig();
    ui.questionCountInput.min = config.minQuestions;
    ui.questionCountInput.max = config.maxQuestions;
    ui.questionCountInput.value = config.defaultQuestions;

    ui.timeLimitInput.min = ExamData.MIN_TIME_MINUTES;
    ui.timeLimitInput.max = ExamData.MAX_TIME_MINUTES;
    ui.timeLimitInput.value = config.defaultMinutes;

    ui.examModelSelect.value = EXAM_SCENARIOS.mixedTrainer;
    renderVariantSelect();
    if (ui.variantSelect.options.length) {
      ui.variantSelect.value = "1";
    }

    ui.limitsHint.textContent = `Дефолт предмета: ${config.defaultQuestions} вопросов, ${config.defaultMinutes} минут.`;
    syncExamScenarioControls();

    renderSegmentSelect();
    ui.segmentSelect.value = "any";
    ui.difficultySelect.value = "any";
    renderFipiLinks();
    renderResumeSessionBox();
    renderWeakTopicsBlock();
    renderCoveragePreview();
    renderVariantStatuses();
    renderSubjectCards();
  }

  function syncExamScenarioControls() {
    const inExamMode = state.activeMode === MODES.exam;
    const scenario = (ui.examModelSelect && ui.examModelSelect.value) || EXAM_SCENARIOS.mixedTrainer;
    const isExact = inExamMode && isExactScenario(scenario);
    const countField = ui.questionCountInput && ui.questionCountInput.closest(".field");
    const timeField = ui.timeLimitInput && ui.timeLimitInput.closest(".field");

    if (!inExamMode) {
      ui.questionCountInput.disabled = false;
      ui.timeLimitInput.disabled = false;
      if (countField) {
        countField.classList.remove("field-locked");
      }
      if (timeField) {
        timeField.classList.remove("field-locked");
      }
      return;
    }

    if (!isExact) {
      ui.questionCountInput.disabled = false;
      ui.timeLimitInput.disabled = false;
      if (countField) {
        countField.classList.remove("field-locked");
      }
      if (timeField) {
        timeField.classList.remove("field-locked");
      }
      ui.questionCountInput.value = ExamData.clampQuestionCount(state.subjectKey, Number(ui.questionCountInput.value));
      ui.timeLimitInput.value = ExamData.clampTimeLimit(state.subjectKey, Number(ui.timeLimitInput.value));
      return;
    }

    let blueprint;
    try {
      blueprint = ExamData.getSubjectBlueprint(state.subjectKey, "subjectModelExact");
    } catch (error) {
      console.error(error);
      blueprint = null;
    }
    const subject = getSubjectInfo(state.subjectKey);
    const count = blueprintQuestionCount(blueprint, state.subjectKey);
    const timeLimit = Number((blueprint && blueprint.timeLimitMinutes) || getSubjectConfig().defaultMinutes);
    const structure = blueprint && blueprint.blocks
      ? blueprint.blocks.map((block) => `${block.title}: ${block.count}`).join(" · ")
      : "Структура недоступна";

    ui.questionCountInput.value = count;
    ui.timeLimitInput.value = timeLimit;
    ui.questionCountInput.disabled = true;
    ui.timeLimitInput.disabled = true;
    if (countField) {
      countField.classList.add("field-locked");
    }
    if (timeField) {
      timeField.classList.add("field-locked");
    }
    ui.limitsHint.textContent = `${subject.title} · точный экзаменационный макет: ${count} заданий, ${timeLimit} минут. Параметры зафиксированы по модели предмета.`;
    ui.modeHint.textContent = `Структура: ${structure}`;
  }

  function closeBankDiagnosticsPanel(showNote = true) {
    state.bankDiagnostics = null;
    ui.bankDiagnosticsBox.innerHTML = showNote
      ? '<p class="setup-note">Диагностика скрыта.</p>'
      : "";
    if (ui.closeBankDiagnosticsBtn) {
      ui.closeBankDiagnosticsBtn.classList.add("hidden");
    }
  }

  function flashButtonLabel(button, nextLabel, timeoutMs = 1100) {
    if (!button) {
      return;
    }
    const prev = button.textContent;
    button.textContent = nextLabel;
    button.disabled = true;
    setTimeout(() => {
      button.textContent = prev;
      button.disabled = false;
    }, timeoutMs);
  }

  function onResetDefaultsClick() {
    applyDefaultsForSubject();
    setMode(state.activeMode);
    let extra = "";
    if (confirm("Сбросить также статистику текущего предмета?")) {
      resetSubjectStatsCore(state.subjectKey);
      extra = " Статистика предмета очищена.";
    }
    ui.modeHint.textContent = "Параметры сброшены к значениям предмета." + extra;
    flashButtonLabel(ui.resetDefaultsBtn, "Сброшено");
  }

  function onClearResumeSessionClick() {
    clearResumeSnapshot();
    renderResumeSessionBox();
    ui.modeHint.textContent = "Сохранённая сессия удалена.";
    flashButtonLabel(ui.clearResumeSessionBtn, "Сброшено");
  }

  function onRefreshProgressClick() {
    updateTopicStatuses(state.stats);
    saveStats();
    renderProgressScreen();
    flashButtonLabel(ui.refreshProgressBtn, "Обновлено");
  }

  function onRefreshCoverageClick() {
    delete state.coverageCache[state.subjectKey];
    refreshCoverage(state.subjectKey);
    renderCoveragePreview();
    renderCoverageScreen();
    flashButtonLabel(ui.refreshCoverageBtn, "Обновлено");
  }

  function onRefreshReportClick() {
    updateTopicStatuses(state.stats);
    saveStats();
    renderReportScreen();
    flashButtonLabel(ui.refreshReportBtn, "Обновлено");
  }

  function initSetup() {
    renderSubjectSelect();
    renderRouteSelect();
    applyDefaultsForSubject();
    setMode(MODES.topic);
  }

  function currentConfigFromUi() {
    const scenario = (ui.examModelSelect && ui.examModelSelect.value) || EXAM_SCENARIOS.mixedTrainer;
    let count = ExamData.clampQuestionCount(state.subjectKey, Number(ui.questionCountInput.value));
    let timeLimit = ExamData.clampTimeLimit(state.subjectKey, Number(ui.timeLimitInput.value));

    if (state.activeMode === MODES.exam && isExactScenario(scenario)) {
      try {
        const exactBlueprint = ExamData.getSubjectBlueprint(state.subjectKey, "subjectModelExact");
        count = blueprintQuestionCount(exactBlueprint, state.subjectKey);
        timeLimit = Number(exactBlueprint.timeLimitMinutes || getSubjectConfig().defaultMinutes);
      } catch (error) {
        console.error(error);
        count = getSubjectConfig().defaultQuestions;
        timeLimit = getSubjectConfig().defaultMinutes;
      }
    }

    const base = {
      mode: state.activeMode,
      subject: state.subjectKey,
      count,
    };

    if (state.activeMode === MODES.exam) {
      return {
        ...base,
        variant: Number(ui.variantSelect.value),
        examScenario: scenario,
        timeLimitMinutes: timeLimit,
      };
    }

    if (state.activeMode === MODES.topic) {
      return {
        ...base,
        segment: ui.segmentSelect.value,
        difficulty: ui.difficultySelect.value,
        timeLimitMinutes: null,
      };
    }

    return {
      ...base,
      segment: "any",
      difficulty: "any",
      timeLimitMinutes: null,
      variant: null,
      examScenario: null,
    };
  }

  function startTimer() {
    stopTimer();

    if (!state.currentSession || state.currentSession.mode !== MODES.exam) {
      ui.timerText.textContent = "без лимита";
      ui.timerBox.classList.remove("warning");
      return;
    }

    if (state.currentSession.remainingSeconds <= 0) {
      finishSession(true);
      return;
    }

    const tick = () => {
      if (!state.currentSession) {
        return;
      }

      state.currentSession.remainingSeconds -= 1;
      if (state.currentSession.remainingSeconds <= 0) {
        state.currentSession.remainingSeconds = 0;
        updateTimerView();
        finishSession(true);
        return;
      }

      if (state.currentSession.remainingSeconds % 15 === 0) {
        saveResumeSnapshot(state.currentSession);
      }
      updateTimerView();
    };

    updateTimerView();
    state.timerId = setInterval(tick, 1000);
  }

  function stopTimer() {
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
  }

  function updateTimerView() {
    if (!state.currentSession || state.currentSession.mode !== MODES.exam) {
      ui.timerText.textContent = "без лимита";
      ui.timerBox.classList.remove("warning");
      return;
    }

    ui.timerText.textContent = formatTime(state.currentSession.remainingSeconds);
    ui.timerBox.classList.toggle("warning", state.currentSession.remainingSeconds <= 300);
  }

  function formatUserAnswer(question, rawAnswer) {
    const type = AssessmentEngine.normalizeType(question.type);

    if (!rawAnswer) {
      return "Нет ответа";
    }

    if (type === "single-choice") {
      const index = rawAnswer.selectedIndex;
      return Number.isInteger(index) ? question.options[index] || "Нет ответа" : "Нет ответа";
    }

    if (type === "multi-choice") {
      const values = (rawAnswer.selectedIndexes || []).map((index) => question.options[index]).filter(Boolean);
      return values.length ? values.join(", ") : "Нет ответа";
    }

    if (type === "short-text") {
      return rawAnswer.text || "Нет ответа";
    }

    if (type === "numeric-input") {
      return rawAnswer.raw || String(rawAnswer.numericValue !== undefined && rawAnswer.numericValue !== null ? rawAnswer.numericValue : "Нет ответа");
    }

    if (type === "sequence-order") {
      return (rawAnswer.orderedIds || []).join(" -> ") || "Нет ответа";
    }

    if (type === "matching") {
      const pairs = rawAnswer.pairs || {};
      return Object.entries(pairs)
        .filter(([, value]) => value)
        .map(([left, right]) => `${left}-${right}`)
        .join(", ") || "Нет ответа";
    }

    if (type === "fill-in-the-blank") {
      return (rawAnswer.blanks || []).join(" / ") || "Нет ответа";
    }

    if (type === "extended-answer-lite") {
      return rawAnswer.text || "Нет ответа";
    }

    return "Нет ответа";
  }

  function renderExplanation(question, answerRecord, evaluation) {
    const exp = question.explanation || {};
    const correctText = AssessmentEngine.formatCorrectAnswer(question);
    const noAutoCheck = Boolean(evaluation && evaluation.detail && evaluation.detail.noAutoCheck);

    ui.feedbackBox.classList.remove("hidden", "feedback-ok", "feedback-bad");
    ui.feedbackBox.classList.add(noAutoCheck ? "feedback-ok" : evaluation.isCorrect ? "feedback-ok" : "feedback-bad");

    const parts = [
      { label: "Почему", value: exp.why },
      { label: "Правило", value: exp.rule || question.rule },
      { label: "Формула/принцип", value: exp.formula },
      { label: "Пошагово", value: exp.stepByStep || question.steps },
      { label: "Типичная ошибка", value: exp.commonMistakes || question.commonMistake },
      { label: "Альтернативный путь", value: exp.alternateMethod },
      { label: "Как распознать похожую задачу", value: exp.recognitionTip || question.recognitionTip },
    ].filter((item) => item.value);

    const baseParts = parts.slice(0, 3);
    const extraParts = parts.slice(3);

      if (question.type === "extended-answer-lite" && evaluation.detail) {
      const matched = (evaluation.detail.matchedKeyPoints || []).join(", ");
      extraParts.push({
        label: "Ключевые элементы в ответе",
        value: matched || "Ключевые элементы не обнаружены.",
      });
      if (Array.isArray(evaluation.detail.missingRequired) && evaluation.detail.missingRequired.length) {
        extraParts.push({
          label: "Что обязательно добавить",
          value: evaluation.detail.missingRequired.join(", "),
        });
      }
      if (Array.isArray(evaluation.detail.matchedOptional) && evaluation.detail.matchedOptional.length) {
        extraParts.push({
          label: "Найдены желательные элементы",
          value: evaluation.detail.matchedOptional.join(", "),
        });
      }
      if (evaluation.detail.manualReview) {
        const manual = evaluation.detail.manualReview;
        extraParts.push({
          label: "Ручная педагогическая отметка",
          value:
            `Логика: ${manual.logicPresent ? "есть" : "нет"}; аргументация: ${
              manual.argumentationSufficient ? "достаточна" : "недостаточна"
            }; критичные ошибки: ${manual.criticalErrors ? "есть" : "нет"}.`,
        });
      }
      if (evaluation.detail.strongSample) {
        extraParts.push({
          label: "Образец сильного ответа",
          value: evaluation.detail.strongSample,
        });
      }
    }

    ui.feedbackBox.innerHTML = `
      <h4>${noAutoCheck ? "Ответ сохранён" : evaluation.isCorrect ? "Верно" : "Нужно доработать"}</h4>
      <p><strong>Твой ответ:</strong> ${escapeHtml(formatUserAnswer(question, answerRecord.raw))}</p>
      <p><strong>Правильный ответ:</strong> ${escapeHtml(correctText)}</p>
      <p><strong>Оценка:</strong> ${Math.round((evaluation.score || 0) * 100)}%</p>
      ${
        noAutoCheck
          ? `<p class="info-banner">Учебная самопроверка: ${escapeHtml(
              evaluation.detail.noAutoCheckMessage || "автоматический ключ недоступен",
            )}</p>`
          : ""
      }
      <div class="explain-grid">
        ${baseParts
          .map(
            (item) =>
              `<div class="explain-item"><p><strong>${escapeHtml(item.label)}:</strong> ${escapeHtml(
                item.value,
              )}</p></div>`,
          )
          .join("")}
      </div>
      ${
        extraParts.length
          ? `<div id="extraExplainBox" class="explain-grid hidden">
              ${extraParts
                .map(
                  (item) =>
                    `<div class="explain-item"><p><strong>${escapeHtml(item.label)}:</strong> ${escapeHtml(
                      item.value,
                    )}</p></div>`,
                )
                .join("")}
            </div>`
          : ""
      }
      <div class="explain-actions">
        <button class="tiny-btn" data-explain-action="more">Объяснить подробнее</button>
        <button class="tiny-btn" data-explain-action="rule">Показать правило</button>
        <button class="tiny-btn" data-explain-action="similar">Показать похожий пример</button>
        <button class="tiny-btn" data-explain-action="reinforce">Закрепить ещё 3 похожими заданиями</button>
      </div>
      ${
        question.type === "extended-answer-lite"
          ? '<p class="info-banner">Развернутый ответ: ориентировочная учебная оценка, а не официальный балл. Сверяйтесь с чек-листом и образцом.</p>'
          : ""
      }
    `;
  }

  function clearSupplementTimer() {
    if (state.supplementTimerId) {
      clearInterval(state.supplementTimerId);
      state.supplementTimerId = null;
    }
  }

  function runSupplementTimer(seconds, outputElement, doneText) {
    clearSupplementTimer();
    let remaining = Math.max(0, Number(seconds) || 0);

    const format = (value) => {
      const m = Math.floor(value / 60);
      const s = value % 60;
      return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    };

    outputElement.textContent = format(remaining);
    state.supplementTimerId = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearSupplementTimer();
        outputElement.textContent = doneText;
        return;
      }
      outputElement.textContent = format(remaining);
    }, 1000);
  }

  function renderQuestionSupplement(question) {
    if (!ui.questionSupplement) {
      return;
    }

    clearSupplementTimer();
    ui.questionSupplement.innerHTML = "";
    const pieces = [];
    const media = question.media || null;
    const speakingLite = question.speakingLite || null;
    const writingLite = question.writingLite || null;
    const passage = String(question.passage || "").trim();

    if (passage) {
      pieces.push(`
        <div class="supplement-card">
          <strong>${escapeHtml(question.passageTitle || "Текст для заданий")}</strong>
          <details open>
            <summary>Показать текст</summary>
            <p class="passage-text">${escapeHtml(passage)}</p>
          </details>
        </div>
      `);
    }

    if (media && media.type === "audio") {
      pieces.push(`
        <div class="supplement-card">
          <strong>Аудирование (lite)</strong>
          <p class="setup-note">${
            media.description
              ? escapeHtml(media.description)
              : "Прослушайте локальный аудио-фрагмент. Если файл недоступен, используйте mock-материал."
          }</p>
          ${
            media.localFile
              ? `<audio id="questionAudioPlayer" controls preload="metadata" src="${escapeHtml(media.localFile)}"></audio>`
              : ""
          }
          <p id="audioFallbackNote" class="setup-note ${
            media.localFile ? "hidden" : ""
          }">Аудиофайл не подключен. Используется mock-материал.</p>
          ${
            media.mockTranscript
              ? `<details><summary>Mock-аудио / транскрипт</summary><p>${escapeHtml(media.mockTranscript)}</p></details>`
              : ""
          }
        </div>
      `);
    }

    if (speakingLite) {
      pieces.push(`
        <div class="supplement-card">
          <strong>Устная часть (lite)</strong>
          <p class="setup-note">${
            speakingLite.taskCard
              ? escapeHtml(speakingLite.taskCard)
              : "Учебный устный ответ: подготовка и ответ по таймеру."
          }</p>
          <div class="exam-actions">
            <button type="button" class="tiny-btn" id="startPrepTimerBtn">Таймер подготовки</button>
            <button type="button" class="tiny-btn" id="startAnswerTimerBtn">Таймер ответа</button>
            <span id="speakingTimerText" class="setup-note">--:--</span>
          </div>
          ${
            speakingLite.sampleAnswer
              ? `<details><summary>Образец ответа</summary><p>${escapeHtml(speakingLite.sampleAnswer)}</p></details>`
              : ""
          }
          ${
            Array.isArray(speakingLite.checklist) && speakingLite.checklist.length
              ? `<details><summary>Checklist самооценки</summary>${speakingLite.checklist
                  .map((item) => `<p>• ${escapeHtml(item)}</p>`)
                  .join("")}</details>`
              : ""
          }
        </div>
      `);
    }

    if (writingLite) {
      pieces.push(`
        <div class="supplement-card">
          <strong>Письмо (lite)</strong>
          <p class="setup-note">${escapeHtml(writingLite.prompt || "Письменный учебный ответ по структуре.")}</p>
          ${
            Array.isArray(writingLite.expectedStructure) && writingLite.expectedStructure.length
              ? `<details><summary>Ожидаемая структура</summary>${writingLite.expectedStructure
                  .map((item) => `<p>• ${escapeHtml(item)}</p>`)
                  .join("")}</details>`
              : ""
          }
          ${
            Array.isArray(writingLite.keyPoints) && writingLite.keyPoints.length
              ? `<details><summary>Ключевые пункты</summary>${writingLite.keyPoints
                  .map((item) => `<p>• ${escapeHtml(item)}</p>`)
                  .join("")}</details>`
              : ""
          }
          ${
            writingLite.sampleStrongAnswer
              ? `<details><summary>Образец сильного ответа</summary><p>${escapeHtml(
                  writingLite.sampleStrongAnswer,
                )}</p></details>`
              : ""
          }
        </div>
      `);
    }

    if (!pieces.length) {
      return;
    }

    ui.questionSupplement.innerHTML = pieces.join("");

    const audio = ui.questionSupplement.querySelector("#questionAudioPlayer");
    const fallback = ui.questionSupplement.querySelector("#audioFallbackNote");
    if (audio && fallback) {
      audio.addEventListener("error", () => {
        fallback.classList.remove("hidden");
      });
    }

    const prepBtn = ui.questionSupplement.querySelector("#startPrepTimerBtn");
    const answerBtn = ui.questionSupplement.querySelector("#startAnswerTimerBtn");
    const timerText = ui.questionSupplement.querySelector("#speakingTimerText");
    if (prepBtn && answerBtn && timerText) {
      prepBtn.addEventListener("click", () => {
        runSupplementTimer(Number(speakingLite.prepSec) || 90, timerText, "Подготовка завершена");
      });
      answerBtn.addEventListener("click", () => {
        runSupplementTimer(Number(speakingLite.answerSec) || 120, timerText, "Ответ завершен");
      });
    }
  }

  function renderSessionQuestion() {
    const session = state.currentSession;
    const question = session.questions[session.currentIndex];
    const number = session.currentIndex + 1;

    ui.progressText.textContent = `Вопрос ${number} из ${session.questions.length}`;
    ui.progressBar.style.width = `${(number / session.questions.length) * 100}%`;

    const typeLabel = AssessmentEngine.TYPE_LABELS[AssessmentEngine.normalizeType(question.type)] || "Один ответ";
    const metaParts = [
      `Сложность: ${difficultyLabel(question.difficulty)}`,
      `тип: ${typeLabel}`,
    ];
    const sourceLabel = buildQuestionSourceLabel(question);
    if (sourceLabel) {
      metaParts.push(sourceLabel);
    }

    ui.questionTopic.textContent = `${question.segment} · ${question.topic}`;
    ui.questionMeta.textContent = metaParts.join(" · ");
    ui.questionPrompt.textContent = question.prompt;
    renderQuestionSupplement(question);

    ui.optionsBox.innerHTML = "";
    ui.feedbackBox.classList.add("hidden");
    ui.feedbackBox.innerHTML = "";

    session.inputController = AssessmentEngine.renderQuestionInput(ui.optionsBox, question);
    session.awaitingCheck = true;

    ui.nextBtn.disabled = false;
    ui.nextBtn.textContent = "Ответить";

    session.questionStartedAt = performance.now();
  }

  function reinforceWithSimilarQuestions(question, amount = 3) {
    const pool = getSubjectPool(question.subject);
    const sameTopic = pool.filter(
      (item) =>
        item.segment === question.segment &&
        item.topic === question.topic &&
        questionKey(item) !== questionKey(question),
    );

    const selected = pickQuestionsByScore(sameTopic.length ? sameTopic : pool, amount, {
      mode: MODES.mistakes,
      recentSet: recentQuestionSet(question.subject),
      weakSet: getWeakTopicSet(question.subject),
    });

    if (!selected.length) {
      alert("Не удалось подобрать похожие задания.");
      return;
    }

    setMode(MODES.mistakes);
    ui.questionCountInput.value = selected.length;
    startSession(selected);
  }

  function onFeedbackActionClick(event) {
    const target = event.target.closest("[data-explain-action]");
    if (!target) {
      return;
    }

    const session = state.currentSession;
    if (!session) {
      return;
    }
    const question = session.questions[session.currentIndex];
    if (!question) {
      return;
    }

    const action = target.dataset.explainAction;
    if (action === "more") {
      const extra = ui.feedbackBox.querySelector("#extraExplainBox");
      if (extra) {
        extra.classList.toggle("hidden");
      }
      return;
    }

    if (action === "rule") {
      const rule =
        (question.explanation && question.explanation.rule) ||
        question.rule ||
        "Правило недоступно для этого задания.";
      alert(`Правило:\\n\\n${rule}`);
      return;
    }

    if (action === "similar") {
      const tip =
        (question.explanation && question.explanation.recognitionTip) ||
        question.recognitionTip ||
        (question.explanation && question.explanation.alternateMethod) ||
        "Смотрите на ключевые маркеры задания: тема, формат ответа и тип ловушек.";
      alert(`Как распознать похожую задачу:\\n\\n${tip}`);
      return;
    }

    if (action === "reinforce") {
      reinforceWithSimilarQuestions(question, 3);
    }
  }

  function submitCurrentAnswer() {
    const session = state.currentSession;
    const question = session.questions[session.currentIndex];

    if (!session.inputController) {
      return;
    }

    const rawAnswer = session.inputController.getUserAnswer();
    const evaluation = AssessmentEngine.evaluateAnswer(question, rawAnswer);

    if (!evaluation.isAnswered) {
      alert("Сначала введите ответ.");
      return;
    }

    const elapsedMs = Math.round(performance.now() - session.questionStartedAt);

    const answerRecord = {
      raw: rawAnswer,
      isCorrect: evaluation.isCorrect,
      score: Number(evaluation.score || 0),
      detail: evaluation.detail || {},
      elapsedMs,
      answeredAt: nowIso(),
    };

    session.answers[session.currentIndex] = answerRecord;
    session.inputController.lock();
    session.awaitingCheck = false;

    if (session.mode !== MODES.exam) {
      renderExplanation(question, answerRecord, evaluation);
    } else {
      ui.feedbackBox.classList.remove("hidden", "feedback-ok", "feedback-bad");
      ui.feedbackBox.classList.add(evaluation.isCorrect ? "feedback-ok" : "feedback-bad");
      ui.feedbackBox.innerHTML = `<p><strong>Ответ сохранён.</strong> Разбор будет доступен после завершения экзамена.</p>`;
    }

    const atLast = session.currentIndex >= session.questions.length - 1;
    ui.nextBtn.textContent = atLast ? "Завершить сессию" : "Следующий вопрос";
    saveResumeSnapshot(session);
  }

  function sessionTopicBreakdown(session) {
    const map = {};

    session.questions.forEach((question, index) => {
      const key = topicKey(question);
      if (!map[key]) {
        map[key] = {
          subject: question.subject,
          segment: question.segment,
          topic: question.topic,
          attempted: 0,
          correct: 0,
          wrong: 0,
          unanswered: 0,
          scoreSum: 0,
          accuracy: 0,
        };
      }

      const answer = session.answers[index];
      if (!answer) {
        map[key].unanswered += 1;
      } else {
        map[key].attempted += 1;
        map[key].scoreSum += Number(answer.score || 0);
        if (answer.isCorrect) {
          map[key].correct += 1;
        } else {
          map[key].wrong += 1;
        }
      }
    });

    Object.values(map).forEach((item) => {
      const base = item.attempted + item.unanswered;
      item.accuracy = base ? item.correct / base : 0;
      item.avgScore = item.attempted ? item.scoreSum / item.attempted : 0;
    });

    return map;
  }

  function sessionDifficultyBreakdown(session) {
    const map = {
      basic: { total: 0, correct: 0, score: 0 },
      medium: { total: 0, correct: 0, score: 0 },
      hard: { total: 0, correct: 0, score: 0 },
    };

    session.questions.forEach((question, index) => {
      if (!map[question.difficulty]) {
        map[question.difficulty] = { total: 0, correct: 0, score: 0 };
      }

      map[question.difficulty].total += 1;
      const answer = session.answers[index];
      if (answer) {
        map[question.difficulty].score += Number(answer.score || 0);
        if (answer.isCorrect) {
          map[question.difficulty].correct += 1;
        }
      }
    });

    return map;
  }

  function updateTopicStatuses(stats) {
    const weakTopics = [];

    Object.values(stats.byTopic).forEach((topicStats) => {
      const answered = topicStats.correct + topicStats.wrong + topicStats.unanswered;
      topicStats.attempted = answered;
      topicStats.accuracy = answered ? topicStats.correct / answered : 0;

      let status = "unstable";
      if (answered >= MASTERY.minQuestions) {
        if (topicStats.accuracy >= MASTERY.strongAccuracy) {
          status = "strong";
        } else if (topicStats.accuracy >= MASTERY.unstableAccuracy) {
          status = "unstable";
        } else {
          status = "weak";
        }
      }

      topicStats.status = status;

      if (status !== "strong") {
        weakTopics.push({
          subject: topicStats.subject,
          segment: topicStats.segment,
          topic: topicStats.topic,
          status,
          accuracy: topicStats.accuracy,
          attempted: topicStats.attempted,
          updatedAt: topicStats.updatedAt,
        });
      }
    });

    weakTopics.sort((a, b) => a.accuracy - b.accuracy);
    stats.weakTopics = weakTopics;
  }

  function ensureAggregate(map, key, factory) {
    if (!map[key]) {
      map[key] = factory();
    }
    return map[key];
  }

  function saveSessionToStats(session, result) {
    const stats = state.stats;

    const modeStats = ensureAggregate(stats.byMode, session.mode, () => ({
      mode: session.mode,
      sessions: 0,
      attempted: 0,
      correct: 0,
      wrong: 0,
      unanswered: 0,
      totalScore: 0,
      accuracy: 0,
      updatedAt: nowIso(),
    }));

    modeStats.sessions += 1;
    modeStats.attempted += result.total;
    modeStats.correct += result.correct;
    modeStats.wrong += result.wrong;
    modeStats.unanswered += result.unanswered;
    modeStats.totalScore += result.totalScore;
    modeStats.accuracy = modeStats.attempted ? modeStats.correct / modeStats.attempted : 0;
    modeStats.updatedAt = nowIso();

    const subjectStats = ensureAggregate(stats.bySubject, session.subject, () => ({
      subject: session.subject,
      sessions: 0,
      attempted: 0,
      correct: 0,
      wrong: 0,
      unanswered: 0,
      totalScore: 0,
      totalTimeSec: 0,
      avgTimePerQuestionSec: 0,
      accuracy: 0,
      updatedAt: nowIso(),
    }));

    subjectStats.sessions += 1;
    subjectStats.attempted += result.total;
    subjectStats.correct += result.correct;
    subjectStats.wrong += result.wrong;
    subjectStats.unanswered += result.unanswered;
    subjectStats.totalScore += result.totalScore;
    subjectStats.totalTimeSec += result.durationSec;
    subjectStats.avgTimePerQuestionSec = subjectStats.attempted
      ? subjectStats.totalTimeSec / subjectStats.attempted
      : 0;
    subjectStats.accuracy = subjectStats.attempted ? subjectStats.correct / subjectStats.attempted : 0;
    subjectStats.updatedAt = nowIso();

    Object.values(result.topics).forEach((topicItem) => {
      const key = `${topicItem.subject}::${topicItem.segment}::${topicItem.topic}`;
      const topicStats = ensureAggregate(stats.byTopic, key, () => ({
        subject: topicItem.subject,
        segment: topicItem.segment,
        topic: topicItem.topic,
        correct: 0,
        wrong: 0,
        unanswered: 0,
        attempted: 0,
        accuracy: 0,
        status: "unstable",
        updatedAt: nowIso(),
      }));

      topicStats.correct += topicItem.correct;
      topicStats.wrong += topicItem.wrong;
      topicStats.unanswered += topicItem.unanswered;
      topicStats.updatedAt = nowIso();
    });

    session.questions.forEach((question, index) => {
      const key = questionKey(question);
      const answer = session.answers[index];

      const questionStats = ensureAggregate(stats.questionHistory, key, () => ({
        key,
        id: question.id,
        subject: question.subject,
        segment: question.segment,
        topic: question.topic,
        subtopic: question.subtopic,
        difficulty: question.difficulty,
        type: question.type,
        format: question.format,
        skill: question.skill,
        examBlueprintTag: question.examBlueprintTag,
        tags: question.tags || [],
        expectedTimeSec: question.expectedTimeSec || 0,
        attempts: 0,
        correct: 0,
        wrong: 0,
        skipped: 0,
        scoreSum: 0,
        lastMode: null,
        lastResult: null,
        lastAnsweredAt: null,
      }));

      questionStats.attempts += 1;
      questionStats.lastMode = session.mode;
      questionStats.lastAnsweredAt = nowIso();

      if (!answer) {
        questionStats.skipped += 1;
        questionStats.lastResult = "skipped";
      } else {
        questionStats.scoreSum += Number(answer.score || 0);
        if (answer.isCorrect) {
          questionStats.correct += 1;
          questionStats.lastResult = "correct";
        } else {
          questionStats.wrong += 1;
          questionStats.lastResult = "wrong";
        }
      }
    });

    if (session.mode === MODES.exam && session.variant) {
      if (!stats.variantStatus[session.subject]) {
        stats.variantStatus[session.subject] = {};
      }

      stats.variantStatus[session.subject][String(session.variant)] = {
        status: result.unanswered === 0 ? "done" : "partial",
        variantId: session.variantId || null,
        total: result.total,
        correct: result.correct,
        wrong: result.wrong,
        unanswered: result.unanswered,
        examScenario: session.examScenario,
        updatedAt: nowIso(),
      };
    }

    stats.routeHistory.push({
      routeKey: state.activeRoute,
      subject: session.subject,
      sessionId: session.id,
      endedAt: nowIso(),
    });
    stats.routeHistory = stats.routeHistory.slice(-MAX_SAVED_SESSIONS);

    const coverageSnapshot = getCoverage(session.subject).summary;
    stats.coverageSnapshots[session.subject] = {
      ...coverageSnapshot,
      updatedAt: nowIso(),
    };
    stats.readinessSnapshots[session.subject] = {
      ...buildSubjectReadiness(session.subject),
      updatedAt: nowIso(),
    };

    const sessionRecord = {
      id: session.id,
      mode: session.mode,
      subject: session.subject,
      variant: session.variant,
      variantId: session.variantId || null,
      examScenario: session.examScenario,
      questionCount: result.total,
      answered: result.answered,
      correct: result.correct,
      wrong: result.wrong,
      unanswered: result.unanswered,
      totalScore: result.totalScore,
      accuracy: result.accuracy,
      durationSec: result.durationSec,
      avgTimePerQuestionSec: result.avgTimePerQuestionSec,
      startedAt: session.startedAt,
      endedAt: nowIso(),
      topics: result.topics,
      difficulties: result.difficulties,
      questionKeys: session.questions.map((question) => questionKey(question)),
      questionTypes: Array.from(new Set(session.questions.map((question) => question.type))),
    };

    stats.sessions.push(sessionRecord);
    if (stats.sessions.length > MAX_SAVED_SESSIONS) {
      stats.sessions = stats.sessions.slice(-MAX_SAVED_SESSIONS);
    }

    updateTopicStatuses(stats);
    saveStats(stats);
  }

  function finishSession(forceByTimer = false) {
    const session = state.currentSession;
    if (!session) {
      return;
    }

    stopTimer();
    clearSupplementTimer();

    const total = session.questions.length;
    const answered = session.answers.filter(Boolean).length;
    const correct = session.answers.filter((answer) => answer && answer.isCorrect).length;
    const wrong = session.answers.filter((answer) => answer && !answer.isCorrect).length;
    const unanswered = total - answered;
    const totalScore = session.answers.filter(Boolean).reduce((acc, answer) => acc + Number(answer.score || 0), 0);

    const totalElapsedMs = session.answers
      .filter(Boolean)
      .reduce((acc, answer) => acc + (answer.elapsedMs || 0), 0);

    const durationSec = Math.round((Date.now() - session.startedAtMs) / 1000);
    const avgTimePerQuestionSec = answered ? Math.round(totalElapsedMs / answered / 1000) : 0;
    const accuracy = total ? correct / total : 0;

    const result = {
      total,
      answered,
      correct,
      wrong,
      unanswered,
      totalScore,
      accuracy,
      durationSec,
      avgTimePerQuestionSec,
      topics: sessionTopicBreakdown(session),
      difficulties: sessionDifficultyBreakdown(session),
      timeExpired: forceByTimer,
    };

    saveSessionToStats(session, result);

    state.lastResult = {
      session,
      result,
    };

    state.currentSession = null;
    clearResumeSnapshot();

    renderResultScreen();
    renderWeakTopicsBlock();
    renderVariantStatuses();
    renderResumeSessionBox();
  }

  function renderDifficultyStats(result) {
    const levels = ["basic", "medium", "hard"];
    ui.difficultyStats.innerHTML = levels
      .map((level) => {
        const row = result.difficulties[level] || { total: 0, correct: 0, score: 0 };
        const percent = row.total ? Math.round((row.correct / row.total) * 100) : 0;
        const avgScore = row.total ? Math.round((row.score / row.total) * 100) : 0;
        return `<div class="stat-row"><span>${escapeHtml(level)}</span><span>${row.correct}/${row.total} (${percent}%) · score ${avgScore}%</span></div>`;
      })
      .join("");
  }

  function renderSegmentStats(result) {
    const rows = Object.values(result.topics)
      .sort((a, b) => a.accuracy - b.accuracy)
      .map((topic) => {
        const total = topic.correct + topic.wrong + topic.unanswered;
        const percent = total ? Math.round((topic.correct / total) * 100) : 0;
        const score = topic.attempted ? Math.round((topic.scoreSum / topic.attempted) * 100) : 0;
        return `<div class="stat-row"><span>${escapeHtml(topic.segment)} · ${escapeHtml(
          topic.topic,
        )}</span><span>${topic.correct}/${total} (${percent}%) · score ${score}%</span></div>`;
      })
      .join("");

    ui.segmentStats.innerHTML = rows || '<p class="setup-note">Нет данных.</p>';
  }

  function renderNextStepSuggestions(last) {
    const { session } = last;
    const coverage = getCoverage(session.subject);
    const expectedTypesBySubject = getExpectedTypesBySubject();

    const actions = PlanningEngine.buildNextActions({
      stats: state.stats,
      subject: session.subject,
      routeKey: state.activeRoute,
      coverage,
      expectedTypesBySubject,
    });

    ui.nextStepBox.innerHTML = `<div class="next-step-list">${actions
      .map(
        (action) =>
          `<div class="next-step-item"><strong>${escapeHtml(action.title)}</strong><br>${escapeHtml(
            action.reason,
          )}<br><span class="setup-note">Режим: ${escapeHtml(modeLabel(action.mode))} · вопросов: ${
            action.questions
          }</span></div>`,
      )
      .join("")}</div>`;
  }

  function renderReviewList(last) {
    const { session, result } = last;

    const rows = session.questions
      .map((question, index) => {
        const answer = session.answers[index];
        if (!answer) {
          return null;
        }
        const correctText = AssessmentEngine.formatCorrectAnswer(question);

        if (answer && answer.isCorrect && session.mode !== MODES.exam) {
          return null;
        }

        const exp = question.explanation || {};

        const detailParts = [
          { label: "Идея", value: exp.why },
          { label: "Правило", value: exp.rule || question.rule },
          { label: "Шаги", value: exp.stepByStep || question.steps },
          { label: "Типичная ошибка", value: exp.commonMistakes || question.commonMistake },
          { label: "Как распознать", value: exp.recognitionTip || question.recognitionTip },
        ].filter((item) => item.value);

        if (question.type === "extended-answer-lite" && question.rubric && question.rubric.strongSample) {
          detailParts.push({ label: "Образец сильного ответа", value: question.rubric.strongSample });
        }

        return `
          <article class="review-item">
            <h4>Вопрос ${index + 1}: ${escapeHtml(question.segment)} · ${escapeHtml(question.topic)}</h4>
            <p><strong>Тип:</strong> ${escapeHtml(
              AssessmentEngine.TYPE_LABELS[AssessmentEngine.normalizeType(question.type)] || question.type,
            )}</p>
            <p><strong>Задание:</strong> ${escapeHtml(question.prompt)}</p>
            <p><strong>Твой ответ:</strong> ${escapeHtml(formatUserAnswer(question, (answer && answer.raw) || null))}</p>
            <p><strong>Правильный ответ:</strong> ${escapeHtml(correctText)}</p>
            ${detailParts
              .map((part) => `<p><strong>${escapeHtml(part.label)}:</strong> ${escapeHtml(part.value)}</p>`)
              .join("")}
          </article>
        `;
      })
      .filter(Boolean)
      .join("");

    const hiddenUnanswered = result && result.unanswered ? Number(result.unanswered) : 0;
    const unansweredNote = hiddenUnanswered
      ? `<p class="setup-note">Нерешённых вопросов: ${hiddenUnanswered}. Их правильные ответы не раскрываются в разборе.</p>`
      : "";

    ui.reviewList.innerHTML =
      unansweredNote + (rows || '<p class="setup-note">Ошибок нет. Разбор не требуется.</p>');
  }

  function renderResultScreen() {
    const last = state.lastResult;
    if (!last) {
      return;
    }

    const { session, result } = last;
    const subject = getSubjectInfo(session.subject);

    ui.resultMeta.textContent = `${subject.title} · режим: ${modeLabel(session.mode)} · сценарий: ${scenarioLabel(
      session.examScenario,
    )} · длительность ${formatTime(result.durationSec)} · среднее время ${result.avgTimePerQuestionSec} сек.`;

    ui.scoreValue.textContent = `${result.correct} / ${result.total} (score ${result.totalScore.toFixed(2)})`;
    ui.percentValue.textContent = `${Math.round(result.accuracy * 100)}%`;
    const readiness = buildSubjectReadiness(session.subject);
    ui.readinessValue.textContent = readinessLabel(readiness);

    renderDifficultyStats(result);
    renderSegmentStats(result);
    renderNextStepSuggestions(last);
    renderReviewList(last);

    ui.sessionView.classList.add("hidden");
    ui.resultView.classList.remove("hidden");
    ui.trainerView.classList.add("hidden");
    ui.progressView.classList.add("hidden");
    ui.coverageView.classList.add("hidden");
    ui.nextStepsView.classList.add("hidden");
    ui.reportView.classList.add("hidden");
  }

  function startSession(customQuestions = null) {
    const setup = currentConfigFromUi();

    if (state.onboardingVisible) {
      markOnboardingSeen();
    }

    if (
      !customQuestions &&
      setup.mode === MODES.exam &&
      setup.examScenario === EXAM_SCENARIOS.subjectModelExact &&
      !confirm(
        "Точный экзаменационный макет: подсказки скрыты до конца, развёрнутые ответы оцениваются как учебная самопроверка. Продолжить?",
      )
    ) {
      return;
    }

    let payload;
    if (customQuestions) {
      payload = {
        questions: customQuestions,
        diagnostics: null,
      };
    } else {
      payload = buildSessionQuestions(setup);
    }

    payload.questions = sanitizeSessionQuestions(payload.questions, {
      subject: setup.subject,
      mode: setup.mode,
      targetCount: customQuestions ? customQuestions.length : setup.count,
    });

    if (!payload.questions.length) {
      const message = "Недостаточно подходящих вопросов для выбранного режима. Измените параметры.";
      if (ui.modeHint) {
        ui.modeHint.textContent = message;
      }
      if (!window.__bootLog) {
        window.__bootLog = [];
      }
      window.__bootLog.push(`Session start rejected: ${message}`);
      try {
        alert(message);
      } catch (error) {
        reportFatalError(new Error(`ALERT_BLOCKED: ${message}`));
      }
      return;
    }

    if (payload.diagnostics && payload.diagnostics.kind === "fallback" && ui.modeHint) {
      ui.modeHint.textContent =
        "Открыт резервный вариант (часть банка недоступна). Тренировка продолжается, можно запускать сессию.";
    }

    const subject = getSubjectInfo(setup.subject);
    const variantId =
      ((payload.diagnostics && payload.diagnostics.variantId) || null) ||
      (setup.mode === MODES.exam && setup.variant
        ? ExamData.createVariantId(
            setup.subject,
            setup.variant,
            setup.examScenario || EXAM_SCENARIOS.mixedTrainer,
            payload.questions.length,
          )
        : null);
    const session = {
      id: `sess-${Date.now()}`,
      mode: setup.mode,
      subject: setup.subject,
      variant: setup.variant || null,
      variantId,
      examScenario: setup.examScenario || null,
      questionCount: payload.questions.length,
      timeLimitMinutes: setup.timeLimitMinutes,
      diagnostics: payload.diagnostics,
      questions: payload.questions,
      answers: new Array(payload.questions.length).fill(null),
      currentIndex: 0,
      startedAt: nowIso(),
      startedAtMs: Date.now(),
      questionStartedAt: performance.now(),
      remainingSeconds: setup.mode === MODES.exam ? setup.timeLimitMinutes * 60 : 0,
      inputController: null,
      awaitingCheck: true,
    };

    state.currentSession = session;

    ui.metaSubject.textContent = `${subject.title} · ${subject.description}`;
    setSessionMetaTitle(buildSessionTitleText(session));

    ui.resultView.classList.add("hidden");
    ui.progressView.classList.add("hidden");
    ui.coverageView.classList.add("hidden");
    ui.nextStepsView.classList.add("hidden");
    ui.reportView.classList.add("hidden");
    ui.trainerView.classList.add("hidden");
    ui.sessionView.classList.remove("hidden");

    saveResumeSnapshot(session);
    renderSessionQuestion();
    startTimer();
  }

  function resumeSavedSession() {
    if (state.onboardingVisible) {
      markOnboardingSeen();
    }

    const snapshot = state.resumeSession || loadResumeSnapshot();
    if (!snapshot || !snapshot.session) {
      alert("Сохраненная сессия не найдена.");
      renderResumeSessionBox();
      return;
    }

    const saved = snapshot.session;
    const questions = (saved.questions || []).map(normalizeQuestion);
    if (!questions.length) {
      clearResumeSnapshot();
      renderResumeSessionBox();
      alert("Сохраненная сессия повреждена и была удалена.");
      return;
    }

    const answers = Array.isArray(saved.answers) ? saved.answers.slice(0, questions.length) : [];
    while (answers.length < questions.length) {
      answers.push(null);
    }

    const savedAt = Number(snapshot.savedAt || Date.now());
    const elapsedSec = Math.max(0, Math.floor((Date.now() - savedAt) / 1000));
    const remainingSeconds =
      saved.mode === MODES.exam
        ? Math.max(0, Number(saved.remainingSeconds || 0) - elapsedSec)
        : 0;

    let currentIndex = Math.max(0, Math.min(Number(saved.currentIndex || 0), questions.length - 1));
    if (answers[currentIndex]) {
      const firstUnanswered = answers.findIndex((answer) => !answer);
      if (firstUnanswered >= 0) {
        currentIndex = firstUnanswered;
      }
    }

    state.currentSession = {
      id: saved.id || `sess-${Date.now()}`,
      mode: saved.mode || MODES.topic,
      subject: saved.subject || state.subjectKey,
      variant: saved.variant || null,
      variantId: saved.variantId || null,
      examScenario: saved.examScenario || null,
      questionCount: questions.length,
      timeLimitMinutes: saved.timeLimitMinutes || null,
      diagnostics: saved.diagnostics || null,
      questions,
      answers,
      currentIndex,
      startedAt: saved.startedAt || nowIso(),
      startedAtMs: Number(saved.startedAtMs || new Date(saved.startedAt || Date.now()).getTime() || Date.now()),
      questionStartedAt: performance.now(),
      remainingSeconds,
      inputController: null,
      awaitingCheck: true,
    };

    state.subjectKey = state.currentSession.subject;
    renderSubjectSelect();
    renderSubjectCards();

    const subject = getSubjectInfo(state.currentSession.subject);
    ui.metaSubject.textContent = `${(subject && subject.title) || state.currentSession.subject} · ${
      (subject && subject.description) || ""
    }`;
    setSessionMetaTitle(buildSessionTitleText(state.currentSession));

    ui.resultView.classList.add("hidden");
    ui.progressView.classList.add("hidden");
    ui.coverageView.classList.add("hidden");
    ui.nextStepsView.classList.add("hidden");
    ui.reportView.classList.add("hidden");
    ui.trainerView.classList.add("hidden");
    ui.sessionView.classList.remove("hidden");

    saveResumeSnapshot(state.currentSession);
    renderSessionQuestion();
    startTimer();
  }

  function goToTrainer() {
    stopTimer();
    clearSupplementTimer();
    state.currentSession = null;

    ui.sessionView.classList.add("hidden");
    ui.resultView.classList.add("hidden");
    setView(VIEWS.trainer);
    renderSubjectCards();
    renderWeakTopicsBlock();
    renderVariantStatuses();
    renderCoveragePreview();
    renderResumeSessionBox();
  }

  function renderProgressScreen() {
    const sessions = state.stats.sessions || [];
    const totalSessions = sessions.length;
    const totalQuestions = sessions.reduce((acc, item) => acc + (item.questionCount || 0), 0);
    const totalCorrect = sessions.reduce((acc, item) => acc + (item.correct || 0), 0);
    const accuracy = totalQuestions ? totalCorrect / totalQuestions : 0;

    ui.progressSessions.textContent = String(totalSessions);
    ui.progressQuestions.textContent = String(totalQuestions);
    ui.progressAccuracy.textContent = `${Math.round(accuracy * 100)}%`;

    ui.progressBySubject.innerHTML = ExamData.SUBJECTS.map((subject) => {
      const stat = state.stats.bySubject[subject.key];
      const percent = stat ? Math.round((stat.accuracy || 0) * 100) : 0;
      const attempted = stat ? stat.attempted : 0;
      const avgTime = stat ? Math.round(stat.avgTimePerQuestionSec || 0) : 0;
      const readiness = buildSubjectReadiness(subject.key);

      return `
        <div class="progress-row">
          <div class="progress-row-head"><span>${escapeHtml(subject.title)}</span><span>${percent}% · ${attempted} вопросов · ${avgTime} сек/вопрос · готовность ${readiness.readinessScore}%</span></div>
          <div class="progress-meter"><div class="progress-meter-bar" style="width:${percent}%"></div></div>
        </div>
      `;
    }).join("");

    const weak = (state.stats.weakTopics || []).slice(0, 12);
    ui.progressWeakTopics.innerHTML = weak.length
      ? weak
          .map((item) => {
            const badge = getTopicStatusLabel(item.status);
            return `<div class="weak-item"><strong>${escapeHtml(item.segment)} · ${escapeHtml(
              item.topic,
            )}</strong><br><span class="badge ${badge.badge}">${badge.label}</span> · ${Math.round(
              (item.accuracy || 0) * 100,
            )}% · ${item.attempted} вопросов</div>`;
          })
          .join("")
      : '<p class="setup-note">Слабые темы пока не выявлены.</p>';

    const variantSessions = sessions
      .filter((session) => session.mode === MODES.exam && session.subject === state.subjectKey && session.variant)
      .sort((a, b) => a.variant - b.variant || (a.endedAt > b.endedAt ? -1 : 1));
    const latestByVariant = {};
    variantSessions.forEach((session) => {
      if (!latestByVariant[session.variant]) {
        latestByVariant[session.variant] = session;
      }
    });

    const variantCards = Array.from({ length: ExamData.VARIANT_COUNT }, (_, index) => {
      const variant = index + 1;
      const item = latestByVariant[variant];
      if (!item) {
        return `<div class="variant-compare-item"><strong>Вариант ${variant}</strong><p>нет попытки</p></div>`;
      }
      const score = Math.round((item.accuracy || 0) * 100);
      return `<div class="variant-compare-item"><strong>Вариант ${variant}</strong><p>${item.correct}/${
        item.questionCount
      } · ${score}%</p></div>`;
    }).join("");
    ui.variantCompareBox.innerHTML = `<div class="variant-compare-grid">${variantCards}</div>`;

    const recent = sessions.slice(-12).reverse();
    ui.recentSessions.innerHTML = recent.length
      ? `<table class="status-table">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Режим</th>
              <th>Предмет</th>
              <th>Результат</th>
              <th>Время</th>
              <th>Типы</th>
            </tr>
          </thead>
          <tbody>
            ${recent
              .map((session) => {
                const subject = getSubjectInfo(session.subject);
                return `<tr>
                  <td>${escapeHtml(new Date(session.endedAt).toLocaleString())}</td>
                  <td>${escapeHtml(modeLabel(session.mode))}</td>
                  <td>${escapeHtml(subject ? subject.title : session.subject)}</td>
                  <td>${session.correct}/${session.questionCount} (${Math.round((session.accuracy || 0) * 100)}%)</td>
                  <td>${formatTime(session.durationSec || 0)}</td>
                  <td>${escapeHtml((session.questionTypes || []).join(", ") || "-")}</td>
                </tr>`;
              })
              .join("")}
          </tbody>
        </table>`
      : '<p class="setup-note">Сессий пока нет.</p>';
  }

  function coverageStatusChip(status) {
    if (status === "сильное") {
      return "coverage-strong";
    }
    if (status === "достаточное") {
      return "coverage-sufficient";
    }
    if (status === "слабое") {
      return "coverage-weak";
    }
    return "coverage-none";
  }

  function renderCoverageScreen() {
    const coverage = getCoverage(state.subjectKey);
    const summary = coverage.summary;

    ui.coverageSummaryBox.innerHTML = `
      <div class="result-grid">
        <article class="result-card"><p>Тем всего</p><h3>${summary.totalTopics}</h3></article>
        <article class="result-card"><p>Нет покрытия</p><h3>${summary.noCoverage}</h3></article>
        <article class="result-card"><p>Слабое покрытие</p><h3>${summary.weakCoverage}</h3></article>
      </div>
      <p class="setup-note">Форматы: ${escapeHtml((summary.knownFormats || []).join(", ") || "-")} · дисбаланс тем: ${summary.imbalanceTopics}</p>
    `;

    const rows = coverage.items
      .map((item) => {
        return `<tr>
          <td>${escapeHtml(item.section)}</td>
          <td>${escapeHtml(item.topic)}</td>
          <td>${escapeHtml(item.subtopic)}</td>
          <td>${item.totalQuestions}</td>
          <td class="mono">баз:${item.byDifficulty.basic || 0} · ср:${item.byDifficulty.medium || 0} · слож:${item.byDifficulty.hard || 0}</td>
          <td>${escapeHtml((item.types || []).join(", "))}</td>
          <td>${escapeHtml((item.formats || []).join(", "))}</td>
          <td><span class="coverage-status ${coverageStatusChip(item.status)}">${escapeHtml(item.status)}</span></td>
        </tr>`;
      })
      .join("");

    ui.coverageTableBox.innerHTML = `
      <table class="status-table">
        <thead>
          <tr>
            <th>Раздел</th>
            <th>Тема</th>
            <th>Подтема</th>
            <th>Вопросов</th>
            <th>Сложности</th>
            <th>Типы</th>
            <th>Форматы</th>
            <th>Статус</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  function renderNextStepsScreen() {
    const coverage = getCoverage(state.subjectKey);
    const expectedTypesBySubject = getExpectedTypesBySubject();
    const actions = PlanningEngine.buildNextActions({
      stats: state.stats,
      subject: state.subjectKey,
      routeKey: state.activeRoute,
      coverage,
      expectedTypesBySubject,
    });

    ui.nextActionsBox.innerHTML = actions.length
      ? `<div class="next-step-list">${actions
          .map(
            (item) => `<div class="next-step-item"><strong>${escapeHtml(item.title)}</strong><br>${escapeHtml(
              item.reason,
            )}<br><span class="setup-note">Режим: ${escapeHtml(modeLabel(item.mode))} · вопросов: ${
              item.questions
            }</span></div>`,
          )
          .join("")}</div>`
      : '<p class="setup-note">Пока нет рекомендаций. Решите несколько сессий.</p>';

    state.stats.recommendationHistory.push({
      generatedAt: nowIso(),
      routeKey: state.activeRoute,
      subject: state.subjectKey,
      actions,
    });
    state.stats.recommendationHistory = state.stats.recommendationHistory.slice(-120);
    saveStats();
  }

  function renderReportScreen() {
    const coverageBySubject = {};
    const expectedTypesBySubject = getExpectedTypesBySubject();
    ExamData.SUBJECTS.forEach((subject) => {
      coverageBySubject[subject.key] = getCoverage(subject.key);
    });

    const report = PlanningEngine.buildParentReport({
      stats: state.stats,
      coverageBySubject,
      subjects: ExamData.SUBJECTS,
      expectedTypesBySubject,
    });

    const avgReadiness = report.bySubject.length
      ? Math.round(
          report.bySubject.reduce(
            (acc, item) => acc + (((item.readiness && item.readiness.readinessScore) || 0)),
            0,
          ) /
            report.bySubject.length,
        )
      : 0;

    ui.reportSummaryBox.innerHTML = `
      <div class="result-grid">
        <article class="result-card"><p>Средняя готовность</p><h3>${avgReadiness}%</h3></article>
        <article class="result-card"><p>Всего сессий</p><h3>${state.stats.sessions.length}</h3></article>
        <article class="result-card"><p>Слабые темы</p><h3>${state.stats.weakTopics.length}</h3></article>
      </div>
    `;

    const rows = report.bySubject
      .map((item) => {
        const trend = item.dynamics > 0.01 ? "рост" : item.dynamics < -0.01 ? "снижение" : "стабильно";
        return `<tr>
          <td>${escapeHtml(item.title)}</td>
          <td>${item.sessions}</td>
          <td>${Math.round((item.accuracy || 0) * 100)}%</td>
          <td>${item.weakTopics}</td>
          <td>${item.staleTopics}</td>
          <td>${trend}</td>
          <td>${readinessLabel(item.readiness)}</td>
          <td>нет:${item.coverageSummary.noCoverage} · слабое:${item.coverageSummary.weakCoverage}</td>
        </tr>`;
      })
      .join("");

    ui.reportTableBox.innerHTML = `
      <table class="status-table">
        <thead>
          <tr>
            <th>Предмет</th>
            <th>Сессий</th>
            <th>Точность</th>
            <th>Слабые темы</th>
            <th>Давно не повторялись</th>
            <th>Динамика</th>
            <th>Готовность</th>
            <th>Покрытие</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p class="setup-note">Обновлено: ${escapeHtml(new Date(report.generatedAt).toLocaleString())}. Оценка готовности тренажёра не является официальным прогнозом ОГЭ.</p>
    `;
  }

  function renderBankDiagnostics() {
    const diagnostics = ExamData.validateQuestionBank();
    state.bankDiagnostics = diagnostics;
    state.stats.bankDiagnostics = diagnostics;
    saveStats();

    const subjectRows = Object.entries(diagnostics.bySubject)
      .map(([subject, payload]) => {
        const alignment = payload.alignment || {};
        const alignmentStatus =
          alignment.status === "aligned" ? "ok" : "needs-attention";
        const alignmentLabel = alignment.status === "aligned" ? "в норме" : "требует внимания";
        return `<tr>
          <td>${escapeHtml(subject)}</td>
          <td>${payload.questionCount}</td>
          <td>${payload.officialQuestionCount || 0}</td>
          <td>${payload.topicCount}</td>
          <td class="mono">баз:${payload.byDifficulty.basic || 0} · ср:${payload.byDifficulty.medium || 0} · слож:${payload.byDifficulty.hard || 0}</td>
          <td>${escapeHtml(Object.keys(payload.byFormat || payload.byType).join(", "))}</td>
          <td>нет:${payload.coverage.noCoverage} · слабое:${payload.coverage.weakCoverage}</td>
          <td><span class="coverage-status ${alignmentStatus}">${escapeHtml(alignmentLabel)}</span></td>
        </tr>`;
      })
      .join("");

    const errors = diagnostics.errors.slice(0, 10);
    const warnings = diagnostics.warnings.slice(0, 10);
    const coverageGaps = (diagnostics.coverageGaps || []).slice(0, 8);
    const weakCoverage = (diagnostics.weakCoverage || []).slice(0, 8);
    const lowDiversity = (diagnostics.lowDifficultyDiversity || []).slice(0, 6);
    const duplicateCandidates = (diagnostics.duplicateCandidates || []).slice(0, 8);
    const missingExplanation = (diagnostics.missingExplanationFields || []).slice(0, 8);
    const nearDuplicates = (diagnostics.nearDuplicateCandidates || []).slice(0, 8);
    const explanationQuality = diagnostics.explanationQuality || {};
    const officialPack = diagnostics.officialPack || {};

    if (ui.closeBankDiagnosticsBtn) {
      ui.closeBankDiagnosticsBtn.classList.remove("hidden");
    }

    ui.bankDiagnosticsBox.innerHTML = `
      <p class="setup-note">Валидность: <strong>${diagnostics.ok ? "OK" : "Есть ошибки"}</strong> · ошибок: ${diagnostics.errors.length} · предупреждений: ${diagnostics.warnings.length}</p>
      <p class="setup-note">Официальный пакет: ${
        officialPack.totalQuestions || 0
      } вопросов · годы: ${escapeHtml((officialPack.years || []).join(", ") || "не подключены")}</p>
      <p class="setup-note">Качество объяснений: сильных ${explanationQuality.strong || 0} · средних ${
        explanationQuality.medium || 0
      } · слабых ${explanationQuality.weak || 0} · средний балл ${explanationQuality.averageScore || 0}%</p>
      <table class="status-table">
        <thead><tr><th>Предмет</th><th>Вопросов</th><th>Официальных</th><th>Тем</th><th>Сложности</th><th>Форматы</th><th>Пустоты покрытия</th><th>Соответствие ФИПИ</th></tr></thead>
        <tbody>${subjectRows}</tbody>
      </table>
      <div class="analytics-grid" style="margin-top:10px">
        <article class="analytics-card">
          <h3>Ошибки структуры</h3>
          ${errors.length ? errors.map((item) => `<p>${escapeHtml(item)}</p>`).join("") : '<p class="setup-note">Ошибок нет.</p>'}
        </article>
        <article class="analytics-card">
          <h3>Предупреждения</h3>
          ${warnings.length ? warnings.map((item) => `<p>${escapeHtml(item)}</p>`).join("") : '<p class="setup-note">Предупреждений нет.</p>'}
        </article>
      </div>
      <div class="analytics-grid" style="margin-top:10px">
        <article class="analytics-card">
          <h3>Пробелы покрытия</h3>
          ${coverageGaps.length
            ? coverageGaps
                .map(
                  (item) =>
                    `<p>${escapeHtml(item.subject)} · ${escapeHtml(item.section)} · ${escapeHtml(item.topic)} (${escapeHtml(
                      item.reason,
                    )})</p>`,
                )
                .join("")
            : '<p class="setup-note">Пустот покрытия не найдено.</p>'}
        </article>
        <article class="analytics-card">
          <h3>Слабое покрытие</h3>
          ${weakCoverage.length
            ? weakCoverage
                .map(
                  (item) =>
                    `<p>${escapeHtml(item.subject)} · ${escapeHtml(item.section)} · ${escapeHtml(item.topic)}</p>`,
                )
                .join("")
            : '<p class="setup-note">Слабых зон покрытия нет.</p>'}
        </article>
      </div>
      <div class="analytics-grid" style="margin-top:10px">
        <article class="analytics-card">
          <h3>Нехватка полей объяснения</h3>
          ${missingExplanation.length
            ? missingExplanation
                .map(
                  (item) =>
                    `<p>${escapeHtml(item.subject)} · ${escapeHtml(item.id)} · отсутствует: ${escapeHtml(
                      item.missing.join(", "),
                    )}</p>`,
                )
                .join("")
            : '<p class="setup-note">Критичных пропусков в объяснениях нет.</p>'}
        </article>
        <article class="analytics-card">
          <h3>Похожие дубликаты</h3>
          ${nearDuplicates.length
            ? nearDuplicates
                .map(
                  (item) =>
                    `<p>${escapeHtml(item.subject)} · ${escapeHtml(item.idA)} ~ ${escapeHtml(item.idB)} (${Math.round(
                      item.similarity * 100,
                    )}%)</p>`,
                )
                .join("")
            : '<p class="setup-note">Подозрительно похожих вопросов не найдено.</p>'}
        </article>
      </div>
      <div class="analytics-grid" style="margin-top:10px">
        <article class="analytics-card">
          <h3>Низкое разнообразие сложностей</h3>
          ${lowDiversity.length
            ? lowDiversity
                .map(
                  (item) =>
                    `<p>${escapeHtml(item.subject)} · баз:${item.byDifficulty.basic} · ср:${item.byDifficulty.medium} · слож:${item.byDifficulty.hard}</p>`,
                )
                .join("")
            : '<p class="setup-note">Диверсификация сложностей достаточная.</p>'}
        </article>
        <article class="analytics-card">
          <h3>Кандидаты в точные дубликаты</h3>
          ${duplicateCandidates.length
            ? duplicateCandidates
                .map((item) => `<p>${escapeHtml(item.subject)} · ${item.ids.length} дублей сигнатуры</p>`)
                .join("")
            : '<p class="setup-note">Точных дубликатов не найдено.</p>'}
        </article>
      </div>
    `;
  }

  function downloadTextFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(href);
  }

  function buildBackupPayload() {
    return {
      type: "oge-trainer-backup",
      version: EXPORT_FORMAT_VERSION,
      exportedAt: nowIso(),
      appVersion: state.stats.version || 4,
      stats: state.stats,
      resumeSession: state.resumeSession || loadResumeSnapshot(),
      officialPack: loadOfficialPackPayload(),
      officialPackSummary:
        ExamData && typeof ExamData.getOfficialPackSummary === "function"
          ? ExamData.getOfficialPackSummary()
          : null,
    };
  }

  function exportProgressJson() {
    const payload = buildBackupPayload();
    const stamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
    downloadTextFile(
      `oge-progress-backup-${stamp}.json`,
      JSON.stringify(payload, null, 2),
      "application/json;charset=utf-8",
    );
  }

  function importProgressJsonFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      let payload = safeJsonParse(reader.result);
      if (payload && payload.type === "oge-official-bank-pack") {
        const result = applyOfficialPack(payload, { replace: true });
        if (!result.ok) {
          alert(
            `Официальный пакет не применен: ${(result.errors || ["неизвестная ошибка"]).join(" | ")}`,
          );
          return;
        }
        const summary = result.summary || {};
        renderSubjectCards();
        renderWeakTopicsBlock();
        renderVariantStatuses();
        renderCoveragePreview();
        renderCoverageScreen();
        renderProgressScreen();
        alert(
          `Официальный пакет подключен. Вопросов: ${summary.totalQuestions || 0}. Годы: ${
            (summary.years || []).join(", ") || "не указаны"
          }.`,
        );
        return;
      }

      if (
        payload &&
        payload.type !== "oge-trainer-backup" &&
        (payload.bySubject || payload.sessions || payload.questionHistory)
      ) {
        payload = {
          type: "oge-trainer-backup",
          version: 0,
          stats: payload,
        };
      }

      if (!payload || payload.type !== "oge-trainer-backup") {
        alert("Файл не распознан как backup тренажера.");
        return;
      }

      if (Number(payload.version || 0) > EXPORT_FORMAT_VERSION) {
        alert("Формат backup новее текущей версии приложения. Импорт остановлен.");
        return;
      }

      const importedStats = payload.stats && typeof payload.stats === "object" ? payload.stats : null;
      if (!importedStats) {
        alert("В файле отсутствует блок статистики.");
        return;
      }

      state.stats = {
        ...createEmptyStats(),
        ...importedStats,
        version: 4,
      };
      saveStats(state.stats);

      if (payload.resumeSession && payload.resumeSession.session) {
        state.resumeSession = payload.resumeSession;
        storageSet(STORAGE_KEYS.resume, JSON.stringify(payload.resumeSession));
      } else {
        clearResumeSnapshot();
      }

      if (payload.officialPack && payload.officialPack.type === "oge-official-bank-pack") {
        const packResult = applyOfficialPack(payload.officialPack, { replace: true });
        if (!packResult.ok && packResult.errors && packResult.errors.length) {
          alert(`Backup импортирован, но официальный пакет не подключен: ${packResult.errors.join(" | ")}`);
        }
      }

      state.poolCache = {};
      state.coverageCache = {};
      renderSubjectCards();
      renderWeakTopicsBlock();
      renderVariantStatuses();
      renderCoveragePreview();
      renderProgressScreen();
      renderCoverageScreen();
      renderNextStepsScreen();
      renderReportScreen();
      renderResumeSessionBox();
      alert("Импорт завершен.");
    };

    reader.onerror = () => {
      alert("Не удалось прочитать файл импорта.");
    };

    reader.readAsText(file);
  }

  function exportHtmlReport() {
    const coverageBySubject = {};
    const expectedTypesBySubject = getExpectedTypesBySubject();
    ExamData.SUBJECTS.forEach((subject) => {
      coverageBySubject[subject.key] = getCoverage(subject.key);
    });
    const report = PlanningEngine.buildParentReport({
      stats: state.stats,
      coverageBySubject,
      subjects: ExamData.SUBJECTS,
      expectedTypesBySubject,
    });

    const rows = report.bySubject
      .map((item) => {
        const accuracy = Math.round((item.accuracy || 0) * 100);
        return `<tr>
          <td>${escapeHtml(item.title)}</td>
          <td>${item.sessions}</td>
          <td>${accuracy}%</td>
          <td>${(item.readiness && item.readiness.readinessScore) || 0}%</td>
          <td>${item.weakTopics}</td>
          <td>${item.coverageSummary.noCoverage}</td>
          <td>${item.coverageSummary.weakCoverage}</td>
        </tr>`;
      })
      .join("");

    const html = `<!doctype html>
<html lang=\"ru\">
<head>
  <meta charset=\"UTF-8\" />
  <title>Отчет ОГЭ-тренажера</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; color: #1f2933; }
    h1 { margin-bottom: 6px; }
    p { margin-top: 0; color: #4a5b66; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { border: 1px solid #d7dfe3; padding: 8px; text-align: left; }
    th { background: #eef3f5; }
    .note { margin-top: 14px; font-size: 12px; color: #5d6a72; }
  </style>
</head>
<body>
  <h1>Отчет по подготовке к ОГЭ</h1>
  <p>Сформирован: ${escapeHtml(new Date(report.generatedAt).toLocaleString())}</p>
  <table>
    <thead>
      <tr>
        <th>Предмет</th><th>Сессий</th><th>Точность</th><th>Готовность</th><th>Слабые темы</th><th>Нет покрытия</th><th>Слабое покрытие</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <p class=\"note\">Оценка готовности тренажёра не является официальным прогнозом ОГЭ.</p>
</body>
</html>`;

    const stamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
    downloadTextFile(`oge-report-${stamp}.html`, html, "text/html;charset=utf-8");
  }

  function resetSubjectStatsCore(subject) {
    Object.keys(state.stats.byTopic).forEach((key) => {
      if (key.startsWith(`${subject}::`)) {
        delete state.stats.byTopic[key];
      }
    });

    Object.keys(state.stats.questionHistory).forEach((key) => {
      const record = state.stats.questionHistory[key];
      if (record.subject === subject) {
        delete state.stats.questionHistory[key];
      }
    });

    delete state.stats.bySubject[subject];
    delete state.stats.variantStatus[subject];
    delete state.stats.readinessSnapshots[subject];
    delete state.stats.coverageSnapshots[subject];

    state.stats.sessions = state.stats.sessions.filter((session) => session.subject !== subject);

    if (state.resumeSession && state.resumeSession.session && state.resumeSession.session.subject === subject) {
      clearResumeSnapshot();
    }

    updateTopicStatuses(state.stats);
    saveStats();

    renderSubjectCards();
    renderWeakTopicsBlock();
    renderVariantStatuses();
    renderProgressScreen();
    refreshCoverage(subject);
    renderCoverageScreen();
    renderNextStepsScreen();
    renderReportScreen();
    renderResumeSessionBox();
  }

  function resetSubjectStats() {
    if (!confirm("Сбросить статистику только по текущему предмету?")) {
      return;
    }
    resetSubjectStatsCore(state.subjectKey);
  }

  function resetAllStats() {
    if (!confirm("Полностью сбросить всю статистику?")) {
      return;
    }

    state.stats = createEmptyStats();
    saveStats();
    clearResumeSnapshot();

    renderSubjectCards();
    renderWeakTopicsBlock();
    renderVariantStatuses();
    renderProgressScreen();
    state.coverageCache = {};
    renderCoverageScreen();
    renderNextStepsScreen();
    renderReportScreen();
    renderResumeSessionBox();
    closeBankDiagnosticsPanel(false);
  }

  function startMistakesFromResult() {
    setMode(MODES.mistakes);
    ui.questionCountInput.value = Math.min(
      20,
      ExamData.clampQuestionCount(state.subjectKey, Number(ui.questionCountInput.value) || 15),
    );
    startSession();
  }

  function startExamFromResult() {
    setMode(MODES.exam);
    ui.questionCountInput.value = getSubjectConfig().defaultQuestions;
    ui.timeLimitInput.value = getSubjectConfig().defaultMinutes;
    ui.examModelSelect.value = EXAM_SCENARIOS.subjectModelTraining;
    startSession();
  }

  function repeatSimilarFromResult() {
    const last = state.lastResult;
    if (!last) {
      return;
    }

    const wrongQuestions = last.session.questions.filter((question, index) => {
      const answer = last.session.answers[index];
      return !answer || !answer.isCorrect;
    });

    const pool = getSubjectPool(last.session.subject);
    const signatures = new Set(wrongQuestions.map((question) => topicKey(question)));

    const similar = pool.filter((question) => signatures.has(topicKey(question)));

    const count = Math.min(15, Math.max(8, wrongQuestions.length * 2));
    const selected = pickQuestionsByScore(similar.length ? similar : pool, count, {
      mode: MODES.mistakes,
      recentSet: recentQuestionSet(last.session.subject),
      weakSet: getWeakTopicSet(last.session.subject),
    });

    state.subjectKey = last.session.subject;
    renderSubjectSelect();
    renderSubjectCards();
    setMode(MODES.topic);

    startSession(selected);
  }

  function startQuickExactExam() {
    setMode(MODES.exam);
    ui.examModelSelect.value = EXAM_SCENARIOS.subjectModelExact;
    syncExamScenarioControls();
    renderVariantSelect();
    renderCoveragePreview();
    startSession();
  }

  function startWeakTopicTraining() {
    const weak = (state.stats.weakTopics || [])
      .filter((item) => item.subject === state.subjectKey)
      .sort((a, b) => (a.accuracy || 0) - (b.accuracy || 0));

    setMode(MODES.topic);
    if (weak.length) {
      ui.segmentSelect.value = weak[0].segment;
      ui.difficultySelect.value = "medium";
      ui.questionCountInput.value = Math.min(
        12,
        ExamData.clampQuestionCount(state.subjectKey, 12),
      );
    }
    startSession();
  }

  function continuePreparation() {
    if (state.resumeSession && state.resumeSession.session) {
      resumeSavedSession();
      return;
    }

    const coverage = getCoverage(state.subjectKey);
    const next = PlanningEngine.buildNextActions({
      stats: state.stats,
      subject: state.subjectKey,
      routeKey: state.activeRoute,
      coverage,
      expectedTypesBySubject: getExpectedTypesBySubject(),
    })[0];

    if (!next) {
      setMode(MODES.topic);
      startSession();
      return;
    }

    if (next.mode === "exam-exact") {
      startQuickExactExam();
      return;
    }

    if (next.mode === "exam-training") {
      setMode(MODES.exam);
      ui.examModelSelect.value = EXAM_SCENARIOS.subjectModelTraining;
      syncExamScenarioControls();
      renderVariantSelect();
      renderCoveragePreview();
      startSession();
      return;
    }

    if (next.mode === "mistakes") {
      setMode(MODES.mistakes);
      ui.questionCountInput.value = ExamData.clampQuestionCount(
        state.subjectKey,
        Number(next.questions) || 10,
      );
      startSession();
      return;
    }

    setMode(MODES.topic);
    ui.questionCountInput.value = ExamData.clampQuestionCount(
      state.subjectKey,
      Number(next.questions) || getSubjectConfig().defaultQuestions,
    );
    startSession();
  }

  function onNextButtonClick() {
    const session = state.currentSession;
    if (!session) {
      return;
    }

    if (session.awaitingCheck) {
      submitCurrentAnswer();
      return;
    }

    if (session.currentIndex >= session.questions.length - 1) {
      finishSession(false);
      return;
    }

    session.currentIndex += 1;
    saveResumeSnapshot(session);
    renderSessionQuestion();
    if (session.mode === MODES.exam) {
      updateTimerView();
    }
  }

  function openSelectedVariant() {
    setMode(MODES.exam);
    startSession();
  }

  function generateNewVariantSelection() {
    const next = Math.floor(Math.random() * ExamData.VARIANT_COUNT) + 1;
    ui.variantSelect.value = String(next);
    renderVariantStatuses();
  }

  function rebuildSelectedVariant() {
    const variant = Number(ui.variantSelect.value || 1);
    const count = ExamData.clampQuestionCount(state.subjectKey, Number(ui.questionCountInput.value));
    try {
      ExamData.rebuildVariant(state.subjectKey, variant, count);
      state.poolCache[state.subjectKey] = null;
      delete state.coverageCache[state.subjectKey];
      refreshCoverage(state.subjectKey);
      renderCoveragePreview();
      renderCoverageScreen();
      alert(`Вариант ${variant} пересобран на основе seed.`);
    } catch (error) {
      console.error(error);
      alert("Не удалось пересобрать вариант. Проверьте банк вопросов.");
    }
  }

  function compareVariantsFromTrainer() {
    setView(VIEWS.progress);
    renderProgressScreen();
  }

  function markOnboardingSeen() {
    state.stats.onboardingSeen = true;
    saveStats(state.stats);
    state.onboardingVisible = false;
    ui.onboardingView.classList.add("hidden");
  }

  function maybeShowOnboarding() {
    const seen = Boolean(state.stats.onboardingSeen);
    const hasSessions = (state.stats.sessions || []).length > 0;
    if (seen || hasSessions) {
      state.onboardingVisible = false;
      ui.onboardingView.classList.add("hidden");
      return;
    }
    state.onboardingVisible = true;
    ui.onboardingView.classList.remove("hidden");
  }

  function safeUiHandler(name, handler) {
    return (event) => {
      try {
        handler(event);
      } catch (error) {
        const reason = error && error.message ? error.message : String(error);
        reportFatalError(new Error(`UI_HANDLER_FAILED[${name}]: ${reason}`));
      }
    };
  }

  function bindEvent(element, eventName, handlerName, handler, missing) {
    if (!element || typeof element.addEventListener !== "function") {
      missing.push(handlerName);
      return;
    }
    element.addEventListener(eventName, safeUiHandler(handlerName, handler));
  }

  function wireEvents() {
    const missing = [];

    bindEvent(ui.onboardingStartBtn, "click", "onboardingStartBtn.click", markOnboardingSeen, missing);
    bindEvent(ui.onboardingSkipBtn, "click", "onboardingSkipBtn.click", markOnboardingSeen, missing);

    bindEvent(ui.openTrainerBtn, "click", "openTrainerBtn.click", () => setView(VIEWS.trainer), missing);
    bindEvent(ui.openProgressBtn, "click", "openProgressBtn.click", () => setView(VIEWS.progress), missing);
    bindEvent(ui.openCoverageBtn, "click", "openCoverageBtn.click", () => setView(VIEWS.coverage), missing);
    bindEvent(ui.openNextStepsBtn, "click", "openNextStepsBtn.click", () => setView(VIEWS.nextSteps), missing);
    bindEvent(ui.openReportBtn, "click", "openReportBtn.click", () => setView(VIEWS.report), missing);
    bindEvent(ui.quickExactExamBtn, "click", "quickExactExamBtn.click", startQuickExactExam, missing);
    bindEvent(ui.quickWeakTopicsBtn, "click", "quickWeakTopicsBtn.click", startWeakTopicTraining, missing);
    bindEvent(ui.quickMistakesBtn, "click", "quickMistakesBtn.click", () => {
      setMode(MODES.mistakes);
      startSession();
    }, missing);
    bindEvent(ui.quickContinueBtn, "click", "quickContinueBtn.click", continuePreparation, missing);

    bindEvent(ui.modeGrid, "click", "modeGrid.click", (event) => {
      const target = event.target.closest("[data-mode]");
      if (!target) {
        return;
      }
      setMode(target.dataset.mode);
    }, missing);

    bindEvent(ui.subjectCards, "click", "subjectCards.click", (event) => {
      const target = event.target.closest("[data-subject]");
      if (!target) {
        return;
      }

      state.subjectKey = target.dataset.subject;
      renderSubjectSelect();
      applyDefaultsForSubject();
      setMode(state.activeMode);
    }, missing);

    bindEvent(ui.subjectSelect, "change", "subjectSelect.change", () => {
      state.subjectKey = ui.subjectSelect.value;
      applyDefaultsForSubject();
      setMode(state.activeMode);
    }, missing);

    bindEvent(ui.routeSelect, "change", "routeSelect.change", () => {
      state.activeRoute = ui.routeSelect.value;
      renderNextStepsScreen();
    }, missing);

    bindEvent(ui.examModelSelect, "change", "examModelSelect.change", () => {
      syncExamScenarioControls();
      renderVariantSelect();
      renderCoveragePreview();
    }, missing);
    bindEvent(ui.variantSelect, "change", "variantSelect.change", () => {
      renderVariantStatuses();
      renderCoveragePreview();
    }, missing);

    bindEvent(ui.questionCountInput, "change", "questionCountInput.change", () => {
      if (state.activeMode === MODES.exam && isExactScenario(ui.examModelSelect.value)) {
        syncExamScenarioControls();
        renderVariantSelect();
        renderCoveragePreview();
        return;
      }
      ui.questionCountInput.value = ExamData.clampQuestionCount(
        state.subjectKey,
        Number(ui.questionCountInput.value),
      );
      renderVariantSelect();
      renderCoveragePreview();
    }, missing);

    bindEvent(ui.timeLimitInput, "change", "timeLimitInput.change", () => {
      if (state.activeMode === MODES.exam && isExactScenario(ui.examModelSelect.value)) {
        syncExamScenarioControls();
        return;
      }
      ui.timeLimitInput.value = ExamData.clampTimeLimit(
        state.subjectKey,
        Number(ui.timeLimitInput.value),
      );
    }, missing);

    bindEvent(ui.resetDefaultsBtn, "click", "resetDefaultsBtn.click", onResetDefaultsClick, missing);
    bindEvent(ui.clearResumeSessionBtn, "click", "clearResumeSessionBtn.click", onClearResumeSessionClick, missing);
    bindEvent(
      ui.resetSubjectStatsFromWeakBtn,
      "click",
      "resetSubjectStatsFromWeakBtn.click",
      resetSubjectStats,
      missing,
    );
    bindEvent(ui.resetSubjectStatsBtn, "click", "resetSubjectStatsBtn.click", resetSubjectStats, missing);
    bindEvent(ui.resetAllStatsBtn, "click", "resetAllStatsBtn.click", resetAllStats, missing);
    bindEvent(ui.runBankDiagnosticsBtn, "click", "runBankDiagnosticsBtn.click", renderBankDiagnostics, missing);
    bindEvent(ui.openVariantBtn, "click", "openVariantBtn.click", openSelectedVariant, missing);
    bindEvent(ui.generateVariantBtn, "click", "generateVariantBtn.click", generateNewVariantSelection, missing);
    bindEvent(ui.rebuildVariantBtn, "click", "rebuildVariantBtn.click", rebuildSelectedVariant, missing);
    bindEvent(ui.compareVariantsBtn, "click", "compareVariantsBtn.click", compareVariantsFromTrainer, missing);
    bindEvent(
      ui.closeBankDiagnosticsBtn,
      "click",
      "closeBankDiagnosticsBtn.click",
      () => closeBankDiagnosticsPanel(true),
      missing,
    );

    bindEvent(ui.startBtn, "click", "startBtn.click", () => startSession(), missing);
    bindEvent(ui.nextBtn, "click", "nextBtn.click", onNextButtonClick, missing);
    bindEvent(ui.feedbackBox, "click", "feedbackBox.click", onFeedbackActionClick, missing);

    bindEvent(ui.finishEarlyBtn, "click", "finishEarlyBtn.click", () => {
      if (!state.currentSession) {
        return;
      }
      finishSession(false);
    }, missing);

    bindEvent(ui.exitSessionBtn, "click", "exitSessionBtn.click", () => {
      if (!confirm("Выйти из сессии? Прогресс сохранится локально и можно будет продолжить позже.")) {
        return;
      }
      if (state.currentSession) {
        saveResumeSnapshot(state.currentSession);
      }
      goToTrainer();
    }, missing);

    bindEvent(ui.repeatSimilarBtn, "click", "repeatSimilarBtn.click", repeatSimilarFromResult, missing);
    bindEvent(ui.startMistakesBtn, "click", "startMistakesBtn.click", startMistakesFromResult, missing);
    bindEvent(ui.startExamBtn, "click", "startExamBtn.click", startExamFromResult, missing);
    bindEvent(ui.backToSetupBtn, "click", "backToSetupBtn.click", goToTrainer, missing);

    bindEvent(ui.refreshProgressBtn, "click", "refreshProgressBtn.click", onRefreshProgressClick, missing);
    bindEvent(ui.toTrainerBtn, "click", "toTrainerBtn.click", goToTrainer, missing);

    bindEvent(ui.refreshCoverageBtn, "click", "refreshCoverageBtn.click", onRefreshCoverageClick, missing);
    bindEvent(ui.coverageToTrainerBtn, "click", "coverageToTrainerBtn.click", goToTrainer, missing);

    bindEvent(ui.buildNextStepsBtn, "click", "buildNextStepsBtn.click", renderNextStepsScreen, missing);
    bindEvent(ui.nextStepsToTrainerBtn, "click", "nextStepsToTrainerBtn.click", goToTrainer, missing);

    bindEvent(ui.refreshReportBtn, "click", "refreshReportBtn.click", onRefreshReportClick, missing);
    bindEvent(ui.reportToTrainerBtn, "click", "reportToTrainerBtn.click", goToTrainer, missing);

    bindEvent(ui.exportJsonBtn, "click", "exportJsonBtn.click", exportProgressJson, missing);
    bindEvent(ui.importJsonBtn, "click", "importJsonBtn.click", () => ui.importJsonInput.click(), missing);
    bindEvent(ui.importJsonInput, "change", "importJsonInput.change", () => {
      const file = ui.importJsonInput.files && ui.importJsonInput.files[0];
      if (!file) {
        return;
      }
      importProgressJsonFile(file);
      ui.importJsonInput.value = "";
    }, missing);
    bindEvent(ui.exportHtmlReportBtn, "click", "exportHtmlReportBtn.click", exportHtmlReport, missing);

    bindEvent(ui.resumeSessionBox, "click", "resumeSessionBox.click", (event) => {
      const resumeBtn = event.target.closest("#resumeSessionBtn");
      if (resumeBtn) {
        resumeSavedSession();
        return;
      }

      const discardBtn = event.target.closest("#discardResumeBtn");
      if (discardBtn) {
        clearResumeSnapshot();
        renderResumeSessionBox();
      }
    }, missing);

    if (missing.length) {
      const message = `Не удалось привязать обработчики: ${missing.join(", ")}`;
      if (ui.modeHint) {
        ui.modeHint.textContent = message;
      }
      if (!window.__bootLog) {
        window.__bootLog = [];
      }
      window.__bootLog.push(message);
      reportFatalError(new Error(message));
    }
  }

  function bootstrap() {
    state.resumeSession = loadResumeSnapshot();
    const builtInOfficialLoad = loadBuiltInOfficialPack();
    const officialPackLoad = loadOfficialPackFromStorage() || builtInOfficialLoad;
    const latestRoute = state.stats.routeHistory && state.stats.routeHistory.length
      ? state.stats.routeHistory[state.stats.routeHistory.length - 1].routeKey
      : null;
    if (latestRoute && PlanningEngine.ROUTES[latestRoute]) {
      state.activeRoute = latestRoute;
    }

    state.subjectKey = ui.subjectSelect.value || state.subjectKey;

    try {
      initSetup();
    } catch (error) {
      console.error(error);
      ui.modeHint.textContent =
        "Часть данных не удалось загрузить. Базовый режим доступен, запустите диагностику банка.";
    }

    if (officialPackLoad && officialPackLoad.ok && ui.modeHint) {
      const summary = officialPackLoad.summary || {};
      ui.modeHint.textContent = `Подключён официальный пакет: ${summary.totalQuestions || 0} вопросов · годы: ${
        (summary.years || []).join(", ") || "не указаны"
      }.`;
    }

    try {
      if (ExamData && ExamData.bootErrors) {
        var issues = [];
        if (ExamData.bootErrors.blueprintUpgrade) {
          issues.push("blueprint: " + ExamData.bootErrors.blueprintUpgrade);
        }
        if (ExamData.bootErrors.factoryValidation) {
          issues.push("factory: " + ExamData.bootErrors.factoryValidation);
        }
        if (issues.length) {
          ui.modeHint.textContent =
            "Внимание: банк загружен с предупреждениями. " + issues.join(" | ");
        }
      }
    } catch (error) {
      console.error(error);
    }

    wireEvents();

    renderResumeSessionBox();
    maybeShowOnboarding();

    setView(VIEWS.trainer);
    window.__appReady = true;
    if (!window.__bootLog) {
      window.__bootLog = [];
    }
    window.__bootLog.push("App bootstrap complete");
  }

  bootstrap();
  } catch (fatalError) {
    reportFatalError(fatalError);
  }
})();
