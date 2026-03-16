(function runApp(global) {
  var config = global.AppConfig;
  var modules = global.ModulesData || [];
  var trainingQuestions = global.QuestionBankData || [];
  var officialQuestions = global.QuestionBankOfficialData || [];
  function normalizePrompt(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

function applyQuestionMediaMap(list, mediaMap) {
  if (!mediaMap || typeof mediaMap !== "object") {
    return list.slice();
  }

  return list.map(function (question) {
    if (!question || typeof question !== "object") {
      return question;
    }

    if (question.media && question.media.type === "image" && String(question.media.src || "").trim()) {
      return question;
    }

    var mapped = mediaMap[question.id];
    if (!mapped || typeof mapped !== "object") {
      return question;
    }

    var cloned = JSON.parse(JSON.stringify(question));
    cloned.media = {
      type: mapped.type || "image",
      src: mapped.src || "",
      alt: mapped.alt || question.prompt || "Иллюстрация к вопросу",
    };
    return cloned;
  });
}

  function getQuestionImageScore(question) {
    if (!question || typeof question !== "object") return 0;
    if (
      question.media &&
      question.media.type === "image" &&
      String(question.media.src || "").trim()
    ) {
      return 2;
    }
    if (String(question.imageSrc || question.image || "").trim()) {
      return 1;
    }
    return 0;
  }

  function getQuestionSourcePriority(question) {
    var source = String((question && question.source) || "");
    if (!source) return 0;
    if (source.indexOf("gimsportal.online") >= 0) return 3;
    if (source.indexOf("archive:gims-exams") >= 0 || source.indexOf("gims-exams") >= 0) return 2;
    if (source.indexOf("training") >= 0) return 1;
    return 0;
  }

  function shouldReplaceDuplicateQuestion(existing, candidate) {
    var existingImage = getQuestionImageScore(existing);
    var candidateImage = getQuestionImageScore(candidate);
    if (candidateImage > existingImage) return true;
    if (candidateImage < existingImage) return false;

    var existingPriority = getQuestionSourcePriority(existing);
    var candidatePriority = getQuestionSourcePriority(candidate);
    return candidatePriority > existingPriority;
  }

  function mergeQuestionBanks(training, official) {
    var idIndex = {};
    var promptScopeIndex = {};
    var merged = [];
    var dropped = {
      duplicateId: 0,
      duplicatePrompt: 0,
      invalid: 0,
      replacedByBetterDuplicate: 0,
    };

    [training, official].forEach(function (list) {
      list.forEach(function (question) {
        if (!question || typeof question !== "object") {
          dropped.invalid += 1;
          return;
        }

        var questionId = question.id;
        if (idIndex[questionId] !== undefined) {
          var byIdIndex = idIndex[questionId];
          var existingById = merged[byIdIndex];
          if (shouldReplaceDuplicateQuestion(existingById, question)) {
            merged[byIdIndex] = question;
            dropped.replacedByBetterDuplicate += 1;
          } else {
            dropped.duplicateId += 1;
          }
          return;
        }

        var promptKey = normalizePrompt(question.prompt);
        var scopeKey = [
          question.section || "",
          question.vesselType || "",
          question.area || "",
          promptKey,
        ].join("|");

        if (promptKey && promptScopeIndex[scopeKey] !== undefined) {
          var byPromptIndex = promptScopeIndex[scopeKey];
          var existingByPrompt = merged[byPromptIndex];

          if (shouldReplaceDuplicateQuestion(existingByPrompt, question)) {
            if (existingByPrompt && idIndex[existingByPrompt.id] !== undefined) {
              delete idIndex[existingByPrompt.id];
            }
            merged[byPromptIndex] = question;
            idIndex[questionId] = byPromptIndex;
            dropped.replacedByBetterDuplicate += 1;
          } else {
            dropped.duplicatePrompt += 1;
          }
          return;
        }

        var nextIndex = merged.length;
        merged.push(question);
        idIndex[questionId] = nextIndex;
        if (promptKey) {
          promptScopeIndex[scopeKey] = nextIndex;
        }
      });
    });

    return {
      questions: merged,
      dropped: dropped,
    };
  }


  var bankMerge = mergeQuestionBanks(trainingQuestions, officialQuestions);
  var questionMediaManifest = Array.isArray(global.QuestionMediaManifest) ? global.QuestionMediaManifest : [];
  var questionMediaMap = global.QuestionMediaMap && typeof global.QuestionMediaMap === "object" ? global.QuestionMediaMap : {};
  var bankPrepared = null;
  var mergedQuestionsWithMedia = applyQuestionMediaMap(bankMerge.questions, questionMediaMap);
  var allQuestions = mergedQuestionsWithMedia;
  var questions = mergedQuestionsWithMedia;
  var Storage = global.Storage;
  var ExamCore = global.ExamCore;
  var UI = global.UIRender;

  if (!config || !Storage || !ExamCore || !UI) {
    return;
  }

  bankPrepared = ExamCore.prepareQuestionBank(mergedQuestionsWithMedia, {
    mediaManifest: questionMediaManifest,
  });
  allQuestions = bankPrepared.questions;
  questions = bankPrepared.activeQuestions;

  var vesselOptions = [
    { value: "motor", label: "Маломерное моторное судно" },
    { value: "sail", label: "Маломерное парусное судно" },
    { value: "jetski", label: "Гидроцикл" },
  ];

  var areaOptions = [
    { value: "inland-waters", label: "Внутренние воды РФ" },
    { value: "inland-waterways", label: "Внутренние водные пути РФ" },
    { value: "sea-territorial", label: "Внутренние морские воды и территориальное море РФ" },
    { value: "coastal-20", label: "Морские прибрежные воды до 20 миль от берега" },
  ];

  var els = {
    setupView: document.getElementById("setupView"),
    learningView: document.getElementById("learningView"),
    examView: document.getElementById("examView"),
    resultView: document.getElementById("resultView"),

    setupHeading: document.getElementById("setupHeading"),
    learningHeading: document.getElementById("learningHeading"),
    examHeading: document.getElementById("examHeading"),
    resultHeading: document.getElementById("resultHeading"),

    learningStatusText: document.getElementById("learningStatusText"),
    examLockText: document.getElementById("examLockText"),
    mistakesHintText: document.getElementById("mistakesHintText"),
    quickPresetStatus: document.getElementById("quickPresetStatus"),

    startLearningBtn: document.getElementById("startLearningBtn"),
    quickMotorStartBtn: document.getElementById("quickMotorStartBtn"),
    startExamBtn: document.getElementById("startExamBtn"),
    resetLearningBtn: document.getElementById("resetLearningBtn"),
    clearMistakesBtn: document.getElementById("clearMistakesBtn"),

    sessionModeSelect: document.getElementById("sessionModeSelect"),
    examScenarioSelect: document.getElementById("examScenarioSelect"),
    vesselTypeSelect: document.getElementById("vesselTypeSelect"),
    areaSelect: document.getElementById("areaSelect"),
    mistakesCountSelect: document.getElementById("mistakesCountSelect"),
    mistakesCountField: document.getElementById("mistakesCountField"),

    moduleProgressText: document.getElementById("moduleProgressText"),
    moduleProgressBar: document.getElementById("moduleProgressBar"),
    moduleChecklist: document.getElementById("moduleChecklist"),

    historyAttemptsValue: document.getElementById("historyAttemptsValue"),
    historyAverageValue: document.getElementById("historyAverageValue"),
    historyMistakesValue: document.getElementById("historyMistakesValue"),
    historyList: document.getElementById("historyList"),
    weakTopicsBox: document.getElementById("weakTopicsBox"),
    strongTopicsBox: document.getElementById("strongTopicsBox"),
    topProblemsBox: document.getElementById("topProblemsBox"),
    bankValidationBox: document.getElementById("bankValidationBox"),

    exportProgressBtn: document.getElementById("exportProgressBtn"),
    importProgressBtn: document.getElementById("importProgressBtn"),
    importProgressInput: document.getElementById("importProgressInput"),

    learningTitle: document.getElementById("learningTitle"),
    learningCounter: document.getElementById("learningCounter"),
    learningImage: document.getElementById("learningImage"),
    learningImageFallback: document.getElementById("learningImageFallback"),
    learningSummary: document.getElementById("learningSummary"),
    learningPoints: document.getElementById("learningPoints"),
    learningMemo: document.getElementById("learningMemo"),
    modulePassBadge: document.getElementById("modulePassBadge"),
    learningQuizBox: document.getElementById("learningQuizBox"),
    learningQuizFeedback: document.getElementById("learningQuizFeedback"),
    checkModuleQuizBtn: document.getElementById("checkModuleQuizBtn"),
    prevModuleBtn: document.getElementById("prevModuleBtn"),
    nextModuleBtn: document.getElementById("nextModuleBtn"),
    backToSetupFromLearningBtn: document.getElementById("backToSetupFromLearningBtn"),

    examCounter: document.getElementById("examCounter"),
    examProgressBar: document.getElementById("examProgressBar"),
    questionTopic: document.getElementById("questionTopic"),
    questionPrompt: document.getElementById("questionPrompt"),
    questionMediaWrap: document.getElementById("questionMediaWrap"),
    questionMediaImage: document.getElementById("questionMediaImage"),
    questionMediaFallback: document.getElementById("questionMediaFallback"),
    optionsBox: document.getElementById("optionsBox"),
    feedbackBox: document.getElementById("feedbackBox"),
    submitOrNextBtn: document.getElementById("submitOrNextBtn"),
    exitExamBtn: document.getElementById("exitExamBtn"),

    resultMeta: document.getElementById("resultMeta"),
    correctValue: document.getElementById("correctValue"),
    totalValue: document.getElementById("totalValue"),
    percentValue: document.getElementById("percentValue"),
    resultTopicsBox: document.getElementById("resultTopicsBox"),
    reviewList: document.getElementById("reviewList"),
    restartExamBtn: document.getElementById("restartExamBtn"),
    backToSetupBtn: document.getElementById("backToSetupBtn"),
  };

  var state = {
    learning: Storage.loadLearning(
      modules.map(function (module) {
        return module.id;
      })
    ),
    stats: Storage.loadStats(),
    currentModuleIndex: 0,
    quizByModule: {},
    session: null,
    validation: bankPrepared.validation,
    bankDiagnostics: bankPrepared,
    setupNotice: "",
    view: "setup",
  };

  modules.forEach(function (module) {
    state.quizByModule[module.id] = {
      answers: {},
      feedback: "",
      success: false,
    };
  });

  initSelects();
  bindEvents();
  renderSetup();
  UI.showView(els, "setup", config);

  function initSelects() {
    UI.setSelectOptions(els.vesselTypeSelect, vesselOptions, config.defaults.vesselType);
    UI.setSelectOptions(els.areaSelect, areaOptions, config.defaults.area);

    UI.setSelectOptions(
      els.mistakesCountSelect,
      config.mistakes.shortTicketOptions.map(function (value) {
        return { value: String(value), label: String(value) + " вопросов" };
      }),
      String(config.defaults.mistakesCount)
    );

    els.examScenarioSelect.value = config.defaults.scenario;
    els.sessionModeSelect.value = config.defaults.sessionMode;
    updateMistakesCountVisibility();
  }

  function bindEvents() {
    els.startLearningBtn.addEventListener("click", function () {
      openLearning(findFirstIncompleteModuleIndex());
    });

    els.quickMotorStartBtn.addEventListener("click", function () {
      els.vesselTypeSelect.value = "motor";
      els.areaSelect.value = "inland-waters";
      els.examScenarioSelect.value = "full";
      els.sessionModeSelect.value = "training";
      updateMistakesCountVisibility();
      state.setupNotice = "Применены рекомендованные параметры: моторное судно, внутренние воды, полный комплект, режим тренировки.";
      renderSetup();
    });

    els.resetLearningBtn.addEventListener("click", function () {
      if (!global.confirm("Сбросить прогресс обучения по модулям?")) return;
      state.learning = Storage.resetLearning(
        modules.map(function (module) {
          return module.id;
        })
      );
      modules.forEach(function (module) {
        state.quizByModule[module.id] = {
          answers: {},
          feedback: "",
          success: false,
        };
      });
      renderSetup();
      UI.showView(els, "setup", config);
    });

    els.clearMistakesBtn.addEventListener("click", function () {
      if (!global.confirm("Очистить накопленные ошибки, сохранив остальную статистику?")) return;
      state.stats = Storage.clearMistakes(state.stats);
      renderSetup();
    });

    els.examScenarioSelect.addEventListener("change", function () {
      state.setupNotice = "";
      updateMistakesCountVisibility();
      renderSetup();
    });
    els.sessionModeSelect.addEventListener("change", function () {
      state.setupNotice = "";
      renderSetup();
    });
    els.vesselTypeSelect.addEventListener("change", function () {
      state.setupNotice = "";
      renderSetup();
    });
    els.areaSelect.addEventListener("change", function () {
      state.setupNotice = "";
      renderSetup();
    });
    els.mistakesCountSelect.addEventListener("change", function () {
      state.setupNotice = "";
      renderSetup();
    });

    els.startExamBtn.addEventListener("click", startSession);
    els.restartExamBtn.addEventListener("click", startSession);

    els.prevModuleBtn.addEventListener("click", function () {
      if (state.currentModuleIndex > 0) {
        state.currentModuleIndex -= 1;
        renderLearning();
      }
    });

    els.nextModuleBtn.addEventListener("click", function () {
      if (state.currentModuleIndex < modules.length - 1) {
        state.currentModuleIndex += 1;
        renderLearning();
      }
    });

    els.backToSetupFromLearningBtn.addEventListener("click", function () {
      renderSetup();
      UI.showView(els, "setup", config);
      state.view = "setup";
    });

    els.learningQuizBox.addEventListener("change", function (event) {
      var target = event.target;
      if (!target || target.tagName !== "INPUT" || target.type !== "radio") return;
      var module = modules[state.currentModuleIndex];
      var quizState = state.quizByModule[module.id];
      var quizId = target.getAttribute("data-quiz-id");
      quizState.answers[quizId] = Number(target.value);
      quizState.feedback = "";
      quizState.success = false;
    });

    els.checkModuleQuizBtn.addEventListener("click", function () {
      checkCurrentModuleQuiz();
    });

    els.submitOrNextBtn.addEventListener("click", function () {
      if (!state.session) return;
      if (state.session.sessionMode === "training") {
        handleTrainingStep();
      } else {
        handleExamStep();
      }
    });

    els.exitExamBtn.addEventListener("click", function () {
      if (!state.session) {
        UI.showView(els, "setup", config);
        state.view = "setup";
        return;
      }
      if (!global.confirm("Прервать незавершенную сессию и вернуться к настройкам?")) return;
      state.session = null;
      renderSetup();
      UI.showView(els, "setup", config);
      state.view = "setup";
    });

    els.backToSetupBtn.addEventListener("click", function () {
      renderSetup();
      UI.showView(els, "setup", config);
      state.view = "setup";
    });

    els.exportProgressBtn.addEventListener("click", function () {
      exportSnapshot();
    });

    els.importProgressBtn.addEventListener("click", function () {
      els.importProgressInput.value = "";
      els.importProgressInput.click();
    });

    els.importProgressInput.addEventListener("change", function (event) {
      var file = event.target.files && event.target.files[0];
      if (!file) return;
      importSnapshot(file);
    });

    document.addEventListener("keydown", handleExamKeyboard);

    global.addEventListener("beforeunload", function (event) {
      if (state.session && state.view === "exam") {
        event.preventDefault();
        event.returnValue = "";
      }
    });
  }

  function updateMistakesCountVisibility() {
    UI.setHidden(els.mistakesCountField, els.examScenarioSelect.value !== "mistakes");
  }

  function findFirstIncompleteModuleIndex() {
    for (var i = 0; i < modules.length; i += 1) {
      var id = modules[i].id;
      if (!state.learning.modules[id] || !state.learning.modules[id].passed) {
        return i;
      }
    }
    return 0;
  }

  function openLearning(index) {
    state.currentModuleIndex = index;
    renderLearning();
    UI.showView(els, "learning", config);
    state.view = "learning";
  }

  function renderLearning() {
    var module = modules[state.currentModuleIndex];
    var moduleState = state.learning.modules[module.id] || { passed: false, bestScore: 0 };
    var quizState = state.quizByModule[module.id];

    UI.renderLearningModule(els, module, state.currentModuleIndex, modules.length, moduleState, quizState);
    UI.renderLearningImage(els, module.image);

    els.prevModuleBtn.disabled = state.currentModuleIndex === 0;
    els.nextModuleBtn.disabled = state.currentModuleIndex === modules.length - 1;
  }

  function checkCurrentModuleQuiz() {
    var module = modules[state.currentModuleIndex];
    var quizState = state.quizByModule[module.id];
    var total = module.quiz.length;

    var answered = module.quiz.filter(function (q) {
      return typeof quizState.answers[q.id] === "number";
    }).length;

    if (answered < total) {
      quizState.feedback = "Ответьте на все вопросы мини-проверки.";
      quizState.success = false;
      renderLearning();
      return;
    }

    var correct = module.quiz.filter(function (q) {
      return quizState.answers[q.id] === q.correctIndex;
    }).length;

    var score = correct / total;
    var passed = score >= config.passScore.moduleQuiz;

    if (passed) {
      var info = state.learning.modules[module.id] || { passed: false, bestScore: 0, lastAt: null };
      info.passed = true;
      info.bestScore = Math.max(info.bestScore || 0, score);
      info.lastAt = new Date().toISOString();
      state.learning.modules[module.id] = info;
      if (state.learning.completedOrder.indexOf(module.id) < 0) {
        state.learning.completedOrder.push(module.id);
      }
      Storage.saveLearning(state.learning);
    }

    quizState.feedback =
      "Результат мини-проверки: " +
      correct +
      "/" +
      total +
      " (" +
      Math.round(score * 100) +
      "%). " +
      (passed ? "Модуль завершен." : "Повторите материал и попробуйте еще раз.");
    quizState.success = passed;

    renderLearning();
    renderSetup();
  }

  function allModulesPassed() {
    return modules.every(function (module) {
      var info = state.learning.modules[module.id];
      return info && info.passed;
    });
  }

  function countMistakeQuestions(vesselType, area) {
    return questions.filter(function (question) {
      var stat = state.stats.questionStats[question.id];
      if (!stat) return false;
      var mastery = typeof stat.masteryScore === "number" ? stat.masteryScore : 0;
      if (stat.wrong < config.mistakes.minWrongAttempts) return false;
      if (mastery >= config.mistakes.masteryScoreToExitMistakes) return false;

      if (question.section === "type") {
        return question.vesselType === vesselType || question.vesselType === "any";
      }
      if (question.section === "area") {
        return question.area === area || question.area === "any";
      }
      return false;
    }).length;
  }

  function renderSetup() {
    var completedCount = modules.filter(function (module) {
      var info = state.learning.modules[module.id];
      return info && info.passed;
    }).length;

    var scenario = els.examScenarioSelect.value;
    var vesselType = els.vesselTypeSelect.value;
    var area = els.areaSelect.value;
    var mistakesCount = Number(els.mistakesCountSelect.value) || config.ticketSize.mistakesDefault;

    var availability = ExamCore.getScenarioAvailability({
      questions: questions,
      stats: state.stats,
      config: config,
      scenario: scenario,
      vesselType: vesselType,
      area: area,
      mistakesCount: mistakesCount,
    });

    var mistakesAvailable =
      scenario === "mistakes" ? availability.availableCount : countMistakeQuestions(vesselType, area);
    var canStart = availability.hasAny;

    var history = buildHistoryViewData();
    var topicSummary = ExamCore.pickWeakAndStrongTopics(state.stats);
    var topProblems = ExamCore.getTopProblemQuestions(
      state.stats,
      allQuestions,
      config.limits.maxTopProblemQuestions
    );

    var summary = state.validation.summary || {};
    var validationLines = [];

    validationLines.push(
      "Банк: тренировочных " +
        trainingQuestions.length +
        ", официальных " +
        officialQuestions.length +
        ", после дедупликации " +
        allQuestions.length +
        "."
    );
    validationLines.push(
      "После диагностики: валидных " +
        (summary.valid || 0) +
        ", исключено " +
        (summary.excluded || 0) +
        "."
    );
    validationLines.push("Требуют рисунок без media: " + (summary.missingMediaRequired || 0) + ".");
    validationLines.push("С битым media.src: " + (summary.brokenMediaSrc || 0) + ".");
    validationLines.push("Нормализовано explanation: " + (summary.normalizedExplanations || 0) + ".");

    if (state.bankDiagnostics.excludedQuestionIds.length) {
      validationLines.push(
        "Примеры исключенных id: " + state.bankDiagnostics.excludedQuestionIds.slice(0, 10).join(", ") + "."
      );
    }

    if (bankMerge.dropped.duplicatePrompt || bankMerge.dropped.duplicateId) {
      validationLines.push(
        "Удалено дублей: prompt=" +
          bankMerge.dropped.duplicatePrompt +
          ", id=" +
          bankMerge.dropped.duplicateId +
          "."
      );
    }

    if (officialQuestions.length === 0) {
      validationLines.push("Официальный банк не подключен: используется только тренировочный набор.");
    }

    if (state.validation.errors.length) {
      validationLines = validationLines.concat(
        state.validation.errors.slice(0, 8).map(function (line) {
          return "[error] " + line;
        })
      );
    }

    if (state.validation.warnings.length) {
      validationLines = validationLines.concat(
        state.validation.warnings.slice(0, 8).map(function (line) {
          return "[warn] " + line;
        })
      );
    }

    var examLockText = "Сессия доступна.";
    if (!availability.hasAny) {
      examLockText =
        scenario === "mistakes"
          ? "По выбранным параметрам пока нет вопросов с ошибками."
          : "Для выбранных параметров нет валидных вопросов в банке.";
    } else if (!availability.hasEnough) {
      if (scenario === "full" && availability.details) {
        examLockText =
          "Для полного билета доступно " +
          availability.availableCount +
          " из " +
          availability.requiredCount +
          " (тип: " +
          availability.details.typeAvailable +
          "/" +
          availability.details.typeRequired +
          ", район: " +
          availability.details.areaAvailable +
          "/" +
          availability.details.areaRequired +
          "). Можно запустить сокращенный билет после подтверждения.";
      } else {
        examLockText =
          "Для выбранного режима доступно только " +
          availability.availableCount +
          " валидных вопросов из необходимых " +
          availability.requiredCount +
          ". Можно запустить сокращенный билет после подтверждения.";
      }
    }

    UI.renderSetup(els, {
      learningText: allModulesPassed()
        ? "Обучение завершено. Можно запускать сессии сразу."
        : "Обучение опционально: можно начать сессию сразу или пройти модули с мини-квизами.",
      examLockText: examLockText,
      canStart: canStart,
      moduleProgressText: completedCount + " / " + modules.length + " модулей пройдено",
      moduleProgressPercent: Math.round((completedCount / modules.length) * 100),
      modules: modules,
      learningState: state.learning,
      mistakesHint:
        scenario === "mistakes"
          ? mistakesAvailable > 0
            ? "Доступно вопросов по ошибкам: " + mistakesAvailable + "."
            : "Нет накопленных ошибок для выбранных типа/района."
          : "",
      quickPresetNote: state.setupNotice,
      history: history,
      topicSummary: topicSummary,
      topProblems: topProblems,
      validationErrors: validationLines,
    });
  }

  function buildHistoryViewData() {
    var sessions = state.stats.sessions || [];
    var attempts = sessions.length;
    var avg =
      attempts > 0
        ? Math.round(
            sessions.reduce(function (sum, session) {
              return sum + Number(session.percent || 0);
            }, 0) / attempts
          )
        : 0;

    var mistakeQuestions = Object.keys(state.stats.questionStats || {}).filter(function (id) {
      var stat = state.stats.questionStats[id];
      return stat.wrong > 0 && stat.masteryScore < config.mistakes.masteryScoreToExitMistakes;
    }).length;

    var lastSessions = sessions.slice(0, config.limits.maxHistoryPreview).map(function (session) {
      var modeLabel = session.sessionMode === "exam" ? "Экзамен" : "Тренировка";
      var title =
        modeLabel +
        " · " +
        (session.scenario || "-") +
        " · " +
        (session.correct || 0) +
        "/" +
        (session.total || 0) +
        " (" +
        (session.percent || 0) +
        "%)";
      var meta =
        (session.dateText || "") +
        " · тип: " +
        (session.vesselType || "-") +
        " · район: " +
        (session.area || "-") +
        " · ошибок: " +
        (session.errorsCount || 0) +
        " · слабая тема: " +
        (session.weakTopic || "нет данных");
      return {
        title: title,
        meta: meta,
      };
    });

    return {
      attempts: attempts,
      averagePercent: avg,
      mistakeQuestions: mistakeQuestions,
      lastSessions: lastSessions,
    };
  }

  function startSession() {
    var scenario = els.examScenarioSelect.value;
    var sessionMode = els.sessionModeSelect.value;
    var vesselType = els.vesselTypeSelect.value;
    var area = els.areaSelect.value;
    var mistakesCount = Number(els.mistakesCountSelect.value) || config.ticketSize.mistakesDefault;

    var ticket = ExamCore.generateTicket({
      questions: questions,
      stats: state.stats,
      config: config,
      scenario: scenario,
      vesselType: vesselType,
      area: area,
      sessionMode: sessionMode,
      mistakesCount: mistakesCount,
    });

    if (!ticket.ok && ticket.reason === "insufficient-pool") {
      var confirmText =
        "Для выбранного режима доступно только " +
        ticket.availableCount +
        " валидных вопросов из необходимых " +
        ticket.requiredCount +
        ". Запустить сокращенный билет на " +
        ticket.availableCount +
        " вопросов?";

      if (!global.confirm(confirmText)) {
        state.setupNotice =
          "Старт отменен. Для выбранного сценария доступно " +
          ticket.availableCount +
          " из " +
          ticket.requiredCount +
          " валидных вопросов.";
        renderSetup();
        UI.showView(els, "setup", config);
        state.view = "setup";
        return;
      }

      ticket = ExamCore.generateTicket({
        questions: questions,
        stats: state.stats,
        config: config,
        scenario: scenario,
        vesselType: vesselType,
        area: area,
        sessionMode: sessionMode,
        mistakesCount: mistakesCount,
        allowShortTicket: true,
      });
    }

    if (!ticket.ok || !ticket.questions.length) {
      if (ticket.reason === "no-mistakes") {
        global.alert("По выбранным параметрам нет вопросов для режима работы над ошибками.");
      } else if (ticket.reason === "pool-empty") {
        global.alert("Для выбранного режима нет валидных вопросов. Измените параметры сессии.");
      } else {
        global.alert("Не удалось сформировать билет. Проверьте параметры и диагностику банка.");
      }
      renderSetup();
      UI.showView(els, "setup", config);
      state.view = "setup";
      return;
    }

    state.setupNotice = "";

    var shuffledQuestions = ticket.questions.map(function (question) {
      return shuffleQuestionOptions(question);
    });

    state.session = {
      id: "session-" + Date.now(),
      startedAt: new Date().toISOString(),
      scenario: scenario,
      sessionMode: sessionMode,
      vesselType: vesselType,
      area: area,
      warnings: ticket.warnings || [],
      contextKey: ticket.contextKey || ExamCore.buildContextKey({ scenario: scenario, vesselType: vesselType, area: area, sessionMode: sessionMode }),
      signature: ticket.signature || null,
      questions: shuffledQuestions,
      answers: new Array(shuffledQuestions.length),
      currentIndex: 0,
      phase: "answer",
      reviewFeedback: null,
    };

    renderExam();
    UI.showView(els, "exam", config);
    state.view = "exam";
  }

  function shuffleQuestionOptions(question) {
    var order = ExamCore.shuffle(
      question.options.map(function (text, index) {
        return { text: text, index: index };
      })
    );

    var newOptions = order.map(function (item) {
      return item.text;
    });

    var newCorrectIndex = order.findIndex(function (item) {
      return item.index === question.correctIndex;
    });

    var wrongMap = {};
    (question.whyWrongOptions || []).forEach(function (entry) {
      wrongMap[entry.index] = entry.text;
    });

    var newWrongOptions = [];
    order.forEach(function (item, newIndex) {
      if (newIndex === newCorrectIndex) return;
      newWrongOptions.push({
        index: newIndex,
        text: wrongMap[item.index] || "Этот вариант не соответствует безопасной практике.",
      });
    });

    var clone = JSON.parse(JSON.stringify(question));
    clone.options = newOptions;
    clone.correctIndex = newCorrectIndex;
    clone.whyWrongOptions = newWrongOptions;
    return clone;
  }

  function renderExam() {
    var session = state.session;
    if (!session) return;

    var index = session.currentIndex;
    var question = session.questions[index];
    var answer = session.answers[index] || null;

    var payload = {
      counterText:
        (session.sessionMode === "exam" ? "Экзамен" : "Тренировка") +
        " · " +
        (index + 1) +
        "/" +
        session.questions.length,
      progressPercent: Math.round(((index + 1) / session.questions.length) * 100),
      question: question,
      showTopic: session.sessionMode === "training",
      currentAnswer: answer ? answer.selectedIndex : null,
      feedback: session.sessionMode === "training" && session.phase === "review" ? session.reviewFeedback : null,
      nextButtonText: resolveNextButtonText(session),
    };

    UI.renderExamQuestion(els, payload);

    if (session.sessionMode === "training" && session.phase === "review" && session.reviewFeedback) {
      decorateOptionsAfterCheck(question.correctIndex, session.reviewFeedback.selectedIndex);
    }
  }

  function resolveNextButtonText(session) {
    var isLast = session.currentIndex >= session.questions.length - 1;

    if (session.sessionMode === "exam") {
      return isLast ? "Завершить экзамен" : "Ответить и далее";
    }

    if (session.phase === "answer") {
      return "Проверить ответ";
    }

    return isLast ? "Показать результат" : "Следующий вопрос";
  }

  function getSelectedAnswerIndex() {
    var checked = document.querySelector('input[name="exam-answer"]:checked');
    if (!checked) return null;
    return Number(checked.value);
  }

  function handleTrainingStep() {
    var session = state.session;
    var idx = session.currentIndex;

    if (session.phase === "answer") {
      var selectedIndex = getSelectedAnswerIndex();
      if (selectedIndex === null) {
        els.feedbackBox.className = "feedback-box wrong";
        els.feedbackBox.textContent = "Выберите вариант ответа.";
        UI.setHidden(els.feedbackBox, false);
        return;
      }

      var question = session.questions[idx];
      var isCorrect = selectedIndex === question.correctIndex;
      session.answers[idx] = {
        questionId: question.id,
        selectedIndex: selectedIndex,
        isCorrect: isCorrect,
      };

      ExamCore.registerAnswer(state.stats, question, isCorrect, config, new Date().toISOString());
      Storage.saveStats(state.stats);

      session.reviewFeedback = buildDetailedFeedback(question, selectedIndex, isCorrect);
      session.phase = "review";
      renderExam();
      return;
    }

    moveToNextQuestionOrFinish();
  }

  function handleExamStep() {
    var session = state.session;
    var idx = session.currentIndex;
    var selectedIndex = getSelectedAnswerIndex();
    if (selectedIndex === null) {
      els.feedbackBox.className = "feedback-box wrong";
      els.feedbackBox.textContent = "Выберите вариант ответа.";
      UI.setHidden(els.feedbackBox, false);
      return;
    }

    var question = session.questions[idx];
    var isCorrect = selectedIndex === question.correctIndex;

    session.answers[idx] = {
      questionId: question.id,
      selectedIndex: selectedIndex,
      isCorrect: isCorrect,
    };

    ExamCore.registerAnswer(state.stats, question, isCorrect, config, new Date().toISOString());
    Storage.saveStats(state.stats);

    moveToNextQuestionOrFinish();
  }

  function moveToNextQuestionOrFinish() {
    var session = state.session;
    if (!session) return;

    var isLast = session.currentIndex >= session.questions.length - 1;
    if (isLast) {
      finishSession();
      return;
    }

    session.currentIndex += 1;
    session.phase = "answer";
    session.reviewFeedback = null;
    renderExam();
  }

  function buildDetailedFeedback(question, selectedIndex, isCorrect) {
    var correctText = question.options[question.correctIndex];
    var selectedText = question.options[selectedIndex];

    var wrongTexts = (question.whyWrongOptions || [])
      .map(function (item) {
        var optionText = question.options[item.index] || "Вариант";
        return optionText + ": " + item.text;
      })
      .join(" ");

    var html =
      "<p><strong>Правильный ответ:</strong> " +
      UI.escapeHtml(correctText) +
      "</p>" +
      "<p><strong>Почему верно:</strong> " +
      UI.escapeHtml(question.explanationShort) +
      "</p>" +
      "<p><strong>Подробно:</strong> " +
      UI.escapeHtml(question.explanationLong) +
      "</p>" +
      "<p><strong>Почему другие неверны:</strong> " +
      UI.escapeHtml(wrongTexts) +
      "</p>" +
      "<p><strong>Практический вывод:</strong> " +
      UI.escapeHtml("Применяйте этот принцип на воде заранее, а не в момент риска.") +
      "</p>";

    return {
      correct: isCorrect,
      selectedIndex: selectedIndex,
      html: html,
      selectedText: selectedText,
      correctText: correctText,
    };
  }

  function decorateOptionsAfterCheck(correctIndex, selectedIndex) {
    Array.prototype.slice
      .call(els.optionsBox.querySelectorAll(".option-row"))
      .forEach(function (row, index) {
        var input = row.querySelector("input");
        if (input) input.disabled = true;
        if (index === correctIndex) {
          row.classList.add("correct");
        } else if (index === selectedIndex) {
          row.classList.add("wrong");
        }
      });
  }

  function finishSession() {
    var session = state.session;
    if (!session) return;

    var total = session.questions.length;
    var answered = session.answers.filter(Boolean);
    var correct = answered.filter(function (a) {
      return a.isCorrect;
    }).length;
    var percent = total > 0 ? Math.round((correct / total) * 100) : 0;

    var passThreshold = session.sessionMode === "exam" ? config.passScore.exam : config.passScore.training;
    var passed = percent >= Math.round(passThreshold * 100);

    var mistakes = answered
      .map(function (answer, index) {
        return {
          answer: answer,
          question: session.questions[index],
        };
      })
      .filter(function (item) {
        return item.answer && !item.answer.isCorrect;
      })
      .map(function (item) {
        var wrongExplanation = (item.question.whyWrongOptions || [])
          .map(function (entry) {
            var optionText = item.question.options[entry.index] || "Вариант";
            return optionText + ": " + entry.text;
          })
          .join(" ");

        return {
          topic: item.question.topic,
          prompt: item.question.prompt,
          selectedText: item.question.options[item.answer.selectedIndex] || "-",
          correctText: item.question.options[item.question.correctIndex],
          explanationLong: item.question.explanationLong,
          wrongExplanation: wrongExplanation,
        };
      });

    var groupedByTopic = {};
    mistakes.forEach(function (item) {
      if (!groupedByTopic[item.topic]) groupedByTopic[item.topic] = 0;
      groupedByTopic[item.topic] += 1;
    });

    var topicGroups = Object.keys(groupedByTopic)
      .map(function (topic) {
        return { topic: topic, errors: groupedByTopic[topic] };
      })
      .sort(function (a, b) {
        return b.errors - a.errors;
      });

    appendHistorySession(session, {
      total: total,
      correct: correct,
      percent: percent,
      mistakes: mistakes,
      topicGroups: topicGroups,
    });

    if (session.signature) {
      ExamCore.registerTicket(state.stats, session.contextKey, session.signature, config);
    }

    Storage.saveStats(state.stats);

    var warningText = session.warnings && session.warnings.length ? " " + session.warnings.join(" ") : "";

    UI.renderResult(els, {
      total: total,
      correct: correct,
      percent: percent,
      meta:
        (passed ? "Порог пройден." : "Порог не пройден.") +
        " Режим: " +
        (session.sessionMode === "exam" ? "экзамен" : "тренировка") +
        "." +
        warningText,
      mistakes: mistakes,
      topicGroups: topicGroups,
    });

    state.session = null;
    renderSetup();
    UI.showView(els, "result", config);
    state.view = "result";
  }

  function appendHistorySession(session, result) {
    var weakTopic = result.topicGroups.length ? result.topicGroups[0].topic : "нет";
    var entry = {
      id: session.id,
      dateIso: new Date().toISOString(),
      dateText: new Date().toLocaleString("ru-RU"),
      sessionMode: session.sessionMode,
      scenario: session.scenario,
      vesselType: session.vesselType,
      area: session.area,
      total: result.total,
      correct: result.correct,
      percent: result.percent,
      errorsCount: result.mistakes.length,
      weakTopic: weakTopic,
      questionIds: session.questions.map(function (q) {
        return q.id;
      }),
    };

    state.stats.sessions.unshift(entry);
    state.stats.sessions = state.stats.sessions.slice(0, config.limits.maxSessionsStored);
  }

  function handleExamKeyboard(event) {
    if (state.view !== "exam" || !state.session) return;

    var keyNum = Number(event.key);
    if (Number.isInteger(keyNum) && keyNum >= 1 && keyNum <= 9) {
      var target = document.querySelector('input[name="exam-answer"][value="' + (keyNum - 1) + '"]');
      if (target) {
        target.checked = true;
      }
      return;
    }

    if (event.key === "Enter") {
      var tag = (event.target && event.target.tagName) || "";
      if (tag === "BUTTON" || tag === "SELECT") return;
      event.preventDefault();
      els.submitOrNextBtn.click();
    }
  }

  function exportSnapshot() {
    var snapshot = Storage.exportSnapshot(state.learning, state.stats);
    var blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "gims-trainer-backup.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importSnapshot(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = JSON.parse(String(reader.result || "{}"));
        var result = Storage.importSnapshot(
          parsed,
          modules.map(function (module) {
            return module.id;
          })
        );
        if (!result.ok) {
          global.alert("Не удалось импортировать файл: " + result.reason);
          return;
        }
        state.learning = result.learning;
        state.stats = result.stats;
        renderSetup();
        UI.showView(els, "setup", config);
        state.view = "setup";
      } catch (error) {
        global.alert("Ошибка чтения файла импорта.");
      }
    };
    reader.readAsText(file, "utf-8");
  }
})(window);
