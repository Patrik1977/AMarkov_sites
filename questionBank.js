(function attachQuestionBank(global) {
  const VARIANT_COUNT = 15;
  const BASE_QUESTION_COUNT = 30;
  const MIN_QUESTION_COUNT = 15;
  const MAX_TIME_MINUTES = 360;
  const MIN_TIME_MINUTES = 15;

  const SUBJECTS = [
    {
      key: "russian",
      title: "Русский язык",
      description: "Кодификатор ФИПИ: орфография, пунктуация, синтаксис, текст",
    },
    {
      key: "math",
      title: "Математика",
      description: "Кодификатор ФИПИ: числа, алгебра, геометрия, вероятность",
    },
    {
      key: "physics",
      title: "Физика",
      description: "Кодификатор ФИПИ: механика, молекулярная физика, электродинамика",
    },
    {
      key: "english",
      title: "Английский язык",
      description: "Формат ОГЭ: grammar, vocabulary, reading, communication",
    },
  ];

  const SUBJECT_CONFIG = {
    russian: {
      defaultQuestions: 30,
      defaultMinutes: 235,
      maxQuestions: 45,
      minQuestions: MIN_QUESTION_COUNT,
      difficultyBase: { basic: 6, medium: 12, hard: 12 },
      segmentWeights: {
        "Орфография": 8,
        "Пунктуация": 7,
        "Синтаксис": 6,
        "Лексика": 5,
        "Текст и речь": 4,
      },
      mandatorySegments: ["Орфография", "Пунктуация", "Синтаксис", "Лексика", "Текст и речь"],
      hardShareMin: 0.34,
      fipiLinks: {
        codifier: "https://doc.fipi.ru/oge/demoversii-specifikacii-kodifikatory/2026/ru_9_2026.zip",
        specification: "https://doc.fipi.ru/oge/demoversii-specifikacii-kodifikatory/2026/ru_9_2026.zip",
        demo: "https://doc.fipi.ru/oge/demoversii-specifikacii-kodifikatory/2026/ru_9_2026.zip",
        navigator: "https://fipi.ru/navigator-podgotovki/navigator-oge",
      },
    },
    math: {
      defaultQuestions: 30,
      defaultMinutes: 235,
      maxQuestions: 50,
      minQuestions: MIN_QUESTION_COUNT,
      difficultyBase: { basic: 6, medium: 12, hard: 12 },
      segmentWeights: {
        "Числа и вычисления": 5,
        "Алгебра": 9,
        "Функции и графики": 5,
        "Геометрия": 7,
        "Вероятность и статистика": 4,
      },
      mandatorySegments: [
        "Числа и вычисления",
        "Алгебра",
        "Функции и графики",
        "Геометрия",
        "Вероятность и статистика",
      ],
      hardShareMin: 0.34,
      fipiLinks: {
        codifier: "https://doc.fipi.ru/oge/demoversii-specifikacii-kodifikatory/2026/ma_9_2026.zip",
        specification: "https://doc.fipi.ru/oge/demoversii-specifikacii-kodifikatory/2026/ma_9_2026.zip",
        demo: "https://doc.fipi.ru/oge/demoversii-specifikacii-kodifikatory/2026/ma_9_2026.zip",
        navigator: "https://fipi.ru/navigator-podgotovki/navigator-oge",
      },
    },
    physics: {
      defaultQuestions: 30,
      defaultMinutes: 180,
      maxQuestions: 50,
      minQuestions: MIN_QUESTION_COUNT,
      difficultyBase: { basic: 6, medium: 12, hard: 12 },
      segmentWeights: {
        "Механика": 8,
        "Молекулярная физика": 5,
        "Электродинамика": 8,
        "Оптика и волны": 4,
        "Эксперимент и анализ": 5,
      },
      mandatorySegments: [
        "Механика",
        "Молекулярная физика",
        "Электродинамика",
        "Оптика и волны",
        "Эксперимент и анализ",
      ],
      hardShareMin: 0.34,
      fipiLinks: {
        codifier: "https://doc.fipi.ru/oge/demoversii-specifikacii-kodifikatory/2026/fi_9_2026.zip",
        specification: "https://doc.fipi.ru/oge/demoversii-specifikacii-kodifikatory/2026/fi_9_2026.zip",
        demo: "https://doc.fipi.ru/oge/demoversii-specifikacii-kodifikatory/2026/fi_9_2026.zip",
        navigator: "https://fipi.ru/navigator-podgotovki/navigator-oge",
      },
    },
    english: {
      defaultQuestions: 30,
      defaultMinutes: 135,
      maxQuestions: 45,
      minQuestions: MIN_QUESTION_COUNT,
      difficultyBase: { basic: 6, medium: 12, hard: 12 },
      segmentWeights: {
        "Grammar": 9,
        "Vocabulary": 7,
        "Reading": 6,
        "Use of English": 4,
        "Communication": 4,
      },
      mandatorySegments: ["Grammar", "Vocabulary", "Reading", "Use of English", "Communication"],
      hardShareMin: 0.34,
      fipiLinks: {
        codifier: "https://doc.fipi.ru/oge/demoversii-specifikacii-kodifikatory/2026/iya_9_2026.zip",
        specification: "https://doc.fipi.ru/oge/demoversii-specifikacii-kodifikatory/2026/iya_9_2026.zip",
        demo: "https://doc.fipi.ru/oge/demoversii-specifikacii-kodifikatory/2026/iya_9_2026.zip",
        navigator: "https://fipi.ru/navigator-podgotovki/navigator-oge",
      },
    },
  };

  const OFFICIAL_ALIGNMENT_TARGETS = {
    russian: {
      minHardShare: 0.34,
      minMediumHardShare: 0.8,
      minNonSingleShare: 0.28,
    },
    math: {
      minHardShare: 0.34,
      minMediumHardShare: 0.82,
      minNonSingleShare: 0.35,
    },
    physics: {
      minHardShare: 0.34,
      minMediumHardShare: 0.82,
      minNonSingleShare: 0.33,
    },
    english: {
      minHardShare: 0.34,
      minMediumHardShare: 0.8,
      minNonSingleShare: 0.35,
    },
  };

  const OFFICIAL_PACK_FORMAT_VERSION = 1;

  const SUBJECT_TYPE_WEIGHTS = {
    russian: {
      "single-choice": 9,
      "multi-choice": 2,
      "short-text": 4,
      "sequence-order": 3,
      matching: 3,
      "fill-in-the-blank": 4,
      "extended-answer-lite": 3,
    },
    math: {
      "single-choice": 8,
      "multi-choice": 1,
      "short-text": 3,
      "numeric-input": 8,
      "sequence-order": 3,
      matching: 2,
      "fill-in-the-blank": 2,
      "extended-answer-lite": 3,
    },
    physics: {
      "single-choice": 8,
      "multi-choice": 1,
      "short-text": 4,
      "numeric-input": 7,
      "sequence-order": 2,
      matching: 4,
      "fill-in-the-blank": 3,
      "extended-answer-lite": 3,
    },
    english: {
      "single-choice": 7,
      "multi-choice": 2,
      "short-text": 4,
      "sequence-order": 2,
      matching: 3,
      "fill-in-the-blank": 4,
      "extended-answer-lite": 5,
    },
  };

  const SUBJECT_BLUEPRINTS = {
    russian: {
      subject: "russian",
      defaultModel: "subjectModel",
      models: {
        mixedTrainer: {
          key: "mixedTrainer",
          title: "Смешанный экзамен-тренажер",
          resultMode: "instant+final",
          rules: {
            timerBySubjectDefault: true,
            showHintsDuringSession: false,
          },
        },
        subjectModel: {
          key: "subjectModel",
          title: "Экзамен по модели предмета",
          resultMode: "final-review",
          rules: {
            timerBySubjectDefault: true,
            showHintsDuringSession: false,
          },
          blocks: [
            {
              id: "ru-orth-punct",
              title: "Орфография и пунктуация",
              count: 10,
              segments: ["Орфография", "Пунктуация"],
              difficultyPlan: { basic: 3, medium: 4, hard: 3 },
              allowedTypes: ["single-choice", "multi-choice", "short-text", "fill-in-the-blank"],
              required: true,
            },
            {
              id: "ru-syntax-lex",
              title: "Синтаксис и лексика",
              count: 10,
              segments: ["Синтаксис", "Лексика"],
              difficultyPlan: { basic: 1, medium: 4, hard: 5 },
              allowedTypes: ["single-choice", "multi-choice", "short-text", "sequence-order", "fill-in-the-blank"],
              required: true,
            },
            {
              id: "ru-text",
              title: "Текст и речь",
              count: 10,
              segments: ["Текст и речь"],
              difficultyPlan: { basic: 2, medium: 4, hard: 4 },
              allowedTypes: [
                "single-choice",
                "multi-choice",
                "matching",
                "extended-answer-lite",
                "fill-in-the-blank",
                "short-text",
              ],
              required: true,
            },
          ],
        },
      },
    },
    math: {
      subject: "math",
      defaultModel: "subjectModel",
      models: {
        mixedTrainer: {
          key: "mixedTrainer",
          title: "Смешанный экзамен-тренажер",
          resultMode: "instant+final",
          rules: { timerBySubjectDefault: true, showHintsDuringSession: false },
        },
        subjectModel: {
          key: "subjectModel",
          title: "Экзамен по модели предмета",
          resultMode: "final-review",
          rules: { timerBySubjectDefault: true, showHintsDuringSession: false },
          blocks: [
            {
              id: "ma-core",
              title: "Алгебра и числа",
              count: 12,
              segments: ["Алгебра", "Числа и вычисления"],
              difficultyPlan: { basic: 2, medium: 5, hard: 5 },
              allowedTypes: ["single-choice", "numeric-input", "short-text"],
              required: true,
            },
            {
              id: "ma-geo",
              title: "Геометрия",
              count: 8,
              segments: ["Геометрия"],
              difficultyPlan: { basic: 2, medium: 3, hard: 3 },
              allowedTypes: ["single-choice", "sequence-order", "matching"],
              required: true,
            },
            {
              id: "ma-func-prob",
              title: "Функции, статистика и вероятность",
              count: 10,
              segments: ["Функции и графики", "Вероятность и статистика"],
              difficultyPlan: { basic: 2, medium: 4, hard: 4 },
              allowedTypes: ["single-choice", "numeric-input", "fill-in-the-blank"],
              required: true,
            },
          ],
        },
      },
    },
    physics: {
      subject: "physics",
      defaultModel: "subjectModel",
      models: {
        mixedTrainer: {
          key: "mixedTrainer",
          title: "Смешанный экзамен-тренажер",
          resultMode: "instant+final",
          rules: { timerBySubjectDefault: true, showHintsDuringSession: false },
        },
        subjectModel: {
          key: "subjectModel",
          title: "Экзамен по модели предмета",
          resultMode: "final-review",
          rules: { timerBySubjectDefault: true, showHintsDuringSession: false },
          blocks: [
            {
              id: "ph-mech",
              title: "Механика",
              count: 8,
              segments: ["Механика"],
              difficultyPlan: { basic: 1, medium: 4, hard: 3 },
              allowedTypes: ["single-choice", "numeric-input"],
              required: true,
            },
            {
              id: "ph-mol-el",
              title: "Молекулярная физика и электричество",
              count: 12,
              segments: ["Молекулярная физика", "Электродинамика"],
              difficultyPlan: { basic: 2, medium: 5, hard: 5 },
              allowedTypes: ["single-choice", "numeric-input", "matching", "short-text"],
              required: true,
            },
            {
              id: "ph-opt-exp",
              title: "Оптика и эксперимент",
              count: 10,
              segments: ["Оптика и волны", "Эксперимент и анализ"],
              difficultyPlan: { basic: 3, medium: 3, hard: 4 },
              allowedTypes: [
                "single-choice",
                "sequence-order",
                "fill-in-the-blank",
                "matching",
                "numeric-input",
                "short-text",
                "extended-answer-lite",
              ],
              required: true,
            },
          ],
        },
      },
    },
    english: {
      subject: "english",
      defaultModel: "subjectModel",
      models: {
        mixedTrainer: {
          key: "mixedTrainer",
          title: "Смешанный экзамен-тренажер",
          resultMode: "instant+final",
          rules: { timerBySubjectDefault: true, showHintsDuringSession: false },
        },
        subjectModel: {
          key: "subjectModel",
          title: "Экзамен по модели предмета",
          resultMode: "final-review",
          rules: { timerBySubjectDefault: true, showHintsDuringSession: false },
          blocks: [
            {
              id: "en-grammar",
              title: "Grammar and Use",
              count: 12,
              segments: ["Grammar", "Use of English"],
              difficultyPlan: { basic: 2, medium: 4, hard: 6 },
              allowedTypes: ["single-choice", "fill-in-the-blank", "short-text", "multi-choice"],
              required: true,
            },
            {
              id: "en-vocab-read",
              title: "Vocabulary and Reading",
              count: 10,
              segments: ["Vocabulary", "Reading"],
              difficultyPlan: { basic: 2, medium: 4, hard: 4 },
              allowedTypes: [
                "single-choice",
                "matching",
                "sequence-order",
                "multi-choice",
                "short-text",
              ],
              required: true,
            },
            {
              id: "en-comm",
              title: "Communication",
              count: 8,
              segments: ["Communication"],
              difficultyPlan: { basic: 2, medium: 3, hard: 3 },
              allowedTypes: ["single-choice", "extended-answer-lite"],
              required: true,
            },
          ],
        },
      },
    },
  };

  const SUBJECT_EXAM_PROFILES = {
    russian: {
      exact: {
        orderPolicy: "fixed-by-block",
        timing: {
          recommendedMinutes: 235,
          warningAtMinutes: 30,
        },
        scoring: {
          objectiveShare: 0.8,
          rubricLiteShare: 0.2,
          note: "Развернутые задания оцениваются как учебная самопроверка по чек-листу.",
        },
        resultDisplay: {
          instant: false,
          finalDetailedReview: true,
          showRubricNotice: true,
        },
      },
      training: {
        orderPolicy: "balanced-randomized",
        timing: {
          recommendedMinutes: 210,
          warningAtMinutes: 25,
        },
        scoring: {
          objectiveShare: 0.75,
          rubricLiteShare: 0.25,
          note: "Оценка развёрнутых ответов ориентировочная, используйте чек-лист самопроверки.",
        },
        resultDisplay: {
          instant: false,
          finalDetailedReview: true,
          showRubricNotice: true,
        },
      },
    },
    math: {
      exact: {
        orderPolicy: "fixed-by-block",
        timing: {
          recommendedMinutes: 235,
          warningAtMinutes: 30,
        },
        scoring: {
          objectiveShare: 0.9,
          rubricLiteShare: 0.1,
          note: "Сложные задания проверяются автоматически частично, сверяйте решение с разбором.",
        },
        resultDisplay: {
          instant: false,
          finalDetailedReview: true,
          showRubricNotice: true,
        },
      },
      training: {
        orderPolicy: "balanced-randomized",
        timing: {
          recommendedMinutes: 200,
          warningAtMinutes: 25,
        },
        scoring: {
          objectiveShare: 0.85,
          rubricLiteShare: 0.15,
          note: "Часть заданий с развернутым ответом имеет формат учебной самопроверки.",
        },
        resultDisplay: {
          instant: false,
          finalDetailedReview: true,
          showRubricNotice: true,
        },
      },
    },
    physics: {
      exact: {
        orderPolicy: "fixed-by-block",
        timing: {
          recommendedMinutes: 180,
          warningAtMinutes: 25,
        },
        scoring: {
          objectiveShare: 0.82,
          rubricLiteShare: 0.18,
          note: "Экспериментальные и развернутые ответы оцениваются как ориентировочная учебная проверка.",
        },
        resultDisplay: {
          instant: false,
          finalDetailedReview: true,
          showRubricNotice: true,
        },
      },
      training: {
        orderPolicy: "balanced-randomized",
        timing: {
          recommendedMinutes: 160,
          warningAtMinutes: 20,
        },
        scoring: {
          objectiveShare: 0.78,
          rubricLiteShare: 0.22,
          note: "Используйте чек-лист и образцы для самопроверки развернутых ответов.",
        },
        resultDisplay: {
          instant: false,
          finalDetailedReview: true,
          showRubricNotice: true,
        },
      },
    },
    english: {
      exact: {
        orderPolicy: "fixed-by-block",
        timing: {
          recommendedMinutes: 135,
          warningAtMinutes: 20,
        },
        scoring: {
          objectiveShare: 0.74,
          rubricLiteShare: 0.26,
          note: "Письменные и коммуникативные задания оцениваются как учебная самопроверка.",
        },
        resultDisplay: {
          instant: false,
          finalDetailedReview: true,
          showRubricNotice: true,
        },
      },
      training: {
        orderPolicy: "balanced-randomized",
        timing: {
          recommendedMinutes: 120,
          warningAtMinutes: 15,
        },
        scoring: {
          objectiveShare: 0.68,
          rubricLiteShare: 0.32,
          note: "Устные и письменные ответы в офлайн-режиме дают ориентировочную оценку.",
        },
        resultDisplay: {
          instant: false,
          finalDetailedReview: true,
          showRubricNotice: true,
        },
      },
    },
  };

  function mergeObjects(base, overrides) {
    return {
      ...(base || {}),
      ...(overrides || {}),
    };
  }

  function upgradeBlueprintModels() {
    Object.keys(SUBJECT_BLUEPRINTS).forEach((subjectKey) => {
      const subjectBlueprint = SUBJECT_BLUEPRINTS[subjectKey];
      const models = subjectBlueprint.models || {};
      const base = models.subjectModel || models.mixedTrainer;
      if (!base) {
        return;
      }

      const profile = SUBJECT_EXAM_PROFILES[subjectKey] || {};
      const exactRules = profile.exact || {};
      const trainingRules = profile.training || {};

      const exactModel = {
        ...deepClone(base),
        key: "subjectModelExact",
        title: "Точный экзаменационный макет",
        strictness: "strict",
        resultMode: "final-review",
        rules: mergeObjects(base.rules, {
          timerBySubjectDefault: true,
          showHintsDuringSession: false,
          allowCoverageDeviation: false,
          allowTypeSubstitution: false,
          selfCheckLabel: "учебная самопроверка",
        }),
        examProfile: {
          ...exactRules,
          examLike: true,
        },
      };

      const trainingBlocks = (base.blocks || []).map((block) => ({
        ...block,
        required: block.required !== false,
        count: Math.max(1, block.count),
      }));

      const trainingModel = {
        ...deepClone(base),
        key: "subjectModelTraining",
        title: "Экзаменационная тренировка",
        strictness: "soft",
        resultMode: "final-review",
        blocks: trainingBlocks,
        rules: mergeObjects(base.rules, {
          timerBySubjectDefault: true,
          showHintsDuringSession: false,
          allowCoverageDeviation: true,
          allowTypeSubstitution: true,
          selfCheckLabel: "ориентировочная оценка",
        }),
        examProfile: {
          ...trainingRules,
          examLike: true,
        },
      };

      subjectBlueprint.models.subjectModelExact = exactModel;
      subjectBlueprint.models.subjectModelTraining = trainingModel;
      subjectBlueprint.models.subjectModel = exactModel;
      subjectBlueprint.defaultModel = "subjectModelExact";
    });
  }

  let BLUEPRINT_UPGRADE_ERROR = null;
  try {
    upgradeBlueprintModels();
  } catch (error) {
    BLUEPRINT_UPGRADE_ERROR = error;
    if (global && global.console && typeof global.console.error === "function") {
      global.console.error("QuestionBank blueprint upgrade warning:", error);
    }
  }

  function hashString(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function createRng(seed) {
    let current = seed >>> 0;
    return function random() {
      current += 0x6d2b79f5;
      let t = current;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function randomInt(rng, min, max) {
    return Math.floor(rng() * (max - min + 1)) + min;
  }

  function pick(rng, values) {
    return values[Math.floor(rng() * values.length)];
  }

  function shuffle(values, rng) {
    const result = values.slice();
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function uniqueValues(values) {
    return Array.from(new Set(values));
  }

  function normalizeTextToken(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function normalizeHumanReadableText(value) {
    const source = String(value == null ? "" : value)
      .replace(/\u00a0/g, " ")
      .replace(/\r/g, "");
    if (!source.trim()) {
      return "";
    }

    return source
      .replace(/([,;:!?])([A-Za-zА-Яа-яЁё])/g, "$1 $2")
      .replace(/(?:\b[A-Za-zА-Яа-яЁё]\s+){2,}[A-Za-zА-Яа-яЁё]\b/g, (chunk) =>
        chunk.replace(/\s+/g, ""),
      )
      .replace(/\s+([,.;:!?])/g, "$1")
      .replace(/([(\["«])\s+/g, "$1")
      .replace(/\s+([)\]"»])/g, "$1")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  function optionComparableKey(value) {
    const normalized = normalizeTextToken(value).replace(",", ".");
    if (!normalized) {
      return "";
    }

    const numeric = Number(normalized);
    if (Number.isFinite(numeric)) {
      return `num:${Number(numeric.toFixed(8)).toString()}`;
    }

    return `txt:${normalized}`;
  }

  function isFiniteNumberString(value) {
    const parsed = Number(String(value).replace(",", "."));
    return Number.isFinite(parsed);
  }

  function buildFallbackOption(correctValue, index) {
    const correctText = String(correctValue);
    if (isFiniteNumberString(correctText)) {
      const base = Number(correctText.replace(",", "."));
      const delta = index % 2 === 0 ? index + 1 : -(index + 2);
      return String(Number((base + delta).toFixed(2)));
    }
    return `Неверный вариант ${index + 1}`;
  }

  function makeUniqueOptions(rawOptions) {
    const used = new Set();
    const options = [];
    (rawOptions || []).forEach((option) => {
      const value = String(option).trim();
      const key = optionComparableKey(value);
      if (!key || used.has(key)) {
        return;
      }
      used.add(key);
      options.push(value);
    });
    return options;
  }

  function extractEnumeratedOptionsFromPrompt(prompt) {
    const source = String(prompt || "").replace(/\r/g, "").trim();
    if (!source) {
      return null;
    }

    const markers = [];
    const markerRegex = /\b(\d{1,2})\)/g;
    let match = markerRegex.exec(source);
    while (match) {
      const index = match.index;
      const prev = index > 0 ? source[index - 1] : "";
      if (prev !== "(") {
        markers.push({
          value: Number(match[1]),
          index,
          end: index + match[0].length,
        });
      }
      match = markerRegex.exec(source);
    }

    if (markers.length < 3 || markers[0].value !== 1) {
      return null;
    }

    for (let i = 1; i < markers.length; i += 1) {
      if (markers[i].value !== markers[i - 1].value + 1) {
        return null;
      }
    }

    const promptText = normalizeHumanReadableText(source.slice(0, markers[0].index).replace(/\s+/g, " ").trim());
    const options = markers
      .map((marker, index) => {
        const to = index + 1 < markers.length ? markers[index + 1].index : source.length;
        let optionText = source.slice(marker.end, to).replace(/\s+/g, " ").trim();
        optionText = optionText
          .replace(/^[\-–—:;.,\s]+/, "")
          .replace(/\s*ответ\s*[:：].*$/i, "")
          .trim();
        return normalizeHumanReadableText(optionText);
      })
      .filter(Boolean);

    if (options.length < 3) {
      return null;
    }

    return {
      prompt: promptText || source,
      options: makeUniqueOptions(options),
    };
  }

  function extractOptionIndexesFromAnswerToken(rawValue, optionCount) {
    const value = String(rawValue || "").trim();
    if (!value || !Number.isInteger(optionCount) || optionCount <= 0) {
      return [];
    }

    const tokens = value.match(/\d+/g) || [];
    if (!tokens.length) {
      return [];
    }

    const numbers = [];
    tokens.forEach((token) => {
      if (token.length > 1 && Number(token) > optionCount) {
        token.split("").forEach((digit) => {
          numbers.push(Number(digit));
        });
      } else {
        numbers.push(Number(token));
      }
    });

    return uniqueValues(
      numbers
        .filter((num) => Number.isInteger(num) && num >= 1 && num <= optionCount)
        .map((num) => num - 1),
    );
  }

  function normalizeLegacyEnumeratedChoiceQuestion(inputQuestion) {
    const question = {
      ...(inputQuestion || {}),
    };
    question.prompt = normalizeHumanReadableText(question.prompt || "");
    question.options = Array.isArray(question.options)
      ? question.options.map((item) => normalizeHumanReadableText(item))
      : question.options;

    const parsed = extractEnumeratedOptionsFromPrompt(question.prompt);
    if (!parsed || !parsed.options.length) {
      return question;
    }

    const intentText = normalizeTextToken(parsed.prompt || question.prompt);
    const shouldBeMultiChoice = /варианты ответов|номера ответов|все цифры|все номера|несколько/i.test(intentText);
    question.prompt = parsed.prompt || question.prompt;
    question.options = parsed.options;

    let indexes = [];
    if (Array.isArray(question.correctAnswers) && question.correctAnswers.length) {
      indexes = uniqueValues(
        question.correctAnswers
          .map((index) => Number(index))
          .filter((index) => Number.isInteger(index) && index >= 0 && index < question.options.length),
      );
    } else {
      const sources = [];
      if (question.correctAnswer !== undefined) {
        sources.push(question.correctAnswer);
      }
      if (question.explanation && question.explanation.correctAnswer) {
        sources.push(question.explanation.correctAnswer);
      }
      if (Array.isArray(question.acceptedAnswers)) {
        sources.push(...question.acceptedAnswers);
      }
      indexes = uniqueValues(
        sources
          .flatMap((value) => extractOptionIndexesFromAnswerToken(value, question.options.length))
          .filter((index) => Number.isInteger(index) && index >= 0 && index < question.options.length),
      );
    }

    if (shouldBeMultiChoice || indexes.length > 1) {
      question.type = "multi-choice";
      question.correctAnswers = indexes;
      if (indexes.length === 1) {
        question.correctIndex = indexes[0];
      }
    } else {
      question.type = "single-choice";
      if (indexes.length) {
        question.correctIndex = indexes[0];
      }
    }

    if ((!Array.isArray(question.acceptedAnswers) || !question.acceptedAnswers.length) && indexes.length > 1) {
      const oneBased = indexes.map((index) => index + 1);
      question.acceptedAnswers = uniqueValues([
        oneBased.join(""),
        oneBased.join(" "),
        oneBased.join(","),
      ]).filter(Boolean);
    }

    return question;
  }

  function makeChoiceQuestion(correctValue, distractors, rng) {
    const correctText = String(correctValue).trim();
    const correctKey = optionComparableKey(correctText);
    const seeded = makeUniqueOptions([correctText].concat((distractors || []).map(String)));
    const options = shuffle(seeded.slice(0, 4), rng);
    const containsCorrect = options.some((item) => optionComparableKey(item) === correctKey);

    if (!containsCorrect) {
      if (options.length === 4) {
        options[0] = correctText;
      } else {
        options.push(correctText);
      }
    }

    while (options.length < 4) {
      const candidate = buildFallbackOption(correctValue, options.length);
      const hasCandidate = options.some((item) => optionComparableKey(item) === optionComparableKey(candidate));
      if (!hasCandidate) {
        options.push(candidate);
      } else {
        options.push(`Неверный вариант ${options.length + 2}`);
      }
    }

    const normalizedOptions = makeUniqueOptions(options).slice(0, 4);
    if (!normalizedOptions.some((item) => optionComparableKey(item) === correctKey)) {
      normalizedOptions[0] = correctText;
    }

    return {
      options: normalizedOptions,
      correctIndex: normalizedOptions.findIndex((item) => optionComparableKey(item) === correctKey),
    };
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function scaledPlan(total, baseMap) {
    const entries = Object.entries(baseMap);
    const baseSum = entries.reduce((acc, [, amount]) => acc + amount, 0);
    const parts = entries.map(([key, amount]) => {
      const raw = (amount / baseSum) * total;
      return {
        key,
        floor: Math.floor(raw),
        frac: raw - Math.floor(raw),
      };
    });

    let used = parts.reduce((acc, item) => acc + item.floor, 0);
    let missing = total - used;
    parts.sort((a, b) => b.frac - a.frac);

    let index = 0;
    while (missing > 0) {
      parts[index % parts.length].floor += 1;
      missing -= 1;
      index += 1;
    }

    return Object.fromEntries(parts.map((item) => [item.key, item.floor]));
  }

  const QUESTION_TYPE_META = {
    "single-choice": { answerFormat: "single-select" },
    "multi-choice": { answerFormat: "multi-select" },
    "short-text": { answerFormat: "text" },
    "numeric-input": { answerFormat: "number" },
    "sequence-order": { answerFormat: "ordered-list" },
    matching: { answerFormat: "pair-mapping" },
    "fill-in-the-blank": { answerFormat: "blank-input" },
    "extended-answer-lite": { answerFormat: "textarea-rubric-lite" },
  };

  function defaultExpectedTimeSec(difficulty, type) {
    const baseByDifficulty = {
      basic: 80,
      medium: 120,
      hard: 170,
    };
    const typeAdd = {
      "single-choice": 0,
      "multi-choice": 20,
      "short-text": 30,
      "numeric-input": 25,
      "sequence-order": 35,
      matching: 35,
      "fill-in-the-blank": 30,
      "extended-answer-lite": 120,
    };

    const base = baseByDifficulty[difficulty] || 110;
    return base + (typeAdd[type] || 0);
  }

  function normalizeQuestionType(type) {
    if (QUESTION_TYPE_META[type]) {
      return type;
    }
    return "single-choice";
  }

  function createExplanation(payload) {
    const fallbackRule =
      payload.rule || "Примените ключевое правило этого типа задания и обязательно проверьте граничные случаи.";
    return {
      correctAnswer: payload.correctAnswer,
      why:
        payload.why ||
        "Верный ответ определяется последовательным применением правила к формулировке задания.",
      rule: fallbackRule,
      formula: payload.formula || `Опорное правило: ${fallbackRule}`,
      stepByStep:
        payload.stepByStep ||
        "1) Определите тип задания. 2) Выделите ключевой признак. 3) Примените правило. 4) Проверьте ответ обратной проверкой.",
      commonMistakes:
        payload.commonMistakes ||
        "Типичная ошибка: выбор ответа по интуиции без проверки правила и условий задачи.",
      alternateMethod:
        payload.alternateMethod ||
        "Сделайте короткую альтернативную проверку: подстановка, упрощение формулировки или оценка порядка величины.",
      recognitionTip:
        payload.recognitionTip ||
        "Сначала найдите маркер типа задания (союз, ключевое слово, единицы измерения, грамматический сигнал).",
    };
  }

  const RU_DATA = {
    prePri: [
      {
        sentence: "В отчёте нужно ___поднести факты без эмоций.",
        correct: "преподнести",
        wrong: ["приподнести", "пре-поднести", "придподнести"],
        rule: "ПРЕ- пишется, когда есть значение 'очень' или близость к слову 'пере-'.",
      },
      {
        sentence: "Учитель попросил ___кратить пересказ до трёх предложений.",
        correct: "сократить",
        wrong: ["сакратить", "сокротить", "со-кратить"],
        rule: "Проверяемая безударная гласная в корне подбирается по однокоренному слову 'короткий'.",
      },
      {
        sentence: "Нужно ___бывать на консультации каждую неделю.",
        correct: "пребывать",
        wrong: ["прибывать", "пре-бывать", "прибыввать"],
        rule: "ПРЕБЫВАТЬ = находиться где-то. ПРИБЫВАТЬ = приезжать.",
      },
      {
        sentence: "Перед олимпиадой важно ___умножить усилия.",
        correct: "приумножить",
        wrong: ["преумножить", "при-умножить", "преумножыть"],
        rule: "ПРИ- в значении добавления, присоединения, увеличения количества.",
      },
    ],
    nNn: [
      {
        sentence: "Выберите правильное написание: (организова...) турнир",
        correct: "организованный",
        wrong: ["организованый", "организованнный", "организованныйй"],
        rule: "В полном страдательном причастии прошедшего времени обычно пишется НН.",
      },
      {
        sentence: "Выберите правильное написание: (ветре...) день",
        correct: "ветреный",
        wrong: ["ветренный", "ветрянный", "ветреннный"],
        rule: "Исключение: 'ветреный' пишется с одной Н (кроме слов с приставками: безветренный).",
      },
      {
        sentence: "Выберите правильное написание: (дисциплинирова...) ученик",
        correct: "дисциплинированный",
        wrong: ["дисциплинированый", "дисциплинированнный", "дисциплинировонный"],
        rule: "Отглагольные прилагательные с суффиксом -ованн- пишутся с НН.",
      },
      {
        sentence: "Выберите правильное написание: (ране...) гость",
        correct: "раненый",
        wrong: ["раненный", "раненнай", "раненыйй"],
        rule: "В слове 'раненый' (как качественном признаке) обычно пишется одна Н.",
      },
    ],
    lexical: [
      {
        prompt: "Выберите нормативное словосочетание.",
        correct: "предоставить слово докладчику",
        wrong: ["представить слово докладчику", "предоставить задание на дом", "представить возможность"],
        why: "'Предоставить' = дать возможность или ресурс. 'Представить' = познакомить/показать.",
      },
      {
        prompt: "Выберите предложение без речевой ошибки.",
        correct: "Мы оплатили проезд заранее.",
        wrong: ["Мы оплатили за проезд заранее.", "Мы заплатили стоимость за проездом.", "Мы оплатили за билет."],
        why: "После 'оплатить' предлог 'за' не нужен.",
      },
      {
        prompt: "Выберите правильный вариант управления.",
        correct: "благодаря поддержке команды",
        wrong: ["благодаря поддержку команды", "благодаря поддержкой команды", "благодаря на поддержку команды"],
        why: "Предлог 'благодаря' требует дательного падежа.",
      },
      {
        prompt: "Выберите нормативный вариант.",
        correct: "надеть куртку",
        wrong: ["одеть куртку", "надеть на куртку", "одеть на себя куртку"],
        why: "'Надеть' употребляется с предметом одежды, 'одеть' — с человеком.",
      },
    ],
    textTypes: [
      {
        text: "Сначала мы разобрали условие, затем составили план решения и после этого выполнили вычисления.",
        correct: "повествование",
        wrong: ["описание", "рассуждение", "официально-деловой стиль"],
      },
      {
        text: "Экзамен важен, потому что он показывает уровень подготовки. Следовательно, нужно регулярно тренироваться.",
        correct: "рассуждение",
        wrong: ["описание", "повествование", "разговорный стиль"],
      },
      {
        text: "Класс светлый, просторный, с большими окнами и аккуратными рядами парт.",
        correct: "описание",
        wrong: ["повествование", "рассуждение", "публицистический стиль"],
      },
      {
        text: "Во-первых, тренировка нужна для закрепления навыка. Во-вторых, она уменьшает число случайных ошибок. Значит, регулярность важнее разовых рывков.",
        correct: "рассуждение",
        wrong: ["описание", "повествование", "художественный стиль"],
      },
    ],
    expressiveMeans: [
      {
        sentence: "Ветер выл и стонал за окном.",
        correct: "олицетворение",
        wrong: ["метафора", "эпитет", "сравнение"],
      },
      {
        sentence: "Серебряный смех разливался по коридору.",
        correct: "метафора",
        wrong: ["гипербола", "анафора", "олицетворение"],
      },
      {
        sentence: "Тихий, усталый, задумчивый вечер опустился на город.",
        correct: "эпитет",
        wrong: ["риторический вопрос", "антитеза", "литота"],
      },
      {
        sentence: "Словно птица, мысль взлетела к новой идее.",
        correct: "сравнение",
        wrong: ["метафора", "градация", "метонимия"],
      },
    ],
  };

  const EN_DATA = {
    grammarBasic: [
      {
        prompt: "My sister ___ to music every evening.",
        correct: "listens",
        wrong: ["listen", "is listen", "listened"],
        rule: "Present Simple, 3rd person singular: verb + -s/-es.",
      },
      {
        prompt: "Yesterday we ___ a difficult test.",
        correct: "wrote",
        wrong: ["write", "have written", "are writing"],
        rule: "Past Simple with yesterday.",
      },
      {
        prompt: "Look! They ___ across the street.",
        correct: "are running",
        wrong: ["run", "ran", "have run"],
        rule: "Present Continuous for action happening now.",
      },
      {
        prompt: "She usually ___ her homework before dinner.",
        correct: "does",
        wrong: ["do", "is doing", "did"],
        rule: "Present Simple, 3rd person singular: auxiliary/verb form with -s.",
      },
    ],
    grammarMedium: [
      {
        prompt: "If I ___ enough time, I would revise chemistry too.",
        correct: "had",
        wrong: ["have", "will have", "am having"],
        rule: "Second Conditional: if + Past Simple, would + infinitive.",
      },
      {
        prompt: "The classroom ___ every day before lessons.",
        correct: "is cleaned",
        wrong: ["cleans", "cleaned", "is cleaning"],
        rule: "Present Simple Passive: am/is/are + V3.",
      },
      {
        prompt: "By the time we arrived, the lesson ___ already ___.",
        correct: "had / started",
        wrong: ["has / started", "was / starting", "did / start"],
        rule: "Past Perfect for an action completed before another action in the past.",
      },
      {
        prompt: "If he ___ harder, he would pass the test.",
        correct: "studied",
        wrong: ["studies", "will study", "is studying"],
        rule: "Second Conditional: if + Past Simple, would + infinitive.",
      },
    ],
    vocabulary: [
      {
        prompt: "Choose the correct option: We need to ___ this form carefully.",
        correct: "fill in",
        wrong: ["look after", "turn off", "give up"],
      },
      {
        prompt: "Choose the correct option: Could you ___ me your notes for a day?",
        correct: "lend",
        wrong: ["borrow", "rent", "take"],
      },
      {
        prompt: "Choose the correct option: I usually ___ notes during the lesson.",
        correct: "take",
        wrong: ["do", "make", "get"],
      },
      {
        prompt: "Choose the correct option: Please ___ attention to the instructions.",
        correct: "pay",
        wrong: ["make", "do", "bring"],
      },
    ],
    readingHard: [
      {
        text: "Tom was tired after school, but he still spent an hour revising geometry because he had promised himself not to skip difficult topics.",
        question: "What was Tom's main motivation?",
        correct: "He wanted to keep his own commitment.",
        wrong: [
          "He had to copy homework from friends.",
          "His teacher forced him to stay at school.",
          "He preferred geometry to every other subject.",
        ],
      },
      {
        text: "Nina first looked at all answer options, then highlighted key words in the task, and only after that read the text in detail.",
        question: "Which strategy did Nina use?",
        correct: "She planned her reading before deep reading.",
        wrong: [
          "She translated every sentence word by word.",
          "She guessed answers without reading.",
          "She skipped the options until the end.",
        ],
      },
      {
        text: "The article says that short daily practice is usually more effective than one long session once a week.",
        question: "What does the article suggest?",
        correct: "Regular short practice gives better results.",
        wrong: [
          "Long sessions are always the best method.",
          "Practice frequency does not matter.",
          "Weekly practice should be avoided completely.",
        ],
      },
      {
        text: "The coach advised students to analyze each mistake right after practice because delayed analysis often leads to repeating the same error.",
        question: "Why did the coach recommend immediate analysis?",
        correct: "It helps prevent repeating the same mistakes.",
        wrong: [
          "It saves time by skipping correction.",
          "It replaces the need for practice.",
          "It makes tasks easier automatically.",
        ],
      },
    ],
    communicationHard: [
      {
        prompt: "Choose the best reply: 'Could you explain this rule once again, please?'",
        correct: "Sure, let's go through it step by step.",
        wrong: [
          "No, I explained it yesterday.",
          "I am explain this now.",
          "You must to understand immediately.",
        ],
      },
      {
        prompt: "Choose the best way to politely disagree:",
        correct: "I see your point, but I think there is another way to solve it.",
        wrong: [
          "You are absolutely wrong, stop it.",
          "No sense, your idea bad.",
          "I don't agree because yes.",
        ],
      },
      {
        prompt: "Choose the best sentence for an email to a teacher:",
        correct: "Could you please clarify the homework task for tomorrow?",
        wrong: [
          "Tell me what to do tomorrow asap.",
          "I need homework. send now.",
          "You didn't explain anything in class.",
        ],
      },
      {
        prompt: "Choose the most polite request in class:",
        correct: "Excuse me, could you repeat the last point, please?",
        wrong: [
          "Repeat it now.",
          "Say it again, I didn't listen.",
          "You must repeat because I missed it.",
        ],
      },
    ],
  };

  function numericDistractors(answer, rng, minDelta, maxDelta) {
    const used = new Set([answer]);
    while (used.size < 4) {
      let delta = randomInt(rng, minDelta, maxDelta);
      if (rng() > 0.5) {
        delta *= -1;
      }
      if (delta === 0) {
        continue;
      }
      used.add(Number((answer + delta).toFixed(2)));
    }
    return Array.from(used).filter((value) => value !== answer);
  }

  function russianFactories() {
    return [
      {
        key: "ru-pre-pri",
        segment: "Орфография",
        topic: "Приставки ПРЕ/ПРИ и словарные случаи",
        subtopic: "Смысловые оттенки и словарные слова",
        difficulty: "medium",
        examBlueprintTag: "RU-ORTH-PP-2026",
        build(rng) {
          const entry = pick(rng, RU_DATA.prePri);
          const data = makeChoiceQuestion(entry.correct, entry.wrong, rng);
          return {
            prompt: entry.sentence,
            options: data.options,
            correctIndex: data.correctIndex,
            explanation: createExplanation({
              correctAnswer: entry.correct,
              why: `Нужна форма «${entry.correct}», потому что учитывается точное лексическое значение слова в контексте.`,
              rule: entry.rule,
              stepByStep:
                "1) Определи значение слова по контексту. 2) Сопоставь с правилом по приставке/корню. 3) Отбрось варианты с орфографическими и словообразовательными нарушениями.",
              commonMistakes:
                "Часто выбирают вариант по звучанию, не проверяя значение слова и его словарную форму.",
              alternateMethod:
                "Проверь однокоренные слова и попробуй заменить слово синонимом: если значение теряется, форма выбрана неверно.",
              recognitionTip:
                "Если сомневаешься между похожими вариантами, сначала проверяй смысл, потом орфографию.",
            }),
          };
        },
      },
      {
        key: "ru-n-nn",
        segment: "Орфография",
        topic: "Н/НН в причастиях и прилагательных",
        subtopic: "Суффиксы и исключения",
        difficulty: "medium",
        examBlueprintTag: "RU-ORTH-NN-2026",
        build(rng) {
          const entry = pick(rng, RU_DATA.nNn);
          const data = makeChoiceQuestion(entry.correct, entry.wrong, rng);
          return {
            prompt: entry.sentence,
            options: data.options,
            correctIndex: data.correctIndex,
            explanation: createExplanation({
              correctAnswer: entry.correct,
              why: `Верный вариант: «${entry.correct}».`,
              rule: entry.rule,
              stepByStep:
                "1) Определи, это причастие или прилагательное. 2) Проверь наличие зависимых слов/суффиксов. 3) Примени правило Н/НН или исключение.",
              commonMistakes:
                "Ученики механически ставят НН во всех 'длинных' словах и забывают про исключения типа 'ветреный'.",
              alternateMethod:
                "Подбери исходный глагол и посмотри, сохраняется ли признак действия: это помогает отличить причастие от прилагательного.",
              recognitionTip:
                "Если есть суффиксы -ованн-, -еванн-, чаще всего это НН.",
            }),
          };
        },
      },
      {
        key: "ru-punctuation-intro",
        segment: "Пунктуация",
        topic: "Вводные слова и конструкции",
        subtopic: "Запятые при вводных словах",
        difficulty: "medium",
        examBlueprintTag: "RU-PUNCT-INTRO-2026",
        build(rng) {
          const stem = pick(rng, [
            "К сожалению мы не успели проверить черновик.",
            "Во-первых нужно внимательно прочитать условие.",
            "Однако по словам учителя решение можно упростить.",
          ]);

          const variants = {
            "К сожалению мы не успели проверить черновик.": {
              correct: "К сожалению, мы не успели проверить черновик.",
              wrong: [
                "К сожалению мы, не успели проверить черновик.",
                "К, сожалению мы не успели проверить черновик.",
                "К сожалению мы не успели, проверить черновик.",
              ],
            },
            "Во-первых нужно внимательно прочитать условие.": {
              correct: "Во-первых, нужно внимательно прочитать условие.",
              wrong: [
                "Во первых нужно внимательно прочитать условие.",
                "Во-первых нужно внимательно прочитать условие.",
                "Во, первых, нужно внимательно прочитать условие.",
              ],
            },
            "Однако по словам учителя решение можно упростить.": {
              correct: "Однако, по словам учителя, решение можно упростить.",
              wrong: [
                "Однако по словам учителя, решение можно упростить.",
                "Однако по словам учителя решение, можно упростить.",
                "Однако, по словам учителя решение можно упростить.",
              ],
            },
          };

          const variant = variants[stem];
          const data = makeChoiceQuestion(variant.correct, variant.wrong, rng);

          return {
            prompt: "Выберите предложение с правильной пунктуацией.",
            options: data.options,
            correctIndex: data.correctIndex,
            explanation: createExplanation({
              correctAnswer: variant.correct,
              why: "Вводные слова/конструкции не являются членами предложения и выделяются запятыми.",
              rule:
                "Вводные слова ('к сожалению', 'во-первых', 'по словам...') отделяются запятыми. Нужно также учитывать структуру всей фразы.",
              stepByStep:
                "1) Найди вводную конструкцию. 2) Проверь, можно ли убрать её без потери грамматики. 3) Выдели запятыми с нужных сторон.",
              commonMistakes:
                "Либо не ставят запятые, либо ставят их внутри устойчивой вводной конструкции ('во, первых').",
              alternateMethod:
                "Прочитай предложение без вводной конструкции: если грамматика сохраняется, конструкция вводная и должна обособляться.",
              recognitionTip:
                "Если выражение передает отношение говорящего ('к счастью', 'вероятно'), чаще всего это вводное слово.",
            }),
          };
        },
      },
      {
        key: "ru-punctuation-hard",
        segment: "Пунктуация",
        topic: "Сложные предложения",
        subtopic: "Комбинированные случаи с союзами",
        difficulty: "hard",
        examBlueprintTag: "RU-PUNCT-COMBO-2026",
        build(rng) {
          const base = pick(rng, [
            {
              correct: "Когда закончилась контрольная, мы вышли в коридор, и учитель объяснил типичные ошибки.",
              wrong: [
                "Когда закончилась контрольная мы вышли в коридор и учитель объяснил типичные ошибки.",
                "Когда закончилась контрольная, мы вышли в коридор и, учитель объяснил типичные ошибки.",
                "Когда закончилась контрольная; мы вышли в коридор, и учитель объяснил типичные ошибки.",
              ],
            },
            {
              correct: "Если решение кажется длинным, проверь, не пропущен ли более короткий путь, и только потом переписывай ответ.",
              wrong: [
                "Если решение кажется длинным проверь не пропущен ли более короткий путь, и только потом переписывай ответ.",
                "Если решение кажется длинным, проверь не пропущен ли более короткий путь и только потом переписывай ответ.",
                "Если решение кажется длинным: проверь, не пропущен ли более короткий путь и только потом переписывай ответ.",
              ],
            },
            {
              correct: "Мы понимали, что времени мало, поэтому распределили задания так, чтобы успеть проверить трудные номера.",
              wrong: [
                "Мы понимали что времени мало поэтому распределили задания так чтобы успеть проверить трудные номера.",
                "Мы понимали, что времени мало поэтому распределили задания так, чтобы успеть проверить трудные номера.",
                "Мы понимали: что времени мало, поэтому распределили задания так чтобы успеть проверить трудные номера.",
              ],
            },
          ]);

          const data = makeChoiceQuestion(base.correct, base.wrong, rng);
          return {
            prompt: "Выберите предложение с корректной расстановкой знаков препинания.",
            options: data.options,
            correctIndex: data.correctIndex,
            explanation: createExplanation({
              correctAnswer: base.correct,
              why: "Знаки препинания ставятся по границам частей сложного предложения и внутри придаточных конструкций.",
              rule:
                "Нужно различать сочинительные и подчинительные связи: перед 'что', 'если', 'чтобы' обычно нужна запятая; между частями сложного предложения с союзом 'и' запятая ставится по структуре.",
              stepByStep:
                "1) Найди грамматические основы. 2) Определи тип связи между частями. 3) Проверь, где начинается и заканчивается придаточная часть.",
              commonMistakes:
                "Часто пропускают запятую перед союзом 'что' или ставят лишнюю запятую после 'и'.",
              alternateMethod:
                "Разбей предложение на короткие смысловые блоки и проговори вслух: границы блоков обычно совпадают с пунктуационными узлами.",
              recognitionTip:
                "Если встречаются сразу несколько союзов ('что', 'чтобы', 'поэтому'), это почти всегда комбинированный пунктуационный случай.",
            }),
          };
        },
      },
      {
        key: "ru-punctuation-bsp-hard",
        segment: "Пунктуация",
        topic: "Бессоюзное и сложноподчиненное предложение",
        subtopic: "Границы частей и знаки связи",
        difficulty: "hard",
        examBlueprintTag: "RU-PUNCT-BSP-2026",
        build(rng) {
          const item = pick(rng, [
            {
              correct:
                "Мы проверили черновик: в решении не хватало одного шага, поэтому ответ не совпал.",
              wrong: [
                "Мы проверили черновик, в решении не хватало одного шага поэтому ответ не совпал.",
                "Мы проверили черновик: в решении не хватало одного шага поэтому, ответ не совпал.",
                "Мы проверили черновик; в решении не хватало одного шага, поэтому ответ не совпал.",
              ],
            },
            {
              correct:
                "Я понял, что допустил ошибку, когда повторно подставил ответ в исходное уравнение.",
              wrong: [
                "Я понял что допустил ошибку, когда повторно подставил ответ в исходное уравнение.",
                "Я понял, что допустил ошибку когда повторно подставил ответ, в исходное уравнение.",
                "Я понял: что допустил ошибку, когда повторно подставил ответ в исходное уравнение.",
              ],
            },
            {
              correct:
                "Экзамен приближался, и мы распределили темы так, чтобы каждый день закрывать слабые разделы.",
              wrong: [
                "Экзамен приближался и мы распределили темы так чтобы каждый день закрывать слабые разделы.",
                "Экзамен приближался, и мы распределили темы, так чтобы каждый день закрывать слабые разделы.",
                "Экзамен приближался: и мы распределили темы так, чтобы каждый день закрывать слабые разделы.",
              ],
            },
          ]);

          const data = makeChoiceQuestion(item.correct, item.wrong, rng);
          return {
            prompt: "Выберите предложение с верной пунктуацией в комбинированной конструкции.",
            options: data.options,
            correctIndex: data.correctIndex,
            explanation: createExplanation({
              correctAnswer: item.correct,
              why: "Знаки препинания определяются по границам грамматических частей и типу связи между ними.",
              rule:
                "Перед союзами 'что', 'когда', 'чтобы', а также на стыке частей сложного предложения ставятся знаки по структуре связи.",
              formula:
                "Алгоритм: выделить основы -> определить тип связи (сочинение/подчинение/бессоюзие) -> расставить знаки по границам.",
              stepByStep:
                "1) Найдите грамматические основы. 2) Отделите придаточные части. 3) Определите, где нужна запятая, а где двоеточие/точка с запятой недопустимы.",
              commonMistakes:
                "Пропуск запятой перед подчинительным союзом и лишняя запятая внутри цельного оборота.",
              alternateMethod:
                "Разбейте предложение на короткие блоки и проверьте, можно ли переставить их без потери смысла: границы блоков дают пунктуацию.",
              recognitionTip:
                "Если в одном предложении встречаются и союзная, и бессоюзная связь, это почти всегда задание повышенной сложности.",
            }),
          };
        },
      },
      {
        key: "ru-syntax-base",
        segment: "Синтаксис",
        topic: "Грамматическая основа",
        subtopic: "Подлежащее и сказуемое",
        difficulty: "medium",
        examBlueprintTag: "RU-SYN-BASIS-2026",
        build(rng) {
          const options = pick(rng, [
            {
              sentence: "Вечером в библиотеке ученики повторяли формулы.",
              correct: "ученики повторяли",
              wrong: ["вечером в библиотеке", "повторяли формулы", "в библиотеке ученики"],
            },
            {
              sentence: "После консультации стало гораздо понятнее, как решать задачу.",
              correct: "стало понятнее",
              wrong: ["после консультации", "как решать", "гораздо понятнее"],
            },
            {
              sentence: "Новый вариант показался сложным, но интересным.",
              correct: "вариант показался",
              wrong: ["новый вариант", "сложным, но интересным", "показался сложным"],
            },
          ]);

          const data = makeChoiceQuestion(options.correct, options.wrong, rng);
          return {
            prompt: `Укажите грамматическую основу предложения: «${options.sentence}»`,
            options: data.options,
            correctIndex: data.correctIndex,
            explanation: createExplanation({
              correctAnswer: options.correct,
              why: "Грамматическая основа включает подлежащее и сказуемое (или один главный член в односоставном предложении).",
              rule:
                "Второстепенные члены (обстоятельства, дополнения, определения) не входят в основу.",
              stepByStep:
                "1) Найди слово, обозначающее действие/состояние. 2) Определи, кто/что это действие выполняет. 3) Проверь, что сочетание образует грамматический центр.",
              commonMistakes:
                "Берут только сказуемое без подлежащего или принимают обстоятельство за часть основы.",
              alternateMethod:
                "Задай вопрос от сказуемого: кто? что? Это помогает быстро обнаружить подлежащее.",
              recognitionTip:
                "Если есть тире или вводные слова, это не отменяет поиск обычного грамматического центра.",
            }),
          };
        },
      },
      {
        key: "ru-syntax-hard",
        segment: "Синтаксис",
        topic: "Грамматические нормы",
        subtopic: "Поиск синтаксической ошибки",
        difficulty: "hard",
        examBlueprintTag: "RU-SYN-ERROR-2026",
        build(rng) {
          const set = pick(rng, [
            {
              prompt: "В каком предложении есть грамматическая ошибка?",
              correct: "Слушая объяснение, у меня возник вопрос.",
              wrong: [
                "Слушая объяснение, я записывал ключевые формулы.",
                "Когда урок закончился, мы обсудили ошибки.",
                "Проверив ответы, ученик исправил неточности.",
              ],
              why: "Деепричастный оборот должен относиться к подлежащему. В ошибочном предложении действующее лицо не названо корректно.",
            },
            {
              prompt: "Укажите предложение с нарушением связи между подлежащим и сказуемым.",
              correct: "Большинство учеников решили задачу правильно и записали ответ в бланк.",
              wrong: [
                "Большинство учеников решило задачу правильно.",
                "Многие ученики решили задачу правильно.",
                "Часть класса решила задачу правильно.",
              ],
              why: "Слово 'большинство' требует согласования в форме единственного числа в официальной норме данного контекста.",
            },
          ]);

          const data = makeChoiceQuestion(set.correct, set.wrong, rng);
          return {
            prompt: set.prompt,
            options: data.options,
            correctIndex: data.correctIndex,
            explanation: createExplanation({
              correctAnswer: set.correct,
              why: set.why,
              rule:
                "Проверяйте, кто совершает действие в предложении, и корректно ли согласованы формы сказуемого с подлежащим.",
              stepByStep:
                "1) Найди грамматический центр. 2) Проверь, совпадает ли исполнитель действия в оборотах и основной части. 3) Оцени согласование числа/рода.",
              commonMistakes:
                "Смотрят только на лексику и не проверяют грамматические связи между частями предложения.",
              alternateMethod:
                "Перефразируй предложение в более простую структуру. Ошибка обычно сразу становится заметной.",
              recognitionTip:
                "Деепричастные обороты и слова 'большинство/ряд/часть' часто дают пограничные случаи в ОГЭ.",
            }),
          };
        },
      },
      {
        key: "ru-lex-basic",
        segment: "Лексика",
        topic: "Лексическая норма",
        subtopic: "Паронимы и управление",
        difficulty: "medium",
        examBlueprintTag: "RU-LEX-NORM-2026",
        build(rng) {
          const entry = pick(rng, RU_DATA.lexical);
          const data = makeChoiceQuestion(entry.correct, entry.wrong, rng);
          return {
            prompt: entry.prompt,
            options: data.options,
            correctIndex: data.correctIndex,
            explanation: createExplanation({
              correctAnswer: entry.correct,
              why: entry.why,
              rule:
                "Лексическая норма определяется словарным значением слова и типичным управлением в устойчивых сочетаниях.",
              stepByStep:
                "1) Сверь значение ключевого слова. 2) Проверь, сочетается ли оно с зависимыми словами. 3) Убери варианты с нарушением управления.",
              commonMistakes:
                "Смешение паронимов ('представить/предоставить') и лишние предлоги ('оплатить за').",
              alternateMethod:
                "Замени ключевой глагол синонимом и проверь, сохраняется ли тот же предлог и форма слова.",
              recognitionTip:
                "Если фраза звучит 'разговорно', проверь её по нормам управления — там часто скрывается ошибка.",
            }),
          };
        },
      },
      {
        key: "ru-text-medium",
        segment: "Текст и речь",
        topic: "Тип речи",
        subtopic: "Описание, повествование, рассуждение",
        difficulty: "medium",
        examBlueprintTag: "RU-TEXT-TYPE-2026",
        build(rng) {
          const item = pick(rng, RU_DATA.textTypes);
          const data = makeChoiceQuestion(item.correct, item.wrong, rng);
          return {
            prompt: `Определите тип речи фрагмента: «${item.text}»`,
            options: data.options,
            correctIndex: data.correctIndex,
            explanation: createExplanation({
              correctAnswer: item.correct,
              why: "Тип речи определяется доминирующей коммуникативной задачей: рассказ о событиях, характеристика признаков или доказательство мысли.",
              rule:
                "Повествование — цепочка действий; описание — признаки предмета/состояния; рассуждение — тезис, аргументы, вывод.",
              stepByStep:
                "1) Определи, что преобладает: действия, признаки или логические связки. 2) Найди маркеры ('сначала', 'потому что', 'следовательно'). 3) Сопоставь с типом речи.",
              commonMistakes:
                "Относят любой текст с несколькими глаголами к повествованию, игнорируя логические связки рассуждения.",
              alternateMethod:
                "Спроси себя: на какой вопрос отвечает фрагмент — 'что происходит?', 'какой?', 'почему?'.",
              recognitionTip:
                "Слова 'потому что', 'следовательно', 'итак' почти всегда указывают на рассуждение.",
            }),
          };
        },
      },
      {
        key: "ru-text-hard",
        segment: "Текст и речь",
        topic: "Средства выразительности",
        subtopic: "Пограничные случаи",
        difficulty: "hard",
        examBlueprintTag: "RU-TEXT-MEANS-2026",
        build(rng) {
          const item = pick(rng, RU_DATA.expressiveMeans);
          const data = makeChoiceQuestion(item.correct, item.wrong, rng);
          return {
            prompt: `Какое средство выразительности использовано в фразе: «${item.sentence}»?`,
            options: data.options,
            correctIndex: data.correctIndex,
            explanation: createExplanation({
              correctAnswer: item.correct,
              why: "Определяется по тому, какой перенос значения использует автор и какие признаки выделяет.",
              rule:
                "Олицетворение — признак живого у неживого; метафора — скрытое сравнение; эпитет — образное определение.",
              stepByStep:
                "1) Найди ключевое образное слово. 2) Определи, есть ли перенос на основе сходства/очеловечивания. 3) Сопоставь с термином.",
              commonMistakes:
                "Путают эпитет с метафорой и называют любое яркое слово 'метафорой'.",
              alternateMethod:
                "Попробуй заменить образное выражение нейтральным: это покажет, какой именно прием использован.",
              recognitionTip:
                "Если неживой объект 'говорит', 'стонет', 'помнит' — чаще всего это олицетворение.",
            }),
          };
        },
      },
      {
        key: "ru-orth-basic",
        segment: "Орфография",
        topic: "Словарные слова и орфограммы",
        subtopic: "Типичные ошибки в ОГЭ",
        difficulty: "basic",
        examBlueprintTag: "RU-ORTH-WORD-2026",
        build(rng) {
          const entry = pick(rng, [
            {
              correct: "дисциплина",
              wrong: ["дисцеплина", "дисциплинна", "дисцыплина"],
            },
            {
              correct: "комментарий",
              wrong: ["коментарий", "камментарий", "комментраий"],
            },
            {
              correct: "претендент",
              wrong: ["притендент", "претендет", "претиндент"],
            },
            {
              correct: "оптимальный",
              wrong: ["аптимальный", "оптемальный", "оптимальнный"],
            },
          ]);
          const data = makeChoiceQuestion(entry.correct, entry.wrong, rng);
          return {
            prompt: "Выберите слово с правильным написанием.",
            options: data.options,
            correctIndex: data.correctIndex,
            explanation: createExplanation({
              correctAnswer: entry.correct,
              why: "Это нормативная словарная форма.",
              rule:
                "Часть орфограмм проверяется только словарем и регулярной практикой: такие слова нужно запоминать в типичных контекстах.",
              stepByStep:
                "1) Отбрось варианты с явными лишними буквами/удвоениями. 2) Сверь с известной словарной формой. 3) Зафиксируй слово в личном списке трудных.",
              commonMistakes:
                "Ориентация только на звучание приводит к ошибкам в безударных позициях.",
              alternateMethod:
                "Составь короткую фразу с этим словом и повтори её несколько раз: контекстное запоминание работает лучше одиночного.",
              recognitionTip:
                "Если слово часто встречается в учебных инструкциях, добавь его в 'словник ОГЭ'.",
            }),
          };
        },
      },
      {
        key: "ru-lex-hard",
        segment: "Лексика",
        topic: "Типичные ловушки ОГЭ",
        subtopic: "Правдоподобные дистракторы",
        difficulty: "hard",
        examBlueprintTag: "RU-LEX-TRAPS-2026",
        build(rng) {
          const entry = pick(rng, [
            {
              prompt: "Выберите вариант без речевой избыточности.",
              correct: "Мы обсудили основную мысль текста.",
              wrong: [
                "Мы обсудили основную главную мысль текста.",
                "Мы обсудили мысль текста основную главную.",
                "Мы обсудили главную суть мысли текста.",
              ],
            },
            {
              prompt: "Выберите нормативное выражение.",
              correct: "играть роль в проекте",
              wrong: ["играть значение в проекте", "иметь роль на проект", "выполнять роль значение"],
            },
            {
              prompt: "Выберите предложение без смысловой неточности.",
              correct: "Аргумент ученика оказался убедительным.",
              wrong: [
                "Аргумент ученика оказался доказательным.",
                "Аргумент ученика оказался доказанным и убедительным по смыслу доказательства аргумента.",
                "Аргумент ученика оказался убеждательным.",
              ],
            },
          ]);
          const data = makeChoiceQuestion(entry.correct, entry.wrong, rng);
          return {
            prompt: entry.prompt,
            options: data.options,
            correctIndex: data.correctIndex,
            explanation: createExplanation({
              correctAnswer: entry.correct,
              why: "Норма требует точного лексического значения и отсутствия лишних повторов смысла.",
              rule:
                "Тавтология и плеоназм считаются речевыми недочетами, если дублируют уже выраженный смысл.",
              stepByStep:
                "1) Проверь, нет ли смысловых дублей. 2) Оцени точность словоупотребления. 3) Удали варианты с искусственно 'усиленными' конструкциями.",
              commonMistakes:
                "Выбирают длинный и 'умный' вариант, хотя он содержит плеоназм.",
              alternateMethod:
                "Сократи каждое предложение до основы: если смысл не меняется, лишние слова были ошибочными.",
              recognitionTip:
                "Сочетания типа 'основная главная', 'первый дебют', 'предварительно заранее' почти всегда ошибочны.",
            }),
          };
        },
      },
      {
        key: "ru-punct-multi-hard",
        singleUse: true,
        segment: "Пунктуация",
        topic: "Сложные случаи постановки запятых",
        subtopic: "Выбор нескольких верных утверждений",
        difficulty: "hard",
        examBlueprintTag: "RU-PUNCT-MULTI-2026",
        build(rng) {
          const options = [
            "Если не успеешь, позвони мне сразу.",
            "Когда закончился урок мы сразу обсудили ошибки.",
            "Мы знали, что времени мало, и поэтому начали раньше.",
            "Во первых нужно перечитать условие.",
          ];
          const correctAnswers = [0, 2];

          return {
            type: "multi-choice",
            format: "multi-select",
            skill: "Применение пунктуационных правил в сложных конструкциях",
            expectedTimeSec: 190,
            sourceHint: "Учебный банк: комбинированные пунктуационные ловушки",
            prompt:
              "Выберите ВСЕ предложения, где пунктуация оформлена правильно.",
            options,
            correctAnswers,
            explanation: createExplanation({
              correctAnswer: "1 и 3",
              why: "В 1 и 3 знаки соответствуют структуре предложений; в 2 и 4 пропущены обязательные запятые.",
              rule:
                "Перед придаточными союзами ('когда', 'если', 'что') и во вводных конструкциях знаки ставятся по синтаксическим границам.",
              formula:
                "Проверка: грамматические основы -> тип связи -> позиция союза/вводного слова -> знак препинания.",
              stepByStep:
                "1) Для каждого варианта найдите основы. 2) Определите союзную/бессоюзную связь. 3) Отметьте, где запятая обязательна, а где лишняя.",
              commonMistakes:
                "Выбор только одного варианта в multi-choice и игнорирование формулировки 'все правильные'.",
              alternateMethod:
                "Прочитайте каждое предложение без пауз: в местах логических стыков появятся нужные знаки.",
              recognitionTip:
                "Если задание просит 'все правильные', сначала исключайте очевидно неверные, потом сверяйте оставшиеся с правилами.",
            }),
            tags: ["multi-choice", "punctuation", "syntax"],
          };
        },
      },
      {
        key: "ru-sequence-medium",
        singleUse: true,
        segment: "Текст и речь",
        topic: "Логика рассуждения",
        subtopic: "Порядок смысловых шагов",
        difficulty: "medium",
        examBlueprintTag: "RU-TEXT-SEQUENCE-2026",
        build(rng) {
          const items = [
            { id: "a", label: "Сформулировать тезис." },
            { id: "b", label: "Привести аргумент с примером." },
            { id: "c", label: "Сделать промежуточный вывод." },
            { id: "d", label: "Сформулировать итоговый вывод." },
          ];

          return {
            type: "sequence-order",
            format: "ordered-list",
            skill: "Построение связного аргументированного текста",
            expectedTimeSec: 170,
            sourceHint: "Навык композиции рассуждения",
            prompt:
              "Расположите шаги построения рассуждения в правильном порядке.",
            sequenceItems: shuffle(items, rng),
            correctSequence: ["a", "b", "c", "d"],
            explanation: createExplanation({
              correctAnswer: "a -> b -> c -> d",
              why: "Рассуждение строится от тезиса к аргументации и затем к выводам.",
              rule:
                "Классическая композиция: тезис -> доказательство -> частный вывод -> общий вывод.",
              formula:
                "Структурная модель: T -> A -> C1 -> C2 (thesis -> argument -> conclusion -> final conclusion).",
              stepByStep:
                "1) Найдите стартовую позицию (тезис). 2) Добавьте доказательство. 3) Поставьте промежуточный вывод. 4) Завершите общим выводом.",
              commonMistakes:
                "Ставят итоговый вывод раньше аргумента и теряют причинно-следственную логику.",
              alternateMethod:
                "Спросите для каждого пункта: 'может ли это быть первым/последним предложением текста?'",
              recognitionTip:
                "Если пункт содержит слова 'итак', 'следовательно', он почти всегда ближе к концу.",
            }),
            tags: ["sequence", "text-logic", "composition"],
          };
        },
      },
      {
        key: "ru-extended-lite-hard",
        singleUse: true,
        segment: "Текст и речь",
        topic: "Мини-аргументация",
        subtopic: "Развернутый ответ с самооценкой",
        difficulty: "hard",
        examBlueprintTag: "RU-EXT-LITE-2026",
        build() {
          const keyPoints = [
            "сформулирован тезис",
            "приведен пример",
            "объяснена связь примера и тезиса",
            "сделан вывод",
          ];
          return {
            type: "extended-answer-lite",
            format: "textarea-rubric-lite",
            skill: "Аргументация и связная письменная речь",
            expectedTimeSec: 280,
            sourceHint: "Тренировка письменного рассуждения (lite)",
            prompt:
              "Кратко (4-6 предложений) объясните, почему регулярная работа над ошибками повышает результат на экзамене.",
            rubric: {
              requiredKeyPoints: [
                "сформулирован тезис",
                "приведен пример",
                "объяснена связь примера и тезиса",
                "сделан вывод",
              ],
              optionalKeyPoints: [
                "использована логическая связка",
                "указана типичная ошибка",
              ],
              keyPoints,
              checklist: [
                "Есть четкий тезис в первом предложении",
                "Есть конкретный пример из учебной практики",
                "Есть логическая связка 'поэтому/следовательно'",
                "Есть итоговый вывод",
              ],
              strongSample:
                "Регулярная работа над ошибками повышает результат, потому что устраняет повторяющиеся пробелы. Например, если после каждого варианта разбирать пунктуационные ошибки, их число постепенно снижается. Это происходит, потому что ученик начинает распознавать типовые ловушки до выбора ответа. Следовательно, системный разбор ошибок превращает случайный результат в устойчивый.",
              typicalErrors: [
                "пересказ без тезиса",
                "нет связи между примером и выводом",
                "слишком общий ответ без конкретики",
              ],
            },
            explanation: createExplanation({
              correctAnswer: "Оценивается по чек-листу ключевых элементов.",
              why: "Задание проверяет не выбор варианта, а умение строить логичное мини-рассуждение.",
              rule:
                "Сильный ответ содержит тезис, аргумент/пример, причинную связь и вывод.",
              formula: "Тезис + Пример + Объяснение + Вывод.",
              stepByStep:
                "1) Сформулируйте тезис. 2) Добавьте один конкретный пример. 3) Объясните, почему пример подтверждает тезис. 4) Сделайте вывод.",
              commonMistakes:
                "Пишут общие фразы без примера и без финального вывода.",
              alternateMethod:
                "Сначала составьте план из 4 пунктов, затем превратите каждый пункт в отдельное предложение.",
              recognitionTip:
                "Если ответ можно сократить до одного абзаца с четкой структурой, он обычно набирает высокий балл.",
            }),
            tags: ["extended-answer-lite", "writing", "argumentation"],
          };
        },
      },
      {
        key: "ru-text-short-medium",
        maxUse: 3,
        segment: "Текст и речь",
        topic: "Связанный анализ текста",
        subtopic: "Короткий ответ по авторской позиции",
        difficulty: "medium",
        examBlueprintTag: "RU-TEXT-SHORT-2026",
        type: "short-text",
        build(rng) {
          const entry = pick(rng, [
            {
              text:
                "Многие ученики уверены, что успех на экзамене зависит от удачи. Однако стабильный результат обычно достигается тогда, когда подготовка построена по плану и включает регулярный разбор ошибок.",
              question: "Какую стратегию автор считает ключевой? Ответьте 1-2 словами.",
              answers: ["плановая подготовка", "подготовка по плану", "системная подготовка"],
              label: "Плановая подготовка",
            },
            {
              text:
                "Если ученик после каждой тренировки возвращается к ошибкам и выясняет причину, он постепенно перестает повторять одни и те же промахи. Такая работа формирует устойчивый навык.",
              question: "Что, по мнению автора, формирует устойчивый навык? (1-3 слова)",
              answers: ["работа над ошибками", "разбор ошибок", "регулярный разбор ошибок"],
              label: "Работа над ошибками",
            },
          ]);
          return {
            type: "short-text",
            format: "text",
            skill: "Понимание авторской позиции в тексте",
            expectedTimeSec: 130,
            sourceHint: "Русский язык: связанный текст и вывод",
            prompt: `${entry.text}\n\n${entry.question}`,
            acceptedAnswers: entry.answers,
            explanation: createExplanation({
              correctAnswer: entry.label,
              why: "Ответ определяется по главной мысли текста, а не по отдельной фразе.",
              rule:
                "В заданиях по тексту нужно выделять тезис автора и формулировать его кратко, без пересказа деталей.",
              formula:
                "Алгоритм: тема текста -> позиция автора -> краткий смысловой вывод.",
              stepByStep:
                "1) Найдите ключевую мысль текста. 2) Отделите ее от примеров. 3) Сформулируйте ответ в 1-2 словах.",
              commonMistakes:
                "Ученики переписывают большой фрагмент вместо краткой формулировки позиции автора.",
              alternateMethod:
                "Сначала ответьте на вопрос: 'Что автор считает главным условием успеха?'",
              recognitionTip:
                "Если в тексте есть противопоставление ('однако', 'но'), тезис часто находится после него.",
            }),
            tags: ["short-text", "text-analysis", "author-position"],
            requiredCoverage: true,
          };
        },
      },
      {
        key: "ru-orth-fill-medium",
        maxUse: 3,
        segment: "Орфография",
        topic: "Орфография в тексте",
        subtopic: "Заполнение пропусков в связанном фрагменте",
        difficulty: "medium",
        examBlueprintTag: "RU-ORTH-FILL-2026",
        type: "fill-in-the-blank",
        build(rng) {
          const item = pick(rng, [
            {
              text:
                "Перед экзаменом важно ___(1)___ план повторения и ___(2)___ ошибки в каждом варианте.",
              blanks: [{ id: "b1", label: "Пропуск 1" }, { id: "b2", label: "Пропуск 2" }],
              correct: [["составить"], ["разбирать", "проанализировать", "анализировать"]],
              answer: "составить / разбирать",
            },
            {
              text:
                "Чтобы не допускать речевых ошибок, полезно ___(1)___ словарь трудных слов и ___(2)___ его в контексте.",
              blanks: [{ id: "b1", label: "Пропуск 1" }, { id: "b2", label: "Пропуск 2" }],
              correct: [["вести", "составлять"], ["повторять", "применять"]],
              answer: "вести / повторять",
            },
          ]);
          return {
            type: "fill-in-the-blank",
            format: "blank-input",
            skill: "Контекстное применение орфографических и лексических норм",
            expectedTimeSec: 150,
            sourceHint: "Русский язык: связный фрагмент с пропусками",
            prompt: item.text,
            blanks: item.blanks,
            correctBlanks: item.correct,
            explanation: createExplanation({
              correctAnswer: item.answer,
              why: "Слова выбираются по смысловой и грамматической сочетаемости внутри фрагмента.",
              rule:
                "Проверяйте не только орфографию слова, но и его связь с зависимыми словами в предложении.",
              formula:
                "Сначала смысл -> затем грамматика -> затем орфография.",
              stepByStep:
                "1) Прочитайте весь фрагмент целиком. 2) Подберите слова по смыслу. 3) Проверьте форму слова в контексте.",
              commonMistakes:
                "Подставляют слово, подходящее по смыслу, но нарушающее грамматическую связь.",
              alternateMethod:
                "Вставьте варианты устно и выберите сочетание, которое звучит естественно и грамматически верно.",
              recognitionTip:
                "Если пропуск связан с глаголом действия, проверяйте управление: что именно нужно 'составить', 'разбирать', 'повторять'.",
            }),
            tags: ["fill-in-the-blank", "orthography", "context"],
            requiredCoverage: true,
          };
        },
      },
      {
        key: "ru-text-matching-hard",
        singleUse: true,
        segment: "Текст и речь",
        topic: "Связанный анализ текста",
        subtopic: "Соответствие фрагмента и функции",
        difficulty: "hard",
        examBlueprintTag: "RU-TEXT-MATCH-2026",
        type: "matching",
        build() {
          return {
            type: "matching",
            format: "pair-mapping",
            skill: "Определение функции фрагмента текста",
            expectedTimeSec: 180,
            sourceHint: "Русский язык: функциональная роль фрагмента",
            prompt:
              "Установите соответствие между фрагментом текста и его функцией в рассуждении.",
            matching: {
              left: [
                { id: "f1", label: "«Во-первых, регулярная практика снижает тревожность.»" },
                { id: "f2", label: "«Например, после трех тренировок число пунктуационных ошибок уменьшилось вдвое.»" },
                { id: "f3", label: "«Следовательно, системный подход дает предсказуемый результат.»" },
              ],
              right: [
                { id: "r1", label: "Тезис/аргумент общего характера" },
                { id: "r2", label: "Конкретный пример/иллюстрация" },
                { id: "r3", label: "Итоговый вывод" },
              ],
            },
            matchPairs: { f1: "r1", f2: "r2", f3: "r3" },
            explanation: createExplanation({
              correctAnswer: "f1-r1, f2-r2, f3-r3",
              why: "У рассуждения есть стандартная композиция: тезис -> пример -> вывод.",
              rule:
                "Функция фрагмента определяется по маркерам текста: 'например' обычно вводит пример, 'следовательно' — вывод.",
              formula:
                "Композиция рассуждения: T (тезис) -> E (пример) -> C (conclusion).",
              stepByStep:
                "1) Найдите маркеры логической связи. 2) Определите роль каждого фрагмента. 3) Сопоставьте роли с формулировками.",
              commonMistakes:
                "Смешивают тезис и вывод, потому что оба звучат как 'общие' утверждения.",
              alternateMethod:
                "Уберите один фрагмент и проверьте, рушится ли логика доказательства: так легче понять его функцию.",
              recognitionTip:
                "Слова 'например', 'так', 'следовательно', 'итак' напрямую подсказывают роль фрагмента.",
            }),
            tags: ["matching", "text", "composition"],
            requiredCoverage: true,
          };
        },
      },
    ];
  }

  function mathFactories() {
    return [
      {
        key: "ma-percent-basic",
        segment: "Числа и вычисления",
        topic: "Проценты",
        subtopic: "Нахождение процента от числа",
        difficulty: "medium",
        examBlueprintTag: "MA-NUM-PCT-2026",
        build(rng) {
          const number = randomInt(rng, 8, 70) * 10;
          const percent = pick(rng, [5, 10, 12, 15, 20, 25, 30, 40]);
          const answer = Number(((number * percent) / 100).toFixed(2));
          const data = makeChoiceQuestion(answer, numericDistractors(answer, rng, 2, 24), rng);

          return {
            prompt: `Найдите ${percent}% от ${number}.`,
            options: data.options,
            correctIndex: data.correctIndex,
            explanation: createExplanation({
              correctAnswer: String(answer),
              why: "Процент переводится в дробь со знаменателем 100.",
              rule: "p% от числа a = a × p / 100.",
              formula: `x = ${number} × ${percent} / 100 = ${answer}`,
              stepByStep: `1) Запишите ${percent}% как ${percent}/100. 2) Умножьте ${number} на ${percent}. 3) Разделите на 100 и получите ${answer}.`,
              commonMistakes: "Ошибка в переносе запятой при делении на 100.",
              alternateMethod: "Сначала найдите 1% (разделите число на 100), затем умножьте на нужный процент.",
              recognitionTip: "Если в условии есть слово 'процент', почти всегда работает формула a·p/100.",
            }),
          };
        },
      },
      {
        key: "ma-linear-basic",
        segment: "Алгебра",
        topic: "Линейные уравнения",
        subtopic: "Перенос слагаемых",
        difficulty: "medium",
        examBlueprintTag: "MA-ALG-LIN-2026",
        build(rng) {
          const x = randomInt(rng, -12, 14);
          const a = randomInt(rng, 2, 9) * (rng() > 0.4 ? 1 : -1);
          const b = randomInt(rng, -30, 30);
          const c = a * x + b;
          const data = makeChoiceQuestion(x, numericDistractors(x, rng, 1, 7), rng);

          return {
            prompt: `Решите уравнение: ${a}x ${b >= 0 ? "+" : "-"} ${Math.abs(b)} = ${c}`,
            options: data.options,
            correctIndex: data.correctIndex,
            explanation: createExplanation({
              correctAnswer: String(x),
              why: "После переноса свободного члена остается одно действие деления на коэффициент при x.",
              rule: "Линейное уравнение вида ax + b = c решается как x = (c - b)/a.",
              formula: `x = (${c} - (${b})) / ${a} = ${x}`,
              stepByStep: `1) Перенесите ${b} в правую часть. 2) Получите ${a}x = ${c - b}. 3) Разделите обе части на ${a}.`,
              commonMistakes: "Забывают поменять знак у переносимого числа.",
              alternateMethod: "Можно подставить каждый вариант ответа и проверить равенство левой и правой части.",
              recognitionTip: "Если уравнение первой степени и один x, это линейный шаблон с прямым алгоритмом.",
            }),
          };
        },
      },
      {
        key: "ma-geometry-basic",
        segment: "Геометрия",
        topic: "Прямоугольник",
        subtopic: "Площадь и периметр",
        difficulty: "basic",
        examBlueprintTag: "MA-GEO-RECT-2026",
        build(rng) {
          const a = randomInt(rng, 3, 24);
          const b = randomInt(rng, 4, 18);
          const askArea = rng() > 0.4;
          const answer = askArea ? a * b : 2 * (a + b);
          const data = makeChoiceQuestion(answer, numericDistractors(answer, rng, 2, 20), rng);

          return {
            prompt: askArea
              ? `Стороны прямоугольника равны ${a} и ${b}. Найдите площадь.`
              : `Стороны прямоугольника равны ${a} и ${b}. Найдите периметр.`,
            options: data.options,
            correctIndex: data.correctIndex,
            explanation: createExplanation({
              correctAnswer: String(answer),
              why: askArea ? "Площадь прямоугольника равна произведению сторон." : "Периметр — сумма всех сторон.",
              rule: askArea ? "S = a × b." : "P = 2(a + b).",
              formula: askArea ? `S = ${a} × ${b} = ${answer}` : `P = 2(${a} + ${b}) = ${answer}`,
              stepByStep: askArea
                ? `1) Возьмите длину ${a} и ширину ${b}. 2) Перемножьте их. 3) Получите ${answer}.`
                : `1) Сложите стороны: ${a} + ${b}. 2) Умножьте сумму на 2. 3) Получите ${answer}.`,
              commonMistakes: "Путают формулы площади и периметра.",
              alternateMethod: askArea
                ? "Можно считать площадь как сумму площадей полос, но это дольше."
                : "Сложите все четыре стороны напрямую: a + b + a + b.",
              recognitionTip: "Слова 'площадь' и 'периметр' сразу определяют нужную формулу.",
            }),
          };
        },
      },
      {
        key: "ma-function-medium",
        segment: "Функции и графики",
        topic: "Линейная функция",
        subtopic: "Коэффициент и значение функции",
        difficulty: "medium",
        examBlueprintTag: "MA-FUNC-LIN-2026",
        build(rng) {
          const k = randomInt(rng, -6, 8);
          const b = randomInt(rng, -10, 12);
          const x = randomInt(rng, -5, 9);
          const answer = k * x + b;
          const data = makeChoiceQuestion(answer, numericDistractors(answer, rng, 2, 15), rng);

          return {
            prompt: `Для функции y = ${k}x ${b >= 0 ? "+" : "-"} ${Math.abs(b)} найдите y при x = ${x}.`,
            options: data.options,
            correctIndex: data.correctIndex,
            explanation: createExplanation({
              correctAnswer: String(answer),
              why: "Подставляем данное значение x прямо в формулу функции.",
              rule: "Для линейной функции y = kx + b достаточно выполнить подстановку.",
              formula: `y = ${k}·${x} ${b >= 0 ? "+" : "-"} ${Math.abs(b)} = ${answer}`,
              stepByStep: `1) Умножьте k на x: ${k}×${x} = ${k * x}. 2) Прибавьте b (${b}). 3) Получите ${answer}.`,
              commonMistakes: "Ошибаются в знаке коэффициента или свободного члена b.",
              alternateMethod: "Сначала вычислите точку пересечения с осью y (b), потом учтите изменение на k·x.",
              recognitionTip: "Если дан вид y = kx + b и конкретный x, задача всегда на подстановку.",
            }),
          };
        },
      },
      {
        key: "ma-progression-medium",
        segment: "Алгебра",
        topic: "Арифметическая прогрессия",
        subtopic: "n-й член",
        difficulty: "medium",
        examBlueprintTag: "MA-ALG-AP-2026",
        build(rng) {
          const a1 = randomInt(rng, -8, 12);
          const d = randomInt(rng, -5, 7);
          const n = randomInt(rng, 6, 15);
          const answer = a1 + (n - 1) * d;
          const data = makeChoiceQuestion(answer, numericDistractors(answer, rng, 1, 10), rng);

          return {
            prompt: `В арифметической прогрессии a1 = ${a1}, d = ${d}. Найдите a${n}.`,
            options: data.options,
            correctIndex: data.correctIndex,
            explanation: createExplanation({
              correctAnswer: String(answer),
              why: "Каждый следующий член отличается на d.",
              rule: "Формула n-го члена: an = a1 + (n - 1)d.",
              formula: `a${n} = ${a1} + (${n} - 1)·${d} = ${answer}`,
              stepByStep: `1) Посчитайте n - 1 = ${n - 1}. 2) Умножьте на d: ${(n - 1) * d}. 3) Прибавьте к a1 и получите ${answer}.`,
              commonMistakes: "Берут n вместо n-1 или путают знак d.",
              alternateMethod: "Можно выписать несколько первых членов и увидеть закономерность, но формула быстрее.",
              recognitionTip: "Если в условии есть a1 и d, почти всегда нужна формула an.",
            }),
          };
        },
      },
      {
        key: "ma-probability-medium",
        segment: "Вероятность и статистика",
        topic: "Классическая вероятность",
        subtopic: "Отношение благоприятных исходов к общему числу",
        difficulty: "medium",
        examBlueprintTag: "MA-STAT-PROB-2026",
        build(rng) {
          const red = randomInt(rng, 2, 10);
          const blue = randomInt(rng, 2, 10);
          const green = randomInt(rng, 1, 7);
          const total = red + blue + green;
          const answer = `${red}/${total}`;
          const distractors = [`${blue}/${total}`, `${green}/${total}`, `${red + blue}/${total}`];
          const data = makeChoiceQuestion(answer, distractors, rng);

          return {
            prompt: `В коробке ${red} красных, ${blue} синих и ${green} зелёных шаров. Найдите вероятность вытащить красный шар.`,
            options: data.options,
            correctIndex: data.correctIndex,
            explanation: createExplanation({
              correctAnswer: answer,
              why: "Вероятность равна доле благоприятных исходов среди всех равновозможных исходов.",
              rule: "P(A) = m / n, где m — число благоприятных исходов, n — общее число исходов.",
              formula: `P = ${red}/${total}`,
              stepByStep: `1) Благоприятных исходов: ${red}. 2) Всего исходов: ${total}. 3) Запишите дробь ${red}/${total}.`,
              commonMistakes: "В знаменатель ставят только часть шаров, забывая про все цвета.",
              alternateMethod: "Представьте выбор как случайный индекс шара от 1 до n и посчитайте, сколько индексов подходят.",
              recognitionTip: "Ключевая фраза 'вероятность вытащить' в задачах ОГЭ почти всегда сводится к m/n.",
            }),
          };
        },
      },
      {
        key: "ma-percent-hard",
        segment: "Числа и вычисления",
        topic: "Сложные проценты",
        subtopic: "Последовательные изменения",
        difficulty: "hard",
        examBlueprintTag: "MA-NUM-PCT-COMBO-2026",
        build(rng) {
          const base = randomInt(rng, 800, 6000);
          const rise = pick(rng, [10, 12, 15, 20, 25]);
          const drop = pick(rng, [5, 10, 12, 15, 20]);
          const answer = Number((base * (1 + rise / 100) * (1 - drop / 100)).toFixed(2));
          const distractors = [
            Number((base * (1 + (rise - drop) / 100)).toFixed(2)),
            Number((base * (1 - rise / 100) * (1 + drop / 100)).toFixed(2)),
            Number((base * (1 + rise / 100) * (1 + drop / 100)).toFixed(2)),
          ];
          const data = makeChoiceQuestion(answer, distractors, rng);

          return {
            prompt: `Цена товара была ${base} руб. Сначала ее повысили на ${rise}%, затем снизили на ${drop}% от новой цены. Какой стала цена?`,
            options: data.options,
            correctIndex: data.correctIndex,
            explanation: createExplanation({
              correctAnswer: String(answer),
              why: "Проценты применяются последовательно к разным базам, поэтому нельзя просто вычитать проценты.",
              rule:
                "После изменения на p% число умножается на коэффициент (1 ± p/100). Для двух шагов коэффициенты перемножаются.",
              formula: `${base} × (1 + ${rise}/100) × (1 - ${drop}/100) = ${answer}`,
              stepByStep:
                "1) Увеличьте базовую цену коэффициентом роста. 2) К полученной цене примените коэффициент снижения. 3) Округлите результат по условию.",
              commonMistakes:
                "Ошибка-ловушка: считать итог как +rise%-drop% от исходной цены без последовательного пересчета базы.",
              alternateMethod:
                "Посчитайте по шагам в таблице: старая цена -> после роста -> после снижения; затем сравните с исходной.",
              recognitionTip:
                "Если в задаче два процента подряд ('сначала..., затем...'), используйте произведение коэффициентов, а не линейную разность.",
            }),
          };
        },
      },
      {
        key: "ma-system-hard",
        segment: "Алгебра",
        topic: "Системы уравнений",
        subtopic: "Метод подстановки",
        difficulty: "hard",
        examBlueprintTag: "MA-ALG-SYS-2026",
        build(rng) {
          const x = randomInt(rng, -6, 7);
          const y = randomInt(rng, -8, 8);
          const a = randomInt(rng, 2, 6);
          const sum = x + y;
          const second = a * x - y;
          const answer = x;
          const data = makeChoiceQuestion(answer, numericDistractors(answer, rng, 1, 5), rng);

          return {
            prompt: `Решите систему и найдите x: { x + y = ${sum}; ${a}x - y = ${second} }`,
            options: data.options,
            correctIndex: data.correctIndex,
            explanation: createExplanation({
              correctAnswer: String(answer),
              why: "При сложении уравнений переменная y исключается.",
              rule: "Для системы двух линейных уравнений удобно использовать сложение/подстановку.",
              formula: `Складываем: (${a + 1})x = ${sum + second}, x = ${(sum + second)}/${a + 1} = ${answer}`,
              stepByStep: "1) Сложите уравнения, чтобы сократить y. 2) Получите уравнение с x. 3) Решите его и проверьте подстановкой.",
              commonMistakes: "Ошибки со знаками при сложении уравнений.",
              alternateMethod: `Из первого уравнения выразите y = ${sum} - x и подставьте во второе.`,
              recognitionTip: "Если коэффициенты при y противоположны по знаку, удобно применять метод сложения.",
            }),
          };
        },
      },
      {
        key: "ma-inequality-hard",
        segment: "Алгебра",
        topic: "Линейные неравенства",
        subtopic: "Знаки и интервалы",
        difficulty: "hard",
        examBlueprintTag: "MA-ALG-INEQ-2026",
        build(rng) {
          const a = randomInt(rng, -7, 7) || 3;
          const b = randomInt(rng, -12, 15);
          const c = randomInt(rng, -10, 12);
          const sign = pick(rng, [">", "<"]);
          const threshold = Number(((c - b) / a).toFixed(2));
          let correct;

          if (sign === ">") {
            correct = a > 0 ? `x > ${threshold}` : `x < ${threshold}`;
          } else {
            correct = a > 0 ? `x < ${threshold}` : `x > ${threshold}`;
          }

          const wrong = [
            sign === ">" ? `x > ${Number((threshold + 1).toFixed(2))}` : `x < ${Number((threshold + 1).toFixed(2))}`,
            sign === ">" ? `x < ${threshold}` : `x > ${threshold}`,
            `x ${sign === ">" ? ">=" : "<="} ${threshold}`,
          ];

          const data = makeChoiceQuestion(correct, wrong, rng);

          return {
            prompt: `Решите неравенство: ${a}x ${b >= 0 ? "+" : "-"} ${Math.abs(b)} ${sign} ${c}`,
            options: data.options,
            correctIndex: data.correctIndex,
            explanation: createExplanation({
              correctAnswer: correct,
              why: "При делении на отрицательное число знак неравенства меняется.",
              rule: "ax + b > c или ax + b < c решается переносом b и делением на a с учетом знака a.",
              formula: `${a}x ${sign} ${c - b} => x ${correct.includes(">") ? ">" : "<"} ${threshold}`,
              stepByStep: "1) Перенесите свободный член. 2) Разделите обе части на коэффициент a. 3) Если a < 0, переверните знак неравенства.",
              commonMistakes: "Забывают перевернуть знак при делении на отрицательное число.",
              alternateMethod: "Проверьте любой тестовый x из полученного интервала подстановкой в исходное неравенство.",
              recognitionTip: "В задачах-ловушках именно знак коэффициента при x определяет направление интервала.",
            }),
          };
        },
      },
      {
        key: "ma-geometry-hard",
        segment: "Геометрия",
        topic: "Подобие треугольников",
        subtopic: "Пропорциональность сторон",
        difficulty: "hard",
        examBlueprintTag: "MA-GEO-SIMILAR-2026",
        build(rng) {
          const k = pick(rng, [1.5, 2, 2.5, 3]);
          const small = randomInt(rng, 4, 12);
          const large = Number((small * k).toFixed(2));
          const data = makeChoiceQuestion(large, numericDistractors(large, rng, 1, 8), rng);

          return {
            prompt: `Треугольники подобны. В первом треугольнике сторона равна ${small}, коэффициент подобия второго к первому равен ${k}. Найдите соответствующую сторону второго треугольника.`,
            options: data.options,
            correctIndex: data.correctIndex,
            explanation: createExplanation({
              correctAnswer: String(large),
              why: "Соответствующие стороны подобных треугольников пропорциональны коэффициенту подобия.",
              rule: "Если k = S2/S1 по сторонам, то любая сторона второго треугольника = k × соответствующая сторона первого.",
              formula: `${large} = ${small} × ${k}`,
              stepByStep: `1) Выпишите коэффициент ${k}. 2) Умножьте сторону ${small} на коэффициент. 3) Получите ${large}.`,
              commonMistakes: "Путают направление коэффициента и делят вместо умножения.",
              alternateMethod: "Составьте пропорцию x/${small} = ${k} и решите её.",
              recognitionTip: "Слова 'подобны' и 'коэффициент подобия' почти всегда приводят к пропорции сторон.",
            }),
          };
        },
      },
      {
        key: "ma-stat-hard",
        segment: "Вероятность и статистика",
        topic: "Медиана и среднее",
        subtopic: "Анализ числового набора",
        difficulty: "hard",
        examBlueprintTag: "MA-STAT-MED-2026",
        build(rng) {
          const values = Array.from({ length: 5 }, () => randomInt(rng, 1, 20)).sort((a, b) => a - b);
          const answer = values[2];
          const distractors = [values[1], values[3], Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2))];
          const data = makeChoiceQuestion(answer, distractors, rng);

          return {
            prompt: `Найдите медиану набора: ${values.join(", ")}.`,
            options: data.options,
            correctIndex: data.correctIndex,
            explanation: createExplanation({
              correctAnswer: String(answer),
              why: "При нечётном количестве элементов медиана — центральный элемент упорядоченного ряда.",
              rule: "Для 5 чисел медиана — третье число после сортировки.",
              formula: `После упорядочивания: [${values.join(", ")}], медиана = ${answer}`,
              stepByStep: "1) Упорядочьте числа. 2) Найдите центральную позицию. 3) Считайте значение в центре.",
              commonMistakes: "Путают медиану со средним арифметическим.",
              alternateMethod: "Вычеркните попарно минимальное и максимальное значения, пока не останется одно число.",
              recognitionTip: "Если в задании про 'центральное значение ряда', это медиана, а не среднее.",
            }),
          };
        },
      },
      {
        key: "ma-combined-hard",
        segment: "Функции и графики",
        topic: "Графическая интерпретация",
        subtopic: "Сравнение значений функции",
        difficulty: "hard",
        examBlueprintTag: "MA-FUNC-COMBO-2026",
        build(rng) {
          const k1 = randomInt(rng, -5, 6) || 2;
          const b1 = randomInt(rng, -6, 8);
          const k2 = randomInt(rng, -5, 6) || -1;
          const b2 = randomInt(rng, -6, 8);
          const x = randomInt(rng, -3, 6);
          const y1 = k1 * x + b1;
          const y2 = k2 * x + b2;
          const answer = y1 > y2 ? "первая" : y1 < y2 ? "вторая" : "равны";
          const data = makeChoiceQuestion(answer, ["первая и вторая одинаково возрастают", "нельзя определить", answer === "равны" ? "первая" : "равны"], rng);

          return {
            prompt: `Сравните значения функций y1 = ${k1}x ${b1 >= 0 ? "+" : "-"} ${Math.abs(b1)} и y2 = ${k2}x ${b2 >= 0 ? "+" : "-"} ${Math.abs(b2)} при x = ${x}. Что больше?`,
            options: data.options,
            correctIndex: data.correctIndex,
            explanation: createExplanation({
              correctAnswer: answer,
              why: "Сравнение функций в точке сводится к вычислению двух чисел и их сравнению.",
              rule: "Подставьте x в обе функции и сравните y1 и y2.",
              formula: `y1 = ${y1}, y2 = ${y2}`,
              stepByStep: "1) Посчитайте y1. 2) Посчитайте y2. 3) Сравните результаты и выберите функцию с большим значением.",
              commonMistakes: "Сравнивают только коэффициенты k, игнорируя свободный член и конкретный x.",
              alternateMethod: "Рассмотрите разность y1 - y2: ее знак сразу покажет, что больше.",
              recognitionTip: "Слова 'при x =' означают, что нужно считать численные значения, а не рассуждать абстрактно про график.",
            }),
          };
        },
      },
      {
        key: "ma-numeric-hard",
        segment: "Алгебра",
        topic: "Квадратные уравнения",
        subtopic: "Корень уравнения (числовой ввод)",
        difficulty: "hard",
        examBlueprintTag: "MA-ALG-NUMERIC-2026",
        build(rng) {
          const x1 = randomInt(rng, -8, 8) || 3;
          const x2 = randomInt(rng, -8, 8) || -2;
          const b = -(x1 + x2);
          const c = x1 * x2;
          const target = pick(rng, [x1, x2]);
          return {
            type: "numeric-input",
            format: "number",
            skill: "Алгебраические преобразования и вычислительная точность",
            expectedTimeSec: 190,
            sourceHint: "Блок вычислительных заданий с числовым вводом",
            prompt: `Найдите меньший корень уравнения x² ${b >= 0 ? "+" : "-"} ${Math.abs(
              b,
            )}x ${c >= 0 ? "+" : "-"} ${Math.abs(c)} = 0`,
            numericAnswer: Math.min(x1, x2),
            tolerance: 0.001,
            explanation: createExplanation({
              correctAnswer: String(Math.min(x1, x2)),
              why: "Уравнение раскладывается на множители по корням и дает два значения x.",
              rule:
                "Если x² - (x1+x2)x + x1x2 = 0, то корни равны x1 и x2.",
              formula: `x² ${b >= 0 ? "+" : "-"} ${Math.abs(b)}x ${
                c >= 0 ? "+" : "-"
              } ${Math.abs(c)} = (x - ${x1})(x - ${x2})`,
              stepByStep:
                "1) Определите сумму и произведение корней. 2) Восстановите корни уравнения. 3) Выберите меньший.",
              commonMistakes:
                "Путают знак перед b и получают неверную сумму корней.",
              alternateMethod:
                "Вычислите дискриминант и найдите оба корня формулой, затем выберите меньший.",
              recognitionTip:
                "Фраза 'введите корень' обычно означает числовой ответ без вариантов.",
            }),
            tags: ["numeric-input", "quadratic", "algebra"],
            requiredCoverage: true,
            targetRoot: target,
          };
        },
      },
      {
        key: "ma-matching-medium",
        singleUse: true,
        segment: "Функции и графики",
        topic: "Соответствие формулы и свойства",
        subtopic: "Сопоставление математических объектов",
        difficulty: "medium",
        examBlueprintTag: "MA-FUNC-MATCH-2026",
        build() {
          return {
            type: "matching",
            format: "pair-mapping",
            skill: "Распознавание свойств функций",
            expectedTimeSec: 170,
            sourceHint: "Тренажер сопоставления формул и графических свойств",
            prompt:
              "Установите соответствие между формулой функции (слева) и её свойством (справа).",
            matching: {
              left: [
                { id: "f1", label: "y = 2x + 3" },
                { id: "f2", label: "y = x²" },
                { id: "f3", label: "y = -x" },
              ],
              right: [
                { id: "r1", label: "Парабола, ветви вверх" },
                { id: "r2", label: "Линейная, возрастает" },
                { id: "r3", label: "Линейная, убывает" },
              ],
            },
            matchPairs: {
              f1: "r2",
              f2: "r1",
              f3: "r3",
            },
            explanation: createExplanation({
              correctAnswer: "f1-r2, f2-r1, f3-r3",
              why: "Тип функции и знак коэффициента определяют её ключевые графические свойства.",
              rule:
                "Линейная y=kx+b: при k>0 возрастает, при k<0 убывает; y=x² — стандартная парабола вверх.",
              formula:
                "Критерий: знак k для линейной функции и степень переменной для определения типа графика.",
              stepByStep:
                "1) Определите тип каждой функции. 2) Найдите основной параметр (k). 3) Сопоставьте с описанием свойства.",
              commonMistakes:
                "Путают знак коэффициента у линейной функции и направление изменения графика.",
              alternateMethod:
                "Подставьте 2-3 значения x и посмотрите, растут или убывают значения y.",
              recognitionTip:
                "Если в формуле есть x², это почти всегда парабола, а не прямая.",
            }),
            tags: ["matching", "function", "graph-properties"],
          };
        },
      },
      {
        key: "ma-numeric-geometry-medium",
        maxUse: 3,
        segment: "Геометрия",
        topic: "Площадь треугольника",
        subtopic: "Числовой ответ без вариантов",
        difficulty: "medium",
        examBlueprintTag: "MA-GEO-NUMERIC-S-2026",
        type: "numeric-input",
        build(rng) {
          const base = randomInt(rng, 6, 20);
          const height = randomInt(rng, 4, 15);
          const answer = Number(((base * height) / 2).toFixed(2));
          return {
            type: "numeric-input",
            format: "number",
            skill: "Применение формулы площади треугольника",
            expectedTimeSec: 150,
            sourceHint: "Математика: вычислительное задание с числовым вводом",
            prompt: `Основание треугольника равно ${base}, высота к нему равна ${height}. Введите площадь треугольника.`,
            numericAnswer: answer,
            tolerance: 0.001,
            explanation: createExplanation({
              correctAnswer: String(answer),
              why: "Площадь треугольника равна половине произведения основания на высоту.",
              rule: "S = (a · h) / 2.",
              formula: `S = (${base} · ${height}) / 2 = ${answer}`,
              stepByStep:
                "1) Умножьте основание на высоту. 2) Разделите произведение на 2. 3) Запишите числовой ответ.",
              commonMistakes:
                "Забывают делить на 2 и получают площадь как для прямоугольника.",
              alternateMethod:
                "Представьте треугольник как половину параллелограмма с тем же основанием и высотой.",
              recognitionTip:
                "Если в условии дана высота к стороне, чаще всего требуется формула площади S = ah/2.",
            }),
            tags: ["numeric-input", "geometry", "area"],
            requiredCoverage: true,
          };
        },
      },
      {
        key: "ma-short-text-interval-hard",
        maxUse: 2,
        segment: "Алгебра",
        topic: "Неравенства",
        subtopic: "Короткая запись ответа",
        difficulty: "hard",
        examBlueprintTag: "MA-ALG-SHORT-INEQ-2026",
        type: "short-text",
        build(rng) {
          const threshold = randomInt(rng, -8, 10);
          const sign = pick(rng, [">", "<"]);
          const expected = sign === ">" ? `x>${threshold}` : `x<${threshold}`;
          return {
            type: "short-text",
            format: "text",
            skill: "Краткая алгебраическая запись ответа",
            expectedTimeSec: 160,
            sourceHint: "Математика: запись множества решений",
            prompt:
              sign === ">"
                ? `После преобразований получили неравенство x > ${threshold}. Запишите ответ в краткой форме без пробелов (пример: x>2).`
                : `После преобразований получили неравенство x < ${threshold}. Запишите ответ в краткой форме без пробелов (пример: x<2).`,
            acceptedAnswers: [expected, expected.replace("x", "X"), expected.replace(">", " > ").replace("<", " < ")],
            explanation: createExplanation({
              correctAnswer: expected,
              why: "Для линейного неравенства итоговая запись решения фиксирует направление и порог.",
              rule:
                "Ответ на линейное неравенство записывается как условие для x или в интервальной форме.",
              formula: sign === ">" ? `( ${threshold}; +∞ )` : `( -∞; ${threshold} )`,
              stepByStep:
                "1) Проверьте знак неравенства после деления. 2) Запишите порог. 3) Зафиксируйте ответ в краткой форме.",
              commonMistakes:
                "Пишут только число без знака или теряют направление неравенства.",
              alternateMethod:
                "Проверьте одно число, которое должно входить в решение, и одно число, которое не должно входить.",
              recognitionTip:
                "Фраза 'запишите ответ' в алгебре часто означает именно форму x>... или x<....",
            }),
            tags: ["short-text", "inequality", "algebra"],
          };
        },
      },
      {
        key: "ma-fill-blank-medium",
        maxUse: 3,
        segment: "Функции и графики",
        topic: "Формулы линейной функции",
        subtopic: "Заполнение пропусков",
        difficulty: "medium",
        examBlueprintTag: "MA-FUNC-FILL-2026",
        type: "fill-in-the-blank",
        build(rng) {
          const k = randomInt(rng, -6, 8) || 2;
          const b = randomInt(rng, -9, 9);
          return {
            type: "fill-in-the-blank",
            format: "blank-input",
            skill: "Работа с коэффициентами линейной функции",
            expectedTimeSec: 145,
            sourceHint: "Математика: заполнение формулы по параметрам",
            prompt:
              `Заполните пропуски: в формуле y = kx + b коэффициент k показывает ___(1)___ графика, а число b — точку пересечения с осью ___(2)___.`,
            blanks: [{ id: "b1", label: "Пропуск 1" }, { id: "b2", label: "Пропуск 2" }],
            correctBlanks: [["наклон", "угловой коэффициент"], ["oy", "ординат", "y"]],
            explanation: createExplanation({
              correctAnswer: "наклон (угловой коэффициент) / ось OY",
              why: "Параметр k отвечает за направление и крутизну прямой, b — за вертикальный сдвиг.",
              rule: "В y = kx + b: k — угловой коэффициент, b — ордината точки пересечения с OY.",
              formula: `y = ${k}x ${b >= 0 ? "+" : "-"} ${Math.abs(b)}`,
              stepByStep:
                "1) Вспомните роль коэффициента k. 2) Вспомните геометрический смысл b. 3) Заполните оба пропуска.",
              commonMistakes:
                "Путают пересечение с OX и OY и неверно трактуют коэффициент k.",
              alternateMethod:
                "Подставьте x=0: получите y=b, значит это точка пересечения с осью OY.",
              recognitionTip:
                "Если в условии есть формула y=kx+b, почти всегда спрашивают смысл k и b.",
            }),
            tags: ["fill-in-the-blank", "functions", "linear"],
          };
        },
      },
      {
        key: "ma-extended-lite-hard",
        singleUse: true,
        segment: "Алгебра",
        topic: "Развернутое обоснование решения",
        subtopic: "Краткий ход решения с самопроверкой",
        difficulty: "hard",
        examBlueprintTag: "MA-EXT-LITE-2026",
        type: "extended-answer-lite",
        build() {
          return {
            type: "extended-answer-lite",
            format: "textarea-rubric-lite",
            skill: "Письменная математическая аргументация",
            expectedTimeSec: 260,
            sourceHint: "Математика: учебная самопроверка развернутого ответа",
            prompt:
              "Кратко (4-6 предложений) объясните ход решения задачи: почему при делении неравенства на отрицательное число знак меняется, и как проверить итоговый ответ.",
            rubric: {
              requiredKeyPoints: [
                "упомянуто изменение знака неравенства",
                "объяснена причина при делении на отрицательное",
                "приведена проверка подстановкой",
              ],
              optionalKeyPoints: [
                "пример с конкретным числом",
                "указание типичной ошибки",
              ],
              checklist: [
                "Есть правило про изменение знака",
                "Есть причинное объяснение, а не только формула",
                "Есть шаг проверки ответа",
                "Текст логично связан",
              ],
              strongSample:
                "Если обе части неравенства делят на отрицательное число, направление сравнения меняется: больше становится меньше и наоборот. Причина в том, что при умножении/делении на отрицательное числа на числовой прямой зеркально меняют порядок. После преобразований полезно подставить тестовое число из найденного интервала в исходное неравенство. Так можно проверить, что направление и границы выбраны верно.",
              typicalErrors: [
                "знак неравенства не изменен",
                "нет проверки решения",
                "объяснение без причины правила",
              ],
            },
            explanation: createExplanation({
              correctAnswer: "Оценивается по обязательным и желательным элементам.",
              why: "Задание проверяет умение объяснять математическое правило, а не просто сообщать ответ.",
              rule:
                "При делении или умножении неравенства на отрицательное число знак сравнения меняется на противоположный.",
              formula: "a>b и c<0 => a/c < b/c.",
              stepByStep:
                "1) Сформулируйте правило. 2) Объясните, почему оно работает. 3) Покажите, как выполнить проверку решения.",
              commonMistakes:
                "Пишут только правило без объяснения и без шага проверки.",
              alternateMethod:
                "Объясните через числовую прямую: отражение точек меняет порядок чисел.",
              recognitionTip:
                "Если задача на неравенство включает отрицательный коэффициент, обязательно контролируйте знак.",
            }),
            tags: ["extended-answer-lite", "algebra", "proof"],
            requiredCoverage: true,
          };
        },
      },
    ];
  }

  function physicsFactories() {
    return [
      {
        key: "ph-speed-basic",
        segment: "Механика",
        topic: "Равномерное движение",
        subtopic: "Скорость",
        difficulty: "basic",
        examBlueprintTag: "PH-MECH-V-2026",
        build(rng) {
          const distance = randomInt(rng, 40, 260);
          const time = randomInt(rng, 2, 13);
          const answer = Number((distance / time).toFixed(2));
          const data = makeChoiceQuestion(answer, numericDistractors(answer, rng, 1, 12), rng);

          return {
            prompt: `Тело прошло ${distance} м за ${time} с. Найдите скорость в м/с.`,
            options: data.options,
            correctIndex: data.correctIndex,
            explanation: createExplanation({
              correctAnswer: String(answer),
              why: "Скорость показывает, какой путь проходит тело за единицу времени.",
              rule: "v = s / t.",
              formula: `v = ${distance}/${time} = ${answer} м/с`,
              stepByStep: "1) Возьмите путь s. 2) Разделите на время t. 3) Получите скорость.",
              commonMistakes: "Путают формулы и умножают s на t вместо деления.",
              alternateMethod: "Можно оценить порядок величины: скорость должна быть меньше пути и больше нуля.",
              recognitionTip: "Если даны путь и время, почти всегда нужна формула v = s/t.",
            }),
          };
        },
      },
      {
        key: "ph-density-basic",
        segment: "Молекулярная физика",
        topic: "Плотность вещества",
        subtopic: "Связь массы и объема",
        difficulty: "medium",
        examBlueprintTag: "PH-MOL-RHO-2026",
        build(rng) {
          const mass = randomInt(rng, 5, 80);
          const volume = randomInt(rng, 2, 20);
          const answer = Number((mass / volume).toFixed(2));
          const data = makeChoiceQuestion(answer, numericDistractors(answer, rng, 1, 10), rng);

          return {
            prompt: `Масса тела ${mass} кг, объем ${volume} м³. Найдите плотность (кг/м³).`,
            options: data.options,
            correctIndex: data.correctIndex,
            explanation: createExplanation({
              correctAnswer: String(answer),
              why: "Плотность характеризует, какая масса приходится на единицу объёма.",
              rule: "ρ = m / V.",
              formula: `ρ = ${mass}/${volume} = ${answer} кг/м³`,
              stepByStep: "1) Возьмите массу m. 2) Разделите на объем V. 3) Запишите единицы кг/м³.",
              commonMistakes: "Иногда делят наоборот: V/m.",
              alternateMethod: "Проверьте размерность: кг, деленное на м³, дает кг/м³.",
              recognitionTip: "Слова 'масса' и 'объём' в одной задаче часто указывают на плотность.",
            }),
          };
        },
      },
      {
        key: "ph-ohm-basic",
        segment: "Электродинамика",
        topic: "Закон Ома",
        subtopic: "Ток, напряжение, сопротивление",
        difficulty: "medium",
        examBlueprintTag: "PH-EL-I-2026",
        build(rng) {
          const voltage = randomInt(rng, 6, 60);
          const resistance = randomInt(rng, 2, 15);
          const answer = Number((voltage / resistance).toFixed(2));
          const data = makeChoiceQuestion(answer, numericDistractors(answer, rng, 1, 8), rng);

          return {
            prompt: `При напряжении ${voltage} В и сопротивлении ${resistance} Ом найдите силу тока.`,
            options: data.options,
            correctIndex: data.correctIndex,
            explanation: createExplanation({
              correctAnswer: String(answer),
              why: "Для участка цепи ток прямо пропорционален напряжению и обратно пропорционален сопротивлению.",
              rule: "I = U / R.",
              formula: `I = ${voltage}/${resistance} = ${answer} А`,
              stepByStep: "1) Выпишите U и R. 2) Разделите U на R. 3) Запишите ответ в амперах.",
              commonMistakes: "Путают I = U/R и U = IR.",
              alternateMethod: "Из треугольника формул Ома быстро восстанавливайте нужную зависимость.",
              recognitionTip: "Если в условии есть U и R, а просят ток, используйте I = U/R.",
            }),
          };
        },
      },
      {
        key: "ph-work-medium",
        segment: "Механика",
        topic: "Механическая работа и мощность",
        subtopic: "Формулы A = Fs, N = A/t",
        difficulty: "medium",
        examBlueprintTag: "PH-MECH-WORK-2026",
        build(rng) {
          const force = randomInt(rng, 20, 130);
          const distance = randomInt(rng, 2, 15);
          const answer = force * distance;
          const data = makeChoiceQuestion(answer, numericDistractors(answer, rng, 10, 90), rng);

          return {
            prompt: `Сила ${force} Н переместила тело на ${distance} м. Найдите работу.`,
            options: data.options,
            correctIndex: data.correctIndex,
            explanation: createExplanation({
              correctAnswer: String(answer),
              why: "Работа постоянной силы при движении вдоль направления силы равна произведению силы на путь.",
              rule: "A = F × s.",
              formula: `A = ${force} × ${distance} = ${answer} Дж`,
              stepByStep: "1) Подставьте F и s в формулу. 2) Перемножьте. 3) Укажите единицу Дж.",
              commonMistakes: "Путают работу и мощность, делят вместо умножения.",
              alternateMethod: "Оцените: если и сила, и путь увеличиваются, работа тоже должна расти.",
              recognitionTip: "Слова 'сила' + 'перемещение' почти всегда ведут к формуле A = Fs.",
            }),
          };
        },
      },
      {
        key: "ph-heat-medium",
        segment: "Молекулярная физика",
        topic: "Количество теплоты",
        subtopic: "Нагревание тела",
        difficulty: "medium",
        examBlueprintTag: "PH-MOL-Q-2026",
        build(rng) {
          const c = pick(rng, [380, 420, 460, 900]);
          const mass = pick(rng, [0.5, 1, 1.5, 2]);
          const delta = randomInt(rng, 10, 35);
          const answer = Number((c * mass * delta).toFixed(2));
          const data = makeChoiceQuestion(answer, numericDistractors(answer, rng, 100, 2200), rng);

          return {
            prompt: `Тело массой ${mass} кг с удельной теплоёмкостью ${c} Дж/(кг·°C) нагрели на ${delta}°C. Найдите количество теплоты.`,
            options: data.options,
            correctIndex: data.correctIndex,
            explanation: createExplanation({
              correctAnswer: String(answer),
              why: "При нагревании без фазовых переходов Q зависит от массы, теплоёмкости и изменения температуры.",
              rule: "Q = c m Δt.",
              formula: `Q = ${c} × ${mass} × ${delta} = ${answer} Дж`,
              stepByStep: "1) Определите c, m, Δt. 2) Перемножьте три величины. 3) Запишите Дж.",
              commonMistakes: "Используют абсолютную температуру вместо изменения температуры.",
              alternateMethod: "Сначала найдите тепло на 1°C: c·m, потом умножьте на Δt.",
              recognitionTip: "Если говорится 'нагрели на ... градусов', это именно Δt.",
            }),
          };
        },
      },
      {
        key: "ph-gas-hard",
        segment: "Молекулярная физика",
        topic: "Газовые законы",
        subtopic: "Давление и абсолютная температура",
        difficulty: "hard",
        examBlueprintTag: "PH-MOL-GAS-2026",
        build(rng) {
          const p1 = randomInt(rng, 80, 220);
          const t1 = randomInt(rng, 7, 40);
          const t2 = randomInt(rng, 45, 120);
          const answer = Number((p1 * ((t2 + 273) / (t1 + 273))).toFixed(2));
          const distractors = [
            Number((p1 * (t2 / t1)).toFixed(2)),
            Number((p1 * ((t1 + 273) / (t2 + 273))).toFixed(2)),
            Number((p1 * ((t2 - t1) / (t1 + 273))).toFixed(2)),
          ];
          const data = makeChoiceQuestion(answer, distractors, rng);

          return {
            prompt: `При постоянном объеме давление газа было ${p1} кПа при ${t1}°C. Каким станет давление при ${t2}°C?`,
            options: data.options,
            correctIndex: data.correctIndex,
            explanation: createExplanation({
              correctAnswer: String(answer),
              why: "При постоянном объеме давление прямо пропорционально абсолютной температуре.",
              rule: "Для изохорного процесса p/T = const, где T берется в Кельвинах.",
              formula: `p2 = ${p1} × (${t2 + 273}/${t1 + 273}) = ${answer} кПа`,
              stepByStep:
                "1) Переведите температуры в Кельвины. 2) Запишите отношение p2/p1 = T2/T1. 3) Найдите p2 и проверьте физический смысл результата.",
              commonMistakes:
                "Используют градусы Цельсия напрямую без перевода в абсолютную шкалу, что дает грубую ошибку.",
              alternateMethod:
                "Оцените знак изменения: если температура выросла, давление при постоянном объеме тоже должно вырасти.",
              recognitionTip:
                "Фраза 'при постоянном объеме' почти всегда указывает на закон Гей-Люссака в форме p/T = const.",
            }),
          };
        },
      },
      {
        key: "ph-pressure-medium",
        segment: "Механика",
        topic: "Давление",
        subtopic: "Сила и площадь опоры",
        difficulty: "medium",
        examBlueprintTag: "PH-MECH-P-2026",
        build(rng) {
          const force = randomInt(rng, 50, 240);
          const area = Number((pick(rng, [0.2, 0.4, 0.5, 0.8, 1.0, 1.2])).toFixed(2));
          const answer = Number((force / area).toFixed(2));
          const data = makeChoiceQuestion(answer, numericDistractors(answer, rng, 10, 140), rng);

          return {
            prompt: `На площадь ${area} м² действует сила ${force} Н. Найдите давление.`,
            options: data.options,
            correctIndex: data.correctIndex,
            explanation: createExplanation({
              correctAnswer: String(answer),
              why: "Давление показывает силу, приходящуюся на единицу площади.",
              rule: "p = F / S.",
              formula: `p = ${force}/${area} = ${answer} Па`,
              stepByStep: "1) Подставьте F и S. 2) Разделите силу на площадь. 3) Ответ в паскалях.",
              commonMistakes: "Умножают F на S вместо деления.",
              alternateMethod: "Проверьте смысл: при меньшей площади давление должно быть больше.",
              recognitionTip: "Ключевой сигнал — одновременно даны сила и площадь.",
            }),
          };
        },
      },
      {
        key: "ph-circuit-hard",
        segment: "Электродинамика",
        topic: "Последовательное соединение",
        subtopic: "Эквивалентное сопротивление",
        difficulty: "hard",
        examBlueprintTag: "PH-EL-RSER-2026",
        build(rng) {
          const r1 = randomInt(rng, 2, 12);
          const r2 = randomInt(rng, 2, 12);
          const r3 = randomInt(rng, 1, 10);
          const answer = r1 + r2 + r3;
          const data = makeChoiceQuestion(answer, [r1 + r2, r2 + r3, Number((1 / (1 / r1 + 1 / r2 + 1 / r3)).toFixed(2))], rng);

          return {
            prompt: `Три резистора ${r1} Ом, ${r2} Ом и ${r3} Ом соединены последовательно. Найдите общее сопротивление.`,
            options: data.options,
            correctIndex: data.correctIndex,
            explanation: createExplanation({
              correctAnswer: String(answer),
              why: "При последовательном соединении ток один и тот же, а падения напряжений складываются.",
              rule: "Rобщ = R1 + R2 + R3 + ...",
              formula: `R = ${r1} + ${r2} + ${r3} = ${answer} Ом`,
              stepByStep: "1) Определите тип соединения. 2) Сложите сопротивления всех резисторов. 3) Запишите Ом.",
              commonMistakes: "Используют формулу параллельного соединения для последовательного.",
              alternateMethod: "Представьте цепочку как один длинный проводник: сопротивление должно расти при добавлении элементов.",
              recognitionTip: "Слово 'последовательно' => просто сумма сопротивлений.",
            }),
          };
        },
      },
      {
        key: "ph-efficiency-hard",
        segment: "Эксперимент и анализ",
        topic: "КПД устройства",
        subtopic: "Полезная и затраченная работа",
        difficulty: "hard",
        examBlueprintTag: "PH-EXP-ETA-2026",
        build(rng) {
          const useful = randomInt(rng, 120, 900);
          const spent = useful + randomInt(rng, 50, 500);
          const answer = Number(((useful / spent) * 100).toFixed(2));
          const data = makeChoiceQuestion(answer, numericDistractors(answer, rng, 2, 25), rng);

          return {
            prompt: `Полезная работа механизма ${useful} Дж, затраченная ${spent} Дж. Найдите КПД в процентах.`,
            options: data.options,
            correctIndex: data.correctIndex,
            explanation: createExplanation({
              correctAnswer: String(answer),
              why: "КПД показывает долю полезной энергии в общей затраченной.",
              rule: "η = Aпол / Aзатр × 100%.",
              formula: `η = ${useful}/${spent} × 100% = ${answer}%`,
              stepByStep: "1) Разделите полезную работу на затраченную. 2) Умножьте на 100%. 3) Округлите.",
              commonMistakes: "Меняют местами числитель и знаменатель.",
              alternateMethod: "Сначала найдите долю потерь, затем вычтите из 100%.",
              recognitionTip: "Если фигурируют 'полезная' и 'затраченная' работа, это задача на КПД.",
            }),
          };
        },
      },
      {
        key: "ph-optics-hard",
        segment: "Оптика и волны",
        topic: "Связь длины волны, частоты и скорости",
        subtopic: "Формула волны",
        difficulty: "hard",
        examBlueprintTag: "PH-OPT-WAVE-2026",
        build(rng) {
          const speed = pick(rng, [300, 330, 340, 1500]);
          const frequency = pick(rng, [50, 100, 120, 200, 400]);
          const answer = Number((speed / frequency).toFixed(3));
          const data = makeChoiceQuestion(answer, numericDistractors(answer, rng, 0.2, 3).map((x) => Number(x.toFixed(3))), rng);

          return {
            prompt: `Скорость волны ${speed} м/с, частота ${frequency} Гц. Найдите длину волны.`,
            options: data.options,
            correctIndex: data.correctIndex,
            explanation: createExplanation({
              correctAnswer: String(answer),
              why: "Длина волны — это путь, который проходит волна за один период.",
              rule: "λ = v / ν.",
              formula: `λ = ${speed}/${frequency} = ${answer} м`,
              stepByStep: "1) Подставьте скорость v и частоту ν. 2) Разделите v на ν. 3) Укажите метры.",
              commonMistakes: "Путают формулу и умножают v на ν.",
              alternateMethod: "Если известен период T, можно использовать λ = vT.",
              recognitionTip: "Когда даны v и ν, задача почти всегда решается одной формулой λ = v/ν.",
            }),
          };
        },
      },
      {
        key: "ph-analysis-medium",
        segment: "Эксперимент и анализ",
        topic: "Обработка измерений",
        subtopic: "Среднее значение",
        difficulty: "medium",
        examBlueprintTag: "PH-EXP-AVG-2026",
        build(rng) {
          const values = Array.from({ length: 4 }, () => randomInt(rng, 10, 30));
          const answer = Number((values.reduce((acc, value) => acc + value, 0) / values.length).toFixed(2));
          const data = makeChoiceQuestion(answer, numericDistractors(answer, rng, 1, 6), rng);

          return {
            prompt: `В эксперименте получили значения: ${values.join(", ")}. Найдите среднее значение величины.`,
            options: data.options,
            correctIndex: data.correctIndex,
            explanation: createExplanation({
              correctAnswer: String(answer),
              why: "Среднее арифметическое уменьшает влияние случайных отклонений отдельных измерений.",
              rule: "xср = (x1 + x2 + ... + xn) / n.",
              formula: `xср = (${values.join("+")}) / ${values.length} = ${answer}`,
              stepByStep: "1) Сложите все измерения. 2) Разделите на их количество. 3) Округлите по условию.",
              commonMistakes: "Делят не на число измерений, а на другое число.",
              alternateMethod: "Группируйте близкие числа попарно для более быстрого счета.",
              recognitionTip: "Фразы 'серия измерений' и 'среднее значение' сразу задают формулу среднего.",
            }),
          };
        },
      },
      {
        key: "ph-short-text-medium",
        maxUse: 3,
        segment: "Электродинамика",
        topic: "Физические величины и единицы",
        subtopic: "Текстовый краткий ответ",
        difficulty: "medium",
        examBlueprintTag: "PH-EL-SHORT-UNIT-2026",
        build(rng) {
          const item = pick(rng, [
            {
              prompt: "Как называется физическая величина, измеряемая в омах (Ω)?",
              answers: ["сопротивление", "электрическое сопротивление"],
              label: "Сопротивление",
            },
            {
              prompt: "Как называется физическая величина, измеряемая в амперах (A)?",
              answers: ["сила тока", "электрический ток", "ток"],
              label: "Сила тока",
            },
            {
              prompt: "Как называется физическая величина, измеряемая в вольтах (V)?",
              answers: ["напряжение", "электрическое напряжение"],
              label: "Напряжение",
            },
          ]);

          return {
            type: "short-text",
            format: "text",
            skill: "Связь физической величины и единицы измерения",
            expectedTimeSec: 110,
            sourceHint: "Базовый словарь физических величин",
            prompt: item.prompt,
            acceptedAnswers: item.answers,
            explanation: createExplanation({
              correctAnswer: item.label,
              why: "Название величины определяется по ее стандартной единице СИ.",
              rule:
                "Ом -> сопротивление, Ампер -> сила тока, Вольт -> напряжение.",
              formula:
                "Опора на закон Ома: I = U/R, где U (В), I (А), R (Ом).",
              stepByStep:
                "1) Определите данную единицу. 2) Вспомните, какой параметр она обозначает в формулах. 3) Запишите название величины.",
              commonMistakes:
                "Путают напряжение и силу тока из-за похожего контекста задач на электрические цепи.",
              alternateMethod:
                "Восстановите треугольник Ома и подпишите единицы рядом с каждой величиной.",
              recognitionTip:
                "Если в задаче фигурирует единица Ω, почти наверняка спрашивают сопротивление.",
            }),
            tags: ["short-text", "units", "electrodynamics"],
          };
        },
      },
      {
        key: "ph-experiment-matching-hard",
        singleUse: true,
        segment: "Эксперимент и анализ",
        topic: "Experimental-lite",
        subtopic: "Соответствие измерения и вывода",
        difficulty: "hard",
        examBlueprintTag: "PH-EXP-MATCH-2026",
        type: "matching",
        build() {
          return {
            type: "matching",
            format: "pair-mapping",
            skill: "Интерпретация экспериментальных наблюдений",
            expectedTimeSec: 190,
            sourceHint: "Физика: учебный аналог лабораторного анализа",
            prompt:
              "Сопоставьте наблюдение (слева) и корректный физический вывод (справа).",
            matching: {
              left: [
                { id: "m1", label: "При увеличении силы тока накал спирали лампы усиливается." },
                { id: "m2", label: "При увеличении площади опоры давление уменьшается." },
                { id: "m3", label: "При росте температуры газа (V=const) давление растет." },
              ],
              right: [
                { id: "r1", label: "Давление обратно пропорционально площади (p = F/S)." },
                { id: "r2", label: "При постоянном объеме p/T = const (T в K)." },
                { id: "r3", label: "Электрическая мощность в цепи увеличивается." },
              ],
            },
            matchPairs: { m1: "r3", m2: "r1", m3: "r2" },
            explanation: createExplanation({
              correctAnswer: "m1-r3, m2-r1, m3-r2",
              why: "Каждое наблюдение связано с конкретной формулой и причинной зависимостью.",
              rule:
                "Экспериментальный вывод должен опираться на наблюдаемый тренд и известный закон, а не на догадку.",
              formula:
                "Связки: p=F/S; p/T=const; P=UI (или P=I²R).",
              stepByStep:
                "1) Определите, какая величина меняется в наблюдении. 2) Выберите соответствующий закон. 3) Сопоставьте с корректным выводом.",
              commonMistakes:
                "Выбирают правдоподобный, но нерелевантный закон из другой темы.",
              alternateMethod:
                "Для каждого наблюдения выпишите ключевую величину (I, S, T) и от неё подберите формулу.",
              recognitionTip:
                "Если в наблюдении указано 'при увеличении X ...', ищите закон с прямой/обратной зависимостью от X.",
            }),
            tags: ["matching", "experiment-lite", "analysis"],
            requiredCoverage: true,
          };
        },
      },
      {
        key: "ph-experiment-numeric-medium",
        maxUse: 3,
        segment: "Эксперимент и анализ",
        topic: "Experimental-lite",
        subtopic: "Числовой расчет по данным таблицы",
        difficulty: "medium",
        examBlueprintTag: "PH-EXP-NUMERIC-2026",
        type: "numeric-input",
        build(rng) {
          const u = randomInt(rng, 4, 24);
          const i = Number((randomInt(rng, 2, 12) / 10).toFixed(1));
          const p = Number((u * i).toFixed(2));
          return {
            type: "numeric-input",
            format: "number",
            skill: "Расчет физической величины по экспериментальным данным",
            expectedTimeSec: 140,
            sourceHint: "Физика: таблица измерений (эксперимент-lite)",
            prompt:
              `Таблица измерений: напряжение U = ${u} В, сила тока I = ${i} А. Введите мощность P в ваттах.`,
            numericAnswer: p,
            tolerance: 0.02,
            explanation: createExplanation({
              correctAnswer: String(p),
              why: "Мощность электрического тока на участке цепи определяется произведением U и I.",
              rule: "P = U · I.",
              formula: `P = ${u} · ${i} = ${p} Вт`,
              stepByStep:
                "1) Считайте U и I из таблицы. 2) Умножьте U на I. 3) Запишите результат в ваттах.",
              commonMistakes:
                "Ошибаются в десятичной запятой при умножении дробного тока.",
              alternateMethod:
                "Можно сначала оценить порядок величины: при U≈10 В и I≈1 А мощность порядка 10 Вт.",
              recognitionTip:
                "Если даны одновременно U и I, чаще всего нужно найти мощность или сопротивление.",
            }),
            tags: ["numeric-input", "experiment-lite", "electricity"],
          };
        },
      },
      {
        key: "ph-experiment-short-hard",
        maxUse: 2,
        segment: "Эксперимент и анализ",
        topic: "Experimental-lite",
        subtopic: "Короткий вывод по графику",
        difficulty: "hard",
        examBlueprintTag: "PH-EXP-SHORT-2026",
        type: "short-text",
        build(rng) {
          const trend = pick(rng, [
            {
              graph:
                "На графике зависимости пути от времени прямая линия с постоянным наклоном.",
              q: "Какой тип движения показывает график? (1-2 слова)",
              answers: ["равномерное", "равномерное движение"],
              label: "Равномерное движение",
            },
            {
              graph:
                "На графике силы тока от напряжения прямая линия через начало координат.",
              q: "Какой закон подтверждает такой график? (1-3 слова)",
              answers: ["закон ома", "ом", "закон ома для участка цепи"],
              label: "Закон Ома",
            },
          ]);
          return {
            type: "short-text",
            format: "text",
            skill: "Интерпретация графика и формулировка вывода",
            expectedTimeSec: 140,
            sourceHint: "Физика: графический анализ данных",
            prompt: `${trend.graph} ${trend.q}`,
            acceptedAnswers: trend.answers,
            explanation: createExplanation({
              correctAnswer: trend.label,
              why: "Вывод делается по характеру графика: линейность, наклон и положение относительно осей.",
              rule:
                "Для графиков важно соотнести тип зависимости с физическим законом: прямая через начало часто означает пропорциональность.",
              formula:
                "Примеры: s = vt (равномерное движение), I = U/R (закон Ома при R=const).",
              stepByStep:
                "1) Определите тип линии на графике. 2) Проверьте, проходит ли она через начало. 3) Сформулируйте физический вывод.",
              commonMistakes:
                "Описывают график словами, но не делают физический вывод.",
              alternateMethod:
                "Возьмите две точки графика и проверьте, меняется ли отношение величин линейно.",
              recognitionTip:
                "Если график прямолинейный и без изломов, ищите закон с постоянным коэффициентом.",
            }),
            tags: ["short-text", "graph-analysis", "experiment-lite"],
          };
        },
      },
      {
        key: "ph-extended-lite-hard",
        singleUse: true,
        segment: "Эксперимент и анализ",
        topic: "Experimental-lite",
        subtopic: "Развернутый вывод по измерениям",
        difficulty: "hard",
        examBlueprintTag: "PH-EXP-EXT-2026",
        type: "extended-answer-lite",
        build() {
          return {
            type: "extended-answer-lite",
            format: "textarea-rubric-lite",
            skill: "Формулировка вывода по результатам измерений",
            expectedTimeSec: 270,
            sourceHint: "Физика: учебный аналог лабораторного вывода",
            prompt:
              "В двух опытах измеряли силу тока: при U=6 В получили I=0,3 А, при U=12 В получили I=0,6 А. Кратко объясните, какой вывод о зависимости I(U) можно сделать и какие источники ошибки измерений нужно учитывать.",
            rubric: {
              requiredKeyPoints: [
                "указана прямая пропорциональность",
                "сформулирован вывод о сопротивлении как постоянном",
                "упомянута хотя бы одна ошибка измерения",
              ],
              optionalKeyPoints: [
                "ссылка на закон ома",
                "предложение повторить измерения и усреднить",
              ],
              checklist: [
                "Есть вывод о зависимости между I и U",
                "Есть физическое объяснение (R = const)",
                "Указаны ограничения точности измерений",
              ],
              strongSample:
                "При увеличении напряжения в 2 раза сила тока тоже увеличилась в 2 раза, значит зависимость I от U линейная и для участка цепи сопротивление можно считать постоянным. Это согласуется с законом Ома I=U/R. Однако при реальном эксперименте возможны ошибки отсчета приборов и влияние нагрева проводника. Поэтому корректно повторить измерения несколько раз и оценить среднее значение.",
              typicalErrors: [
                "описан только факт роста без вывода о типе зависимости",
                "нет упоминания источников погрешности",
                "подмена вывода пересказом условия",
              ],
            },
            explanation: createExplanation({
              correctAnswer: "Ориентировочная учебная оценка по чек-листу.",
              why: "Задание проверяет умение делать физический вывод на основе данных, а не просто вычислять число.",
              rule:
                "Корректный экспериментальный вывод должен включать тенденцию, физическое объяснение и учет погрешностей.",
              formula: "I = U/R при R = const.",
              stepByStep:
                "1) Сравните пары (U, I). 2) Определите тип зависимости. 3) Дайте физическую интерпретацию. 4) Укажите возможные ошибки измерений.",
              commonMistakes:
                "Ограничиваются одной формулой без осмысленного вывода и анализа точности.",
              alternateMethod:
                "Рассчитайте отношение U/I в обоих опытах: если близко, это подтверждает постоянство сопротивления.",
              recognitionTip:
                "Если задача просит 'сделайте вывод по измерениям', важно написать и вывод, и ограничения эксперимента.",
            }),
            tags: ["extended-answer-lite", "experiment-lite", "analysis"],
            requiredCoverage: true,
          };
        },
      },
    ];
  }

  function englishFactories() {
    return [
      {
        key: "en-grammar-basic",
        segment: "Grammar",
        topic: "Basic tense choice",
        subtopic: "Present/Past/Continuous markers",
        difficulty: "basic",
        examBlueprintTag: "EN-GRAM-BASIC-2026",
        build(rng) {
          const item = pick(rng, EN_DATA.grammarBasic);
          const data = makeChoiceQuestion(item.correct, item.wrong, rng);
          return {
            prompt: item.prompt,
            options: data.options,
            correctIndex: data.correctIndex,
            explanation: createExplanation({
              correctAnswer: item.correct,
              why: "Time marker and context determine the tense form.",
              rule: item.rule,
              stepByStep:
                "1) Find the time marker (every day, yesterday, now). 2) Pick the tense. 3) Check subject-verb agreement.",
              commonMistakes:
                "Students choose a familiar form but ignore the exact time marker.",
              alternateMethod:
                "Try replacing the sentence with a Russian equivalent and identify whether the action is regular, finished in the past, or in progress now.",
              recognitionTip:
                "Words like now/look/at the moment usually signal Continuous; yesterday/last week signal Past Simple.",
            }),
          };
        },
      },
      {
        key: "en-grammar-medium",
        segment: "Grammar",
        topic: "Complex grammar",
        subtopic: "Conditionals and passive",
        difficulty: "medium",
        examBlueprintTag: "EN-GRAM-COMPLEX-2026",
        build(rng) {
          const item = pick(rng, EN_DATA.grammarMedium);
          const data = makeChoiceQuestion(item.correct, item.wrong, rng);
          return {
            prompt: item.prompt,
            options: data.options,
            correctIndex: data.correctIndex,
            explanation: createExplanation({
              correctAnswer: item.correct,
              why: "The structure of the sentence forces a specific grammar pattern.",
              rule: item.rule,
              stepByStep:
                "1) Identify the clause type. 2) Match it to the target grammar model. 3) Choose the form that keeps both tense logic and grammar agreement.",
              commonMistakes:
                "Mixing tenses in conditional clauses and using active forms where passive is required.",
              alternateMethod:
                "Rewrite the sentence as a full grammar pattern (If + ..., would + ... / be + V3) and test each option.",
              recognitionTip:
                "If you see 'if' with unreal condition or emphasis on object receiving action, think Second Conditional / Passive.",
            }),
          };
        },
      },
      {
        key: "en-grammar-hard-transform",
        segment: "Grammar",
        topic: "Advanced transformations",
        subtopic: "Inversion and mixed tense control",
        difficulty: "hard",
        examBlueprintTag: "EN-GRAM-ADV-2026",
        build(rng) {
          const item = pick(rng, [
            {
              prompt: "Choose the correct sentence.",
              correct: "Hardly had we started the test when the bell rang.",
              wrong: [
                "Hardly we had started the test when the bell rang.",
                "Hardly had we started the test than the bell rang.",
                "Hardly had we start the test when the bell rang.",
              ],
              rule:
                "After Hardly/Scarcely, inversion is used: Hardly + had + subject + V3 ... when ...",
            },
            {
              prompt: "Choose the correct sentence.",
              correct: "No sooner had she finished than she checked her answers again.",
              wrong: [
                "No sooner she had finished than she checked her answers again.",
                "No sooner had she finished when she checked her answers again.",
                "No sooner had she finish than she checked her answers again.",
              ],
              rule:
                "No sooner ... than ... requires inversion and Past Perfect in the first clause.",
            },
            {
              prompt: "Choose the correct sentence.",
              correct: "If I had revised the topic, I would be more confident now.",
              wrong: [
                "If I revised the topic, I would be more confident now.",
                "If I had revised the topic, I would have been more confident now.",
                "If I would revise the topic, I would be more confident now.",
              ],
              rule:
                "Mixed conditional: past condition (had + V3) with present result (would + base form).",
            },
          ]);

          const data = makeChoiceQuestion(item.correct, item.wrong, rng);
          return {
            prompt: item.prompt,
            options: data.options,
            correctIndex: data.correctIndex,
            explanation: createExplanation({
              correctAnswer: item.correct,
              why: "Only one option follows the exact transformation pattern required by exam grammar norms.",
              rule: item.rule,
              formula:
                "Patterns: Hardly/No sooner + had + subject + V3 ... when/than ...; Mixed conditional: If + had V3, would + V.",
              stepByStep:
                "1) Identify the trigger phrase (Hardly/No sooner/If ... had). 2) Check inversion and connector. 3) Verify the tense form in each clause.",
              commonMistakes:
                "Learners keep direct word order or mix up connectors when/than in inversion structures.",
              alternateMethod:
                "Rewrite the sentence into a neutral order first, then restore the target inversion pattern.",
              recognitionTip:
                "If a sentence starts with Hardly/No sooner, expect inversion immediately after the trigger phrase.",
            }),
          };
        },
      },
      {
        key: "en-vocab-medium",
        segment: "Vocabulary",
        topic: "Collocations and phrasal verbs",
        subtopic: "Natural combinations",
        difficulty: "medium",
        examBlueprintTag: "EN-LEX-COLL-2026",
        build(rng) {
          const item = pick(rng, EN_DATA.vocabulary);
          const data = makeChoiceQuestion(item.correct, item.wrong, rng);
          return {
            prompt: item.prompt,
            options: data.options,
            correctIndex: data.correctIndex,
            explanation: createExplanation({
              correctAnswer: item.correct,
              why: "This is the standard collocation used in exam and real communication.",
              rule: "Vocabulary tasks often test fixed word combinations rather than direct translation.",
              stepByStep:
                "1) Read the whole phrase, not a single word. 2) Recall common collocations. 3) Reject options that are grammatically possible but unnatural.",
              commonMistakes: "Literal translation from Russian leads to incorrect collocations.",
              alternateMethod:
                "Put each option into a short real-life sentence and listen if it sounds natural.",
              recognitionTip:
                "If two options are synonyms in dictionary, only one may form the tested collocation.",
            }),
          };
        },
      },
      {
        key: "en-reading-hard",
        segment: "Reading",
        topic: "Inference",
        subtopic: "Meaning between lines",
        difficulty: "hard",
        examBlueprintTag: "EN-READ-INF-2026",
        build(rng) {
          const item = pick(rng, EN_DATA.readingHard);
          const data = makeChoiceQuestion(item.correct, item.wrong, rng);
          return {
            prompt: `${item.text} ${item.question}`,
            options: data.options,
            correctIndex: data.correctIndex,
            explanation: createExplanation({
              correctAnswer: item.correct,
              why: "The correct answer follows the author's implied idea, not just one isolated word.",
              rule: "Inference questions require combining several text clues and avoiding extreme interpretations.",
              stepByStep:
                "1) Find key verbs that show intention/result. 2) Remove options not supported by text. 3) Choose the option that best summarizes implied meaning.",
              commonMistakes:
                "Selecting options with familiar words that are not actually supported by the text.",
              alternateMethod:
                "Paraphrase the text in your own words first, then compare with answer options.",
              recognitionTip:
                "If an option sounds too absolute (always/never), it is often a distractor.",
            }),
          };
        },
      },
      {
        key: "en-use-hard",
        segment: "Use of English",
        topic: "Error spotting",
        subtopic: "Typical exam traps",
        difficulty: "hard",
        examBlueprintTag: "EN-USE-TRAP-2026",
        build(rng) {
          const item = pick(rng, [
            {
              prompt: "Choose the sentence without a grammar mistake.",
              correct: "Neither of the answers is correct.",
              wrong: [
                "Neither of the answers are correct.",
                "Neither of the answer is correct.",
                "Neither answers is correct.",
              ],
              rule: "After neither of + plural noun, singular verb is common in exam norm.",
            },
            {
              prompt: "Choose the sentence without a grammar mistake.",
              correct: "He suggested going over the task once again.",
              wrong: [
                "He suggested to go over the task once again.",
                "He suggested that go over the task once again.",
                "He suggested go overing the task once again.",
              ],
              rule: "After suggest, use gerund or that-clause, but not infinitive with to in this pattern.",
            },
            {
              prompt: "Choose the sentence without a grammar mistake.",
              correct: "By next week, we will have finished this module.",
              wrong: [
                "By next week, we will finished this module.",
                "By next week, we have finished this module.",
                "By next week, we will have finish this module.",
              ],
              rule: "Future Perfect is used for completion before a future point.",
            },
          ]);

          const data = makeChoiceQuestion(item.correct, item.wrong, rng);
          return {
            prompt: item.prompt,
            options: data.options,
            correctIndex: data.correctIndex,
            explanation: createExplanation({
              correctAnswer: item.correct,
              why: "Only one option follows the grammar pattern exactly.",
              rule: item.rule,
              stepByStep:
                "1) Locate the grammar trigger (neither/suggest/by next week). 2) Recall the precise pattern. 3) Eliminate options with structural mismatch.",
              commonMistakes:
                "Students focus on meaning and miss agreement or verb-form mismatch.",
              alternateMethod:
                "Transform each option into a mini-rule and check if the rule exists in grammar reference.",
              recognitionTip:
                "Trap tasks often differ by one small form: -s, to, or V3.",
            }),
          };
        },
      },
      {
        key: "en-communication-hard",
        segment: "Communication",
        topic: "Functional language",
        subtopic: "Polite interaction",
        difficulty: "hard",
        examBlueprintTag: "EN-COMM-POLITE-2026",
        build(rng) {
          const item = pick(rng, EN_DATA.communicationHard);
          const data = makeChoiceQuestion(item.correct, item.wrong, rng);
          return {
            prompt: item.prompt,
            options: data.options,
            correctIndex: data.correctIndex,
            explanation: createExplanation({
              correctAnswer: item.correct,
              why: "The correct option is both grammatically accurate and pragmatically appropriate.",
              rule: "In exam communication tasks, tone and politeness markers are part of correctness.",
              stepByStep:
                "1) Check grammar. 2) Check politeness level. 3) Choose the line that fits formal/neutral school context.",
              commonMistakes:
                "Choosing direct or aggressive phrases that are grammatically possible but pragmatically wrong.",
              alternateMethod:
                "Ask yourself: would this line be acceptable in an email to a teacher?",
              recognitionTip:
                "Words like could, please, would you mind are strong indicators of polite functional language.",
            }),
          };
        },
      },
      {
        key: "en-grammar-basic-articles",
        segment: "Grammar",
        topic: "Articles and prepositions",
        subtopic: "Frequent exam contexts",
        difficulty: "medium",
        examBlueprintTag: "EN-GRAM-ART-2026",
        build(rng) {
          const item = pick(rng, [
            {
              prompt: "___ Volga is one of the longest rivers in Europe.",
              correct: "The",
              wrong: ["A", "An", "-"],
              rule: "Names of rivers usually take the definite article.",
            },
            {
              prompt: "The exam starts ___ 10 o'clock.",
              correct: "at",
              wrong: ["in", "on", "for"],
              rule: "Use 'at' with exact time.",
            },
            {
              prompt: "She is interested ___ robotics.",
              correct: "in",
              wrong: ["on", "at", "for"],
              rule: "Fixed collocation: interested in.",
            },
          ]);
          const data = makeChoiceQuestion(item.correct, item.wrong, rng);

          return {
            prompt: item.prompt,
            options: data.options,
            correctIndex: data.correctIndex,
            explanation: createExplanation({
              correctAnswer: item.correct,
              why: "This option follows the standard article/preposition rule.",
              rule: item.rule,
              stepByStep:
                "1) Identify the noun/time/collocation type. 2) Recall the fixed rule. 3) Remove options that violate the pattern.",
              commonMistakes:
                "Learners transfer Russian preposition logic directly into English.",
              alternateMethod:
                "Memorize target chunks (at 10, interested in, the Volga) instead of isolated words.",
              recognitionTip:
                "Short grammar tasks are often chunk-recognition tasks in disguise.",
            }),
          };
        },
      },
      {
        key: "en-vocab-hard",
        segment: "Vocabulary",
        topic: "Word formation",
        subtopic: "Part of speech conversion",
        difficulty: "hard",
        examBlueprintTag: "EN-LEX-WF-2026",
        build(rng) {
          const item = pick(rng, [
            {
              prompt: "Choose the correct word: Her explanation was very ___. (logic)",
              correct: "logical",
              wrong: ["logically", "logic", "logician"],
            },
            {
              prompt: "Choose the correct word: It was a ___ decision. (care)",
              correct: "careful",
              wrong: ["carefully", "care", "careless"],
            },
            {
              prompt: "Choose the correct word: The report was full of useful ___. (inform)",
              correct: "information",
              wrong: ["informative", "informer", "inform"],
            },
          ]);

          const data = makeChoiceQuestion(item.correct, item.wrong, rng);
          return {
            prompt: item.prompt,
            options: data.options,
            correctIndex: data.correctIndex,
            explanation: createExplanation({
              correctAnswer: item.correct,
              why: "The sentence position requires a specific part of speech.",
              rule: "Word formation tasks check suffix/prefix choice and part-of-speech control.",
              stepByStep:
                "1) Determine what part of speech is needed. 2) Choose the form with correct suffix/prefix. 3) Verify full sentence grammar.",
              commonMistakes:
                "Choosing an adverb where an adjective is needed (or vice versa).",
              alternateMethod:
                "Ask a quick structural question: 'What can stand after was/very/the?'",
              recognitionTip:
                "After 'very' before noun/implicit noun, adjective is commonly needed.",
            }),
          };
        },
      },
      {
        key: "en-fill-blank-medium",
        singleUse: true,
        segment: "Use of English",
        topic: "Context grammar completion",
        subtopic: "Fill-in-the-blank",
        difficulty: "medium",
        examBlueprintTag: "EN-USE-FILL-2026",
        build(rng) {
          const item = pick(rng, [
            {
              text: "If I ___ (know) about the extra class, I would have come earlier.",
              blanks: [{ id: "b1", label: "Word form" }],
              correct: [["had known"]],
              why: "This is a third conditional pattern about an unreal past situation.",
              rule: "If + Past Perfect, would have + V3.",
            },
            {
              text: "By the time we arrived, the teacher ___ already ___ (check) the papers.",
              blanks: [
                { id: "b1", label: "Auxiliary" },
                { id: "b2", label: "Participle" },
              ],
              correct: [["had"], ["checked"]],
              why: "Action was completed before another past action, so Past Perfect is needed.",
              rule: "Past Perfect: had + V3.",
            },
          ]);

          return {
            type: "fill-in-the-blank",
            format: "blank-input",
            skill: "Applying tense patterns in context",
            expectedTimeSec: 150,
            sourceHint: "Grammar-in-context completion",
            prompt: item.text,
            blanks: item.blanks,
            correctBlanks: item.correct,
            explanation: createExplanation({
              correctAnswer: item.correct.map((x) => x[0]).join(" / "),
              why: item.why,
              rule: item.rule,
              formula:
                "Pattern recognition: identify timeline -> choose grammar model -> insert exact form.",
              stepByStep:
                "1) Find time markers. 2) Determine clause relation (past-before-past / unreal past). 3) Fill each blank with the exact form.",
              commonMistakes:
                "Using Past Simple where Past Perfect is required for sequence of past events.",
              alternateMethod:
                "Draw a quick timeline with two events and check which one happened first.",
              recognitionTip:
                "Markers like 'By the time...' and unreal 'If...' usually point to perfect forms.",
            }),
            tags: ["fill-in-the-blank", "grammar", "tenses"],
          };
        },
      },
      {
        key: "en-listening-lite-multi",
        maxUse: 2,
        segment: "Reading",
        topic: "Listening-lite comprehension",
        subtopic: "Понимание основной информации после прослушивания",
        difficulty: "medium",
        examBlueprintTag: "EN-LISTEN-LITE-2026",
        type: "multi-choice",
        build(rng) {
          const item = pick(rng, [
            {
              clip: "A student explains how she plans revision week by week and leaves one day for error review.",
              q: "Choose ALL true statements according to the listening.",
              options: [
                "She plans revision by weeks.",
                "She never reviews mistakes.",
                "She keeps one day for error review.",
                "She studies only one subject all week.",
              ],
              correctAnswers: [0, 2],
            },
            {
              clip: "Two classmates discuss mock exams and agree that checking wrong answers is more important than counting solved tasks.",
              q: "Choose ALL statements supported by the listening.",
              options: [
                "They think mock exams are useless.",
                "They value error analysis.",
                "They focus only on number of tasks.",
                "They discuss preparation strategy together.",
              ],
              correctAnswers: [1, 3],
            },
          ]);
          return {
            type: "multi-choice",
            format: "multi-select",
            skill: "Listening comprehension (learning analogue)",
            expectedTimeSec: 170,
            sourceHint: "English: listening-lite with local/mock audio",
            prompt: `${item.q}`,
            options: item.options,
            correctAnswers: item.correctAnswers,
            media: {
              type: "audio",
              localFile: "",
              description:
                "Если локальный аудиофайл подключен, прослушайте его. Если нет, используйте mock audio/transcript.",
              mockTranscript: item.clip,
            },
            explanation: createExplanation({
              correctAnswer: item.correctAnswers.map((index) => String(index + 1)).join(", "),
              why: "Верные пункты должны подтверждаться содержанием фрагмента, а не общими догадками.",
              rule:
                "В listening-задачах сначала фиксируйте ключевые факты, затем соотносите их с формулировками вариантов.",
              formula:
                "Стратегия: first listening -> key words -> option check.",
              stepByStep:
                "1) Прослушайте/прочитайте mock-фрагмент. 2) Выпишите 2-3 ключевые факта. 3) Отметьте все варианты, которые точно подтверждаются.",
              commonMistakes:
                "Выбор варианта по знакомым словам без проверки смысла всей фразы.",
              alternateMethod:
                "Исключайте варианты с абсолютными утверждениями (always/never), если они не звучат в записи явно.",
              recognitionTip:
                "Если вариант добавляет новый факт, которого не было в аудио, это почти всегда дистрактор.",
            }),
            tags: ["multi-choice", "listening-lite", "comprehension"],
            requiredCoverage: true,
          };
        },
      },
      {
        key: "en-speaking-lite-extended",
        singleUse: true,
        segment: "Communication",
        topic: "Speaking-lite",
        subtopic: "Карточка устного ответа с самопроверкой",
        difficulty: "hard",
        examBlueprintTag: "EN-SPEAK-LITE-2026",
        type: "extended-answer-lite",
        build() {
          return {
            type: "extended-answer-lite",
            format: "textarea-rubric-lite",
            skill: "Монологическое высказывание по карточке",
            expectedTimeSec: 260,
            sourceHint: "English: speaking-lite training card",
            prompt:
              "Task card: Explain how you prepare for exams and what helps you stay calm. Write key speaking points in English (4-6 sentences).",
            speakingLite: {
              prepSec: 90,
              answerSec: 120,
              taskCard:
                "Говорение (учебный аналог): подготовка 90 сек, ответ 120 сек.",
              sampleAnswer:
                "I usually prepare for exams with a clear weekly plan. First, I revise difficult topics and then I check my mistakes. This helps me see progress and feel more confident. I also take short breaks, so I can stay focused. As a result, I am less stressed before exam day.",
              checklist: [
                "You answered the topic directly",
                "You used linking words (first, then, as a result)",
                "You gave at least one personal example",
                "Grammar and vocabulary are mostly accurate",
              ],
            },
            rubric: {
              requiredKeyPoints: [
                "clear preparation strategy",
                "one concrete action",
                "result or conclusion",
              ],
              optionalKeyPoints: [
                "linking words",
                "personal example",
              ],
              checklist: [
                "Есть вступление и основная мысль",
                "Есть как минимум один конкретный пример",
                "Есть завершение/вывод",
              ],
              strongSample:
                "I prepare for exams step by step. First, I make a weekly plan and focus on weak topics. Then I solve practice tasks and analyze my mistakes. This method helps me understand what I should improve. As a result, I feel calmer and more confident before the exam.",
              typicalErrors: [
                "список фраз без связок",
                "нет личного примера",
                "нет итогового вывода",
              ],
            },
            explanation: createExplanation({
              correctAnswer: "Ориентировочная учебная оценка speaking-lite по чек-листу.",
              why: "В офлайн-режиме это учебный аналог устного ответа с самопроверкой.",
              rule:
                "Сильный монолог: тезис -> 2-3 связанных пункта -> личный пример -> вывод.",
              formula: "Intro + 2 key ideas + example + conclusion.",
              stepByStep:
                "1) Сформулируйте главную мысль. 2) Добавьте конкретные действия подготовки. 3) Завершите выводом о результате.",
              commonMistakes:
                "Короткие несвязанные фразы без структуры и логических связок.",
              alternateMethod:
                "Сначала составьте план из 4 пунктов, потом разверните каждый в 1 предложение.",
              recognitionTip:
                "Если можете кратко ответить по схеме 'what I do -> why -> result', ответ обычно получается сильнее.",
            }),
            tags: ["extended-answer-lite", "speaking-lite", "communication"],
            requiredCoverage: true,
          };
        },
      },
      {
        key: "en-writing-lite-extended",
        singleUse: true,
        segment: "Communication",
        topic: "Writing-lite",
        subtopic: "Короткий письменный ответ с rubic-lite",
        difficulty: "hard",
        examBlueprintTag: "EN-WRITE-LITE-2026",
        type: "extended-answer-lite",
        build() {
          return {
            type: "extended-answer-lite",
            format: "textarea-rubric-lite",
            skill: "Структурированный письменный ответ",
            expectedTimeSec: 300,
            sourceHint: "English: writing-lite training",
            prompt:
              "Write a short message (80-100 words): advise your friend how to prepare for exams effectively.",
            writingLite: {
              prompt: "Письмо-совет другу о подготовке к экзаменам (учебный аналог).",
              expectedStructure: [
                "Greeting and purpose",
                "2-3 practical recommendations",
                "Encouraging conclusion",
              ],
              keyPoints: [
                "planning",
                "practice tests",
                "error analysis",
                "time management",
              ],
              sampleStrongAnswer:
                "Hi Alex, I know exam preparation can be stressful, but a clear plan really helps. First, divide topics by weeks and start with difficult ones. Then solve practice tests and always review your mistakes. It is also important to set short daily goals and take small breaks. This way you stay focused and see progress. Good luck, you can do it!",
            },
            rubric: {
              requiredKeyPoints: [
                "at least two practical recommendations",
                "clear structure with ending",
                "supportive communication tone",
              ],
              optionalKeyPoints: [
                "linking words",
                "time-management advice",
              ],
              checklist: [
                "Есть структура: начало, рекомендации, завершение",
                "Есть минимум 2 конкретных совета",
                "Тон письма дружелюбный и уместный",
              ],
              strongSample:
                "Hi! If you want to prepare better for exams, start with a weekly plan. Focus on weak topics first and solve practice tasks every day. After each task, check mistakes and write short notes about them. Try to manage your time and keep short breaks, so you do not get tired. I am sure this strategy will help you feel confident on exam day.",
              typicalErrors: [
                "слишком общий текст без конкретных советов",
                "нет завершения письма",
                "неподходящий тон общения",
              ],
            },
            explanation: createExplanation({
              correctAnswer: "Оценивается как writing-lite по чек-листу и ключевым элементам.",
              why: "Задание развивает структуру письменного ответа и аргументацию в формате письма.",
              rule:
                "Для письма-совета важны логика структуры, конкретные рекомендации и уместный коммуникативный тон.",
              formula: "Opening -> Advice 1/2/3 -> Closing.",
              stepByStep:
                "1) Сформулируйте цель письма. 2) Дайте 2-3 конкретных совета. 3) Завершите поддерживающим выводом.",
              commonMistakes:
                "Пересказ темы без конкретных действий, которые может сделать адресат.",
              alternateMethod:
                "Сначала напишите план из трех частей, потом заполните каждую часть 2-3 фразами.",
              recognitionTip:
                "Если в тексте есть понятные шаги (plan, practice, review), ответ обычно ближе к сильному.",
            }),
            tags: ["extended-answer-lite", "writing-lite", "communication"],
            requiredCoverage: true,
          };
        },
      },
      {
        key: "en-short-text-grammar-medium",
        maxUse: 3,
        segment: "Use of English",
        topic: "Short response grammar",
        subtopic: "Короткий текстовый ответ",
        difficulty: "medium",
        examBlueprintTag: "EN-USE-SHORT-2026",
        type: "short-text",
        build(rng) {
          const item = pick(rng, [
            {
              prompt: "Complete with one word: She has lived here ___ 2019.",
              answers: ["since"],
              label: "since",
            },
            {
              prompt: "Complete with one word: We are looking forward ___ meeting you.",
              answers: ["to"],
              label: "to",
            },
          ]);
          return {
            type: "short-text",
            format: "text",
            skill: "Точный выбор грамматического маркера",
            expectedTimeSec: 95,
            sourceHint: "English: short-text grammar checkpoint",
            prompt: item.prompt,
            acceptedAnswers: item.answers,
            explanation: createExplanation({
              correctAnswer: item.label,
              why: "В контексте требуется точный грамматический маркер/предлог.",
              rule:
                "В устойчивых грамматических моделях выбор слова определяется не переводом, а правилом конструкции.",
              formula:
                "Examples: since + point in time; look forward to + V-ing.",
              stepByStep:
                "1) Определите грамматическую модель. 2) Вспомните фиксированный маркер. 3) Введите одно слово.",
              commonMistakes:
                "Выбирают слово по смыслу, но нарушают устойчивую грамматическую модель.",
              alternateMethod:
                "Восстановите всю фразу как готовый chunk и проверьте звучание.",
              recognitionTip:
                "Если задание просит 'one word', почти всегда проверяется фиксированная конструкция.",
            }),
            tags: ["short-text", "grammar", "use-of-english"],
          };
        },
      },
    ];
  }

  function buildFactoryMap() {
    return {
      russian: russianFactories(),
      math: mathFactories(),
      physics: physicsFactories(),
      english: englishFactories(),
    };
  }

  function createEmergencyFactories(subjectKey) {
    const config = SUBJECT_CONFIG[subjectKey];
    if (!config) {
      return [];
    }

    const difficultyCycle = ["basic", "medium", "hard", "medium", "hard"];
    return config.mandatorySegments.map((segment, index) => {
      const difficulty = difficultyCycle[index % difficultyCycle.length];
      return {
        key: `${subjectKey}-emergency-${index + 1}`,
        segment,
        topic: "Аварийный набор",
        subtopic: "Базовый вопрос",
        difficulty,
        examBlueprintTag: `${subjectKey.toUpperCase()}-EMERGENCY-${index + 1}`,
        skill: `Базовая проверка: ${segment}`,
        requiredCoverage: true,
        build(rng) {
          const variants = [
            {
              prompt: `${segment}: выберите корректное утверждение для базовой проверки.`,
              correct: "Это временный аварийный вопрос для продолжения тренировки.",
              wrong: [
                "Этот вариант заведомо некорректен.",
                "Ответ содержит типичную ошибку формулировки.",
                "Выбран отвлекающий вариант без опоры на правило.",
              ],
            },
            {
              prompt: `${segment}: найдите наиболее точный ответ по правилу.`,
              correct: "Верно: выбор делается по правилу и шагам решения.",
              wrong: [
                "Неверно: выбор делается наугад без проверки.",
                "Неверно: игнорируется условие задания.",
                "Неверно: подменяется понятие темы.",
              ],
            },
          ];
          const item = pick(rng, variants);
          const data = makeChoiceQuestion(item.correct, item.wrong, rng);
          return {
            prompt: item.prompt,
            options: data.options,
            correctIndex: data.correctIndex,
            explanation: createExplanation({
              correctAnswer: item.correct,
              why:
                "Временный вопрос помогает не останавливать сессию, пока основной банк восстанавливается.",
              rule: "Ответ выбирается по правилу, а не по интуитивному сходству формулировок.",
              stepByStep:
                "1) Прочитайте условие. 2) Сверьте варианты с правилом. 3) Уберите отвлекающие ответы.",
              commonMistakes:
                "Типичная ошибка — выбирать вариант, который звучит знакомо, но не следует правилу.",
              alternateMethod:
                "Переформулируйте условие своими словами и проверьте, какой вариант ему действительно соответствует.",
              recognitionTip:
                "Если вариант не объясняется через правило, чаще всего это дистрактор.",
            }),
          };
        },
      };
    });
  }

  function validateFactoryCoverage(factoryMap) {
    Object.entries(SUBJECT_CONFIG).forEach(([subjectKey, config]) => {
      const factories = factoryMap[subjectKey];
      if (!Array.isArray(factories) || !factories.length) {
        throw new Error(`Нет фабрик для предмета ${subjectKey}`);
      }

      const segmentSet = new Set();
      const keySet = new Set();
      let hardCount = 0;

      factories.forEach((factory, index) => {
        if (!factory || typeof factory !== "object") {
          throw new Error(`Некорректная фабрика в ${subjectKey} на позиции ${index}`);
        }

        const requiredFields = ["key", "segment", "topic", "subtopic", "difficulty", "examBlueprintTag", "build"];
        requiredFields.forEach((field) => {
          if (!factory[field]) {
            throw new Error(`Фабрика ${subjectKey}[${index}] не содержит обязательное поле ${field}`);
          }
        });

        if (typeof factory.build !== "function") {
          throw new Error(`Фабрика ${factory.key} в ${subjectKey} не содержит build-функцию`);
        }

        if (keySet.has(factory.key)) {
          throw new Error(`Дублирующийся key фабрики в ${subjectKey}: ${factory.key}`);
        }
        keySet.add(factory.key);
        segmentSet.add(factory.segment);

        if (factory.difficulty === "hard") {
          hardCount += 1;
        }
      });

      const missingSegments = config.mandatorySegments.filter((segment) => !segmentSet.has(segment));
      if (missingSegments.length) {
        throw new Error(`Предмет ${subjectKey} не покрывает сегменты: ${missingSegments.join(", ")}`);
      }

      if (hardCount < 2) {
        throw new Error(`В предмете ${subjectKey} недостаточно сложных фабрик (hard): ${hardCount}`);
      }
    });
  }

  let FACTORIES = {};
  let FACTORY_VALIDATION_ERROR = null;
  let builtFactories = {};
  try {
    builtFactories = buildFactoryMap();
    validateFactoryCoverage(builtFactories);
    FACTORIES = builtFactories;
  } catch (error) {
    FACTORY_VALIDATION_ERROR = error;
    if (global && global.console && typeof global.console.error === "function") {
      global.console.error("QuestionBank factory validation warning:", error);
    }
    FACTORIES = builtFactories && Object.keys(builtFactories).length ? builtFactories : {};
    Object.keys(SUBJECT_CONFIG).forEach((subjectKey) => {
      if (!Array.isArray(FACTORIES[subjectKey])) {
        FACTORIES[subjectKey] = [];
      }
    });
  }

  Object.keys(SUBJECT_CONFIG).forEach((subjectKey) => {
    if (!Array.isArray(FACTORIES[subjectKey])) {
      FACTORIES[subjectKey] = [];
    }
    if (!FACTORIES[subjectKey].length) {
      FACTORIES[subjectKey] = createEmergencyFactories(subjectKey);
    }
  });

  const VARIANT_CACHE = new Map();
  const VARIANT_DIAGNOSTICS_CACHE = new Map();
  const QUESTION_POOL_CACHE = new Map();
  const COVERAGE_CACHE = new Map();
  const OFFICIAL_QUESTION_POOL = {
    russian: [],
    math: [],
    physics: [],
    english: [],
  };
  const OFFICIAL_PACK_STATE = {
    version: OFFICIAL_PACK_FORMAT_VERSION,
    source: "",
    importedAt: null,
    years: [],
    totalQuestions: 0,
    bySubject: {
      russian: 0,
      math: 0,
      physics: 0,
      english: 0,
    },
  };

  function createCoverageMetadata(factoryMap) {
    const coverage = {};
    Object.entries(factoryMap).forEach(([subjectKey, factories]) => {
      coverage[subjectKey] = factories.map((factory) => {
        const type = normalizeQuestionType(factory.type || "single-choice");
        return {
          subject: subjectKey,
          section: factory.segment,
          topic: factory.topic,
          subtopic: factory.subtopic,
          skill: factory.skill || factory.topic,
          questionType: type,
          answerFormat: (QUESTION_TYPE_META[type] && QUESTION_TYPE_META[type].answerFormat) || "single-select",
          difficulty: factory.difficulty,
          examBlueprintTag: factory.examBlueprintTag,
          requiredCoverage:
            factory.requiredCoverage !== undefined
              ? Boolean(factory.requiredCoverage)
              : SUBJECT_CONFIG[subjectKey].mandatorySegments.includes(factory.segment),
        };
      });
    });
    return coverage;
  }

  const CONTENT_COVERAGE_MAP = createCoverageMetadata(FACTORIES);

  function cacheKey(...parts) {
    return parts.join("::");
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function resetDerivedCaches() {
    VARIANT_CACHE.clear();
    VARIANT_DIAGNOSTICS_CACHE.clear();
    QUESTION_POOL_CACHE.clear();
    COVERAGE_CACHE.clear();
  }

  function normalizeYearToken(value) {
    const numeric = Number(value);
    if (Number.isInteger(numeric) && numeric >= 2014 && numeric <= 2100) {
      return numeric;
    }
    const text = String(value || "").trim();
    const match = text.match(/(20\d{2})/);
    return match ? Number(match[1]) : null;
  }

  function buildOfficialId(subjectKey, year, variant, index, prompt, source) {
    const token = hashString(`${subjectKey}|${year || "na"}|${variant || "na"}|${index}|${source || ""}|${prompt || ""}`)
      .toString(36)
      .slice(0, 8);
    const yearPart = year || "na";
    const variantPart = Number.isInteger(Number(variant)) ? String(Number(variant)) : "na";
    return `official-${subjectKey}-${yearPart}-v${variantPart}-q${index + 1}-${token}`;
  }

  function normalizeOfficialSourceHint(source, year, variant) {
    const sourceText = source ? String(source) : "ФИПИ/пробник";
    const yearText = year ? ` ${year}` : "";
    const variantText = Number.isInteger(Number(variant)) ? `, вариант ${Number(variant)}` : "";
    return `Официальный материал ${sourceText}${yearText}${variantText}`;
  }

  function defaultExamTag(subjectKey, year) {
    return `OFFICIAL-${String(subjectKey || "").toUpperCase()}-${year || "UNK"}`;
  }

  const RUSSIAN_RECOVERY_TEXT_2026 = [
    "(1)После своего исторического полёта Юрий Гагарин стал нарасхват.",
    "(2)Его хотели видеть все страны и все народы, короли и президенты, люди военных и штатских профессий.",
    "(3)И Гагарин охотно встречался со всеми желающими.",
    "(4)Но охотнее всего шёл он к курсантам лётных училищ, как бы возвращался в собственную юность.",
    "(5)Как-то раз, когда официальная встреча уже закончилась, один из курсантов спросил: «О чём вы думали тогда?»",
    "(6)Гагарин улыбнулся, а курсанты вокруг захохотали.",
    "(7)«Ну, в общем… я это хотел спросить… когда вы по дорожке шли?» — уточнил курсант.",
    "(8)Курсанты снова грохнули, но Гагарин остался подчёркнуто серьёзен.",
    "(9)«Вы имеете в виду Внуковский аэродром?» — спросил он.",
    "(10)«Правительство?»",
    "(11)«Во… во!..» — обрадовался курсант.",
    "(12)Теперь уже все были серьёзны, потому что в наивном вопросе была затронута важная тема молодых душ.",
    "(13)Гагарин шёл через аэродром, и это было для него кульминацией жизни героя.",
    "(14)О чём же думал герой в эти высшие мгновения своей жизни?",
  ].join(" ");

  function createRussianRecoveryQuestions2026() {
    const sourceHint = "Восстановленный учебный блок по демоверсии ФИПИ 2026";
    const topic = "Официальная демоверсия ФИПИ 2026 (восстановленные задания)";
    const tag = "OFFICIAL-RUSSIAN-2026";
    const base = {
      subject: "russian",
      year: 2026,
      variant: 1,
      topic,
      difficulty: "medium",
      examBlueprintTag: tag,
      sourceHint,
      requiredCoverage: true,
      tags: ["official", "fipi-aligned", "recovered-official-demo-2026"],
      explanation: createExplanation({
        correctAnswer: "Сверьтесь с официальным ключом демоверсии 2026.",
        rule: "Используйте языковое правило из кодификатора и проверьте формат ответа.",
        why: "Задание восстановлено по структуре официальной демоверсии 2026.",
      }),
    };

    return [
      {
        ...base,
        id: "official-russian-2026-recovery-5",
        segment: "Пунктуация",
        subtopic: "Задание 5",
        type: "short-text",
        prompt:
          "Расставьте знаки препинания. Укажите все цифры, на месте которых должны стоять запятые.\n\nКремль (1) самая древняя часть столицы России (2) расположенная на берегу Москвы-реки. Именно здесь (3) на Боровицком холме (4) ещё в середине XII века князь Юрий Долгорукий основал усадьбу-крепость (5) впервые упомянутую в 1147 году. Примечательно (6) что стены и башни Кремля были воздвигнуты из красного кирпича (7) на месте прежних белокаменных в конце XV века (8) а колокольня Ивана Великого (9) самое высокое здание на Руси тех времён.",
        acceptedAnswers: ["234568", "2 3 4 5 6 8", "2,3,4,5,6,8"],
      },
      {
        ...base,
        id: "official-russian-2026-recovery-6",
        segment: "Орфография",
        subtopic: "Задание 6",
        type: "short-text",
        prompt:
          "Укажите варианты ответов, в которых дано верное объяснение написания выделенного слова. Запишите номера ответов.\n\n1) ПРИТОРМОЗИТЬ - написание приставки определяется её значением - присоединение.\n2) ЛЬНЯНОЙ - в суффиксе прилагательного, образованного от основы имени существительного с помощью суффикса -ЯН-, пишется одна буква Н.\n3) В АКВАРИУМЕ - в форме дательного падежа единственного числа имени существительного 2-го склонения пишется окончание -Е.\n4) НЕ С КЕМ - НЕ с притяжательным местоимением пишется раздельно.\n5) БЕСШУМНЫЙ - на конце приставки перед буквой, обозначающей глухой согласный, пишется буква С.",
        acceptedAnswers: ["25", "2 5", "2,5"],
      },
      {
        ...base,
        id: "official-russian-2026-recovery-7",
        segment: "Орфография",
        subtopic: "Задание 7",
        type: "short-text",
        prompt:
          "Прочитайте текст. Вставьте пропущенные буквы. Укажите все цифры, на месте которых пишется буква И.\n\nВ продолжени..(1) двух часов пут..(2)шественники проб..(3)рались к озеру, обходя тр..(4)сины и пытаясь от..(5)скать удобные проходы. Они пр..(6)одолели лесную ч..(7)щобу и оказались на берегу. Подним..(8)шь голову, а над тобой шумят сосны, упирающ..(9)еся в небо.",
        acceptedAnswers: ["39", "3 9", "3,9"],
      },
      {
        ...base,
        id: "official-russian-2026-recovery-8",
        segment: "Лексика",
        subtopic: "Задание 8",
        type: "short-text",
        prompt:
          "Раскройте скобки и запишите слово «полтора» в соответствующей форме, соблюдая нормы современного русского литературного языка.\n\nПодготовка к конкурсу заняла у нас чуть больше (полтора) месяцев.",
        acceptedAnswers: ["полутора"],
      },
      {
        ...base,
        id: "official-russian-2026-recovery-9",
        segment: "Лексика",
        subtopic: "Задание 9",
        type: "short-text",
        prompt:
          "Замените словосочетание «дар артиста», построенное на основе управления, синонимичным словосочетанием со связью согласование.",
        acceptedAnswers: ["артистический дар", "дар артистический", "артистическийдар", "дарартистический"],
      },
      {
        ...base,
        id: "official-russian-2026-recovery-10",
        segment: "Синтаксис",
        subtopic: "Задание 10",
        type: "short-text",
        prompt:
          "Какие из высказываний соответствуют содержанию текста? Укажите номера ответов.\n\n1) После своего исторического полёта Гагарин охотнее всего встречался с королями и президентами.\n2) Курсантам лётного училища было интересно узнать, о чём думал Гагарин, когда шёл по красной дорожке аэродрома сдавать рапорт Правительству о выполненном задании.\n3) Думая, как ответить на вопрос курсанта, Гагарин вспомнил об испытании в сурдокамере.\n4) Гагарин был верен важному жизненному принципу - быть честным.\n5) Курсант никогда не сомневался, что сможет совершить подвиг.",
        passage: RUSSIAN_RECOVERY_TEXT_2026,
        passageTitle: "Текст для выполнения заданий 10-12",
        passageGroupId: "russian-2026-recovery-text-10-12",
        acceptedAnswers: ["234", "2 3 4", "2,3,4"],
      },
      {
        ...base,
        id: "official-russian-2026-recovery-11",
        segment: "Текст и речь",
        subtopic: "Задание 11",
        type: "short-text",
        prompt:
          "Укажите варианты ответов, в которых средством выразительности речи является метафора. Запишите номера ответов.\n\n1) И Гагарин охотно встречался со всеми желающими.\n2) Как-то раз, когда официальная встреча уже закончилась и дружеский разговор перекочевал из торжественного зала в чахлый садик лётной школы...\n3) Курсанты снова грохнули, но Гагарин остался подчёркнуто серьёзен, и смех сразу погас.\n4) И даже песню споёт в космосе, если надо, хотя ему медведь на ухо наступил...\n5) Впервые за много дней курсант засыпал счастливым.",
        passage: RUSSIAN_RECOVERY_TEXT_2026,
        passageTitle: "Текст для выполнения заданий 10-12",
        passageGroupId: "russian-2026-recovery-text-10-12",
        acceptedAnswers: ["23", "2 3", "2,3"],
      },
      {
        ...base,
        id: "official-russian-2026-recovery-12",
        segment: "Лексика",
        subtopic: "Задание 12",
        type: "short-text",
        prompt:
          "Из прочитанного текста выпишите слово, соответствующее лексическому значению в задании.",
        passage: RUSSIAN_RECOVERY_TEXT_2026,
        passageTitle: "Текст для выполнения заданий 10-12",
        passageGroupId: "russian-2026-recovery-text-10-12",
        acceptedAnswers: ["чахлый"],
      },
      {
        ...base,
        id: "official-russian-2026-recovery-13-1",
        segment: "Текст и речь",
        subtopic: "Задание 13.1",
        type: "extended-answer-lite",
        prompt:
          "Напишите сочинение-рассуждение на тему «Каковы функции многоточия в тексте?». Приведите два примера из текста.",
        passage: RUSSIAN_RECOVERY_TEXT_2026,
        passageTitle: "Текст для выполнения заданий 13.1, 13.2, 13.3",
        passageGroupId: "russian-2026-recovery-text-13",
        rubric: {
          requiredKeyPoints: ["тезис о функции многоточия", "2 примера из текста", "вывод"],
          optionalKeyPoints: ["связь примеров с тезисом", "точные ссылки на предложения"],
          checklist: ["Есть позиция автора ответа", "Есть аргументация", "Есть вывод"],
          strongSample:
            "Сильный ответ объясняет не только знак, но и его роль в эмоциональном/смысловом развитии текста.",
          typicalErrors: ["пересказ вместо анализа", "пример без пояснения", "нет вывода"],
        },
      },
      {
        ...base,
        id: "official-russian-2026-recovery-13-2",
        segment: "Текст и речь",
        subtopic: "Задание 13.2",
        type: "extended-answer-lite",
        prompt:
          "Напишите сочинение-рассуждение на тему «Как Вы понимаете смысл выделенного фрагмента текста?» с двумя примерами.",
        passage: RUSSIAN_RECOVERY_TEXT_2026,
        passageTitle: "Текст для выполнения заданий 13.1, 13.2, 13.3",
        passageGroupId: "russian-2026-recovery-text-13",
        rubric: {
          requiredKeyPoints: ["объяснение смысла фрагмента", "2 примера из текста", "вывод"],
          optionalKeyPoints: ["точные ссылки на предложения", "связка между примерами"],
          checklist: ["Тезис сформулирован", "Примеры релевантны", "Вывод логичен"],
          strongSample: "Сильный ответ даёт интерпретацию, а не пересказ.",
          typicalErrors: ["формальный ответ без анализа", "один пример вместо двух"],
        },
      },
      {
        ...base,
        id: "official-russian-2026-recovery-13-3",
        segment: "Текст и речь",
        subtopic: "Задание 13.3",
        type: "extended-answer-lite",
        prompt:
          "Напишите сочинение-рассуждение на нравственную тему по прочитанному тексту. Приведите 2 аргумента.",
        passage: RUSSIAN_RECOVERY_TEXT_2026,
        passageTitle: "Текст для выполнения заданий 13.1, 13.2, 13.3",
        passageGroupId: "russian-2026-recovery-text-13",
        rubric: {
          requiredKeyPoints: ["определение понятия", "пример из текста", "пример из опыта/литературы", "вывод"],
          optionalKeyPoints: ["точность формулировок", "логика композиции"],
          checklist: ["Тема раскрыта", "Есть аргументация", "Есть вывод"],
          strongSample: "Сильный ответ показывает причинно-следственные связи и личную позицию.",
          typicalErrors: ["подмена темы", "отсутствие одного аргумента", "слабая логика"],
        },
      },
    ];
  }

  function officialContextKey(subjectKey, year, variant) {
    return `${subjectKey || "na"}|${year || "na"}|${variant || "na"}`;
  }

  function parseOfficialQuestionNumber(question, indexInContext) {
    const direct = Number(question && question.questionNumber);
    if (Number.isInteger(direct) && direct > 0 && direct <= 40) {
      return direct;
    }

    const subtopicMatch = String((question && question.subtopic) || "").match(/(\d{1,2})/);
    if (subtopicMatch) {
      const parsed = Number(subtopicMatch[1]);
      if (Number.isInteger(parsed) && parsed > 0 && parsed <= 40) {
        return parsed;
      }
    }

    const idMatch = String((question && question.id) || "").match(/-(\d{1,2})$/);
    if (idMatch) {
      const parsed = Number(idMatch[1]);
      if (Number.isInteger(parsed) && parsed > 0 && parsed <= 40) {
        return parsed;
      }
    }

    const fallback = Number(indexInContext) + 1;
    return Number.isInteger(fallback) && fallback > 0 ? fallback : null;
  }

  function normalizeOfficialPromptText(prompt) {
    return String(prompt || "")
      .replace(/[ \t]+/g, " ")
      .replace(/\s*\n+\s*/g, " ")
      .replace(/([А-Яа-яA-Za-z]+)\.\s*9\s*класс[^.]*-\s*\d+\s*\/\s*\d+/g, " ")
      .replace(/\u00a0/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  function parseOfficialAnswerVariants(rawValue) {
    const source = String(rawValue || "")
      .replace(/<\s*или\s*>/gi, "|")
      .replace(/\s+или\s+/gi, "|");

    return uniqueValues(
      source
        .split("|")
        .map((item) =>
          String(item || "")
            .replace(/[«»"“”]/g, "")
            .replace(/[^\p{L}\p{N},.\-]/gu, "")
            .trim(),
        )
        .filter((item) => Boolean(item) && item.length <= 48),
    );
  }

  function parseOptionIndexesFromAnswer(answerVariant, optionCount) {
    const value = String(answerVariant || "").trim();
    if (!value) {
      return [];
    }

    const compact = value.replace(/\s+/g, "");
    const digitsOnly = compact.replace(/[^\d]/g, "");
    const indexes = [];

    if (digitsOnly.length > 1 && !/[,.]/.test(compact) && optionCount <= 9) {
      digitsOnly.split("").forEach((digit) => {
        const idx = Number(digit) - 1;
        if (Number.isInteger(idx) && idx >= 0 && idx < optionCount) {
          indexes.push(idx);
        }
      });
      return uniqueValues(indexes).sort((a, b) => a - b);
    }

    const tokens = compact.split(/[^\d]+/).filter(Boolean);
    tokens.forEach((token) => {
      const idx = Number(token) - 1;
      if (Number.isInteger(idx) && idx >= 0 && idx < optionCount) {
        indexes.push(idx);
      }
    });

    return uniqueValues(indexes).sort((a, b) => a - b);
  }

  function extractOfficialOptions(prompt) {
    const source = String(prompt || "");
    const regex = /(?:^|\s)(\d{1,2})\)\s*([\s\S]*?)(?=(?:\s\d{1,2}\)\s)|(?:\sОтвет\b)|$)/g;
    const map = {};
    let match;

    while ((match = regex.exec(source))) {
      const index = Number(match[1]);
      if (!Number.isInteger(index) || index <= 0 || index > 12) {
        continue;
      }
      const value = normalizeOfficialPromptText(match[2]).replace(/[.;,]+$/, "").trim();
      if (!value || value.length > 240) {
        continue;
      }
      map[index] = value;
    }

    const keys = Object.keys(map)
      .map(Number)
      .sort((a, b) => a - b);

    if (keys.length < 2 || keys[0] !== 1) {
      return [];
    }
    for (let i = 1; i < keys.length; i += 1) {
      if (keys[i] !== keys[i - 1] + 1) {
        return [];
      }
    }

    const rawOptions = keys.map((key) => map[key]);
    const seen = new Set();
    let hasDuplicates = false;
    rawOptions.forEach((option) => {
      const signature = normalizeTextToken(option);
      if (!signature) {
        return;
      }
      if (seen.has(signature)) {
        hasDuplicates = true;
        return;
      }
      seen.add(signature);
    });

    return !hasDuplicates && rawOptions.length >= 2 ? rawOptions : [];
  }

  function extractOfficialMatching(prompt) {
    const source = normalizeOfficialPromptText(prompt);
    if (!/установите соответствие/i.test(source)) {
      return null;
    }

    const left = [];
    const leftRegex = /(?:^|\s)([А-ЯA-Z])\)\s*([\s\S]*?)(?=(?:\s[А-ЯA-Z]\)\s)|(?:\s\d{1,2}\)\s)|(?:\sЗапишите\b)|(?:\sОтвет\b)|$)/g;
    let match;
    while ((match = leftRegex.exec(source))) {
      const id = String(match[1]).trim();
      const label = normalizeOfficialPromptText(match[2]).replace(/[.;,]+$/, "").trim();
      if (!id || !label || label.length > 260) {
        continue;
      }
      left.push({ id, label });
    }

    const right = [];
    const rightRegex = /(?:^|\s)(\d{1,2})\)\s*([\s\S]*?)(?=(?:\s\d{1,2}\)\s)|(?:\sЗапишите\b)|(?:\sОтвет\b)|$)/g;
    while ((match = rightRegex.exec(source))) {
      const id = String(Number(match[1]));
      const label = normalizeOfficialPromptText(match[2]).replace(/[.;,]+$/, "").trim();
      if (!id || !label || label.length > 280) {
        continue;
      }
      right.push({ id, label });
    }

    if (left.length < 2 || right.length < 3) {
      return null;
    }

    return { left, right };
  }

  function parseMatchingPairsFromAnswer(answerVariant, leftItems, rightItems) {
    const leftIds = (leftItems || []).map((item) => item.id);
    const rightIds = new Set((rightItems || []).map((item) => item.id));
    const token = String(answerVariant || "").trim();
    if (!token || !leftIds.length) {
      return {};
    }

    const compact = token.replace(/\s+/g, "");
    const map = {};
    if (!/[,.|;:/-]/.test(compact) && compact.length === leftIds.length) {
      compact.split("").forEach((digit, index) => {
        if (rightIds.has(digit)) {
          map[leftIds[index]] = digit;
        }
      });
      if (Object.keys(map).length === leftIds.length) {
        return map;
      }
    }

    const parts = token.split(/[^\d]+/).filter(Boolean);
    if (parts.length === leftIds.length) {
      parts.forEach((part, index) => {
        const normalized = String(Number(part));
        if (rightIds.has(normalized)) {
          map[leftIds[index]] = normalized;
        }
      });
      if (Object.keys(map).length === leftIds.length) {
        return map;
      }
    }

    return {};
  }

  function extractPassageAndTask(prompt) {
    const source = normalizeOfficialPromptText(prompt);
    if (!source) {
      return { promptText: "", passageText: "" };
    }

    const hasSentenceMarkers = /\(\d+\)/.test(source);
    const textCue = /(прочитайте текст|выполните задания)/i.test(source);
    if (!(hasSentenceMarkers && textCue) || source.length < 220) {
      return { promptText: source, passageText: "" };
    }

    const taskMatch = source.match(
      /(укажите|определите|найдите|запишите|выпишите|сформулируйте|как|почему|какое|какие|в каком|выполните)/i,
    );
    if (!taskMatch || taskMatch.index < 160) {
      return { promptText: source, passageText: source };
    }

    const splitIndex = taskMatch.index;
    const passageText = source.slice(0, splitIndex).trim();
    const promptText = source.slice(splitIndex).trim();
    if (!passageText || !promptText) {
      return { promptText: source, passageText: "" };
    }
    return { promptText, passageText };
  }

  function parseOfficialAnswerMapFromPrompt(prompt) {
    const source = normalizeOfficialPromptText(prompt);
    if (
      !/(система оценивания|правильн(?:ый|ого) ответ|номер задания|№ задания|критерии оценивания)/i.test(source)
    ) {
      return null;
    }

    const marker = source.search(/номер задания|№ задания|правильн(?:ый|ого) ответ/i);
    const text = marker >= 0 ? source.slice(marker) : source;
    const compact = text
      .replace(/<\s*или\s*>/gi, "|")
      .replace(/\s+или\s+/gi, "|")
      .replace(/\s{2,}/g, " ");

    const map = {};
    const stopTokens = new Set([
      "балл",
      "балла",
      "баллов",
      "если",
      "или",
      "ответ",
      "номера",
      "номер",
      "задания",
      "критерии",
    ]);
    const pairRegex = /(?:^|\s)([1-2]?\d)\s+([^\s]{1,48})/g;
    let match;
    while ((match = pairRegex.exec(compact))) {
      const questionNumber = Number(match[1]);
      if (!Number.isInteger(questionNumber) || questionNumber < 1 || questionNumber > 30) {
        continue;
      }
      const rawToken = String(match[2] || "").replace(/[;:]+$/g, "");
      const normalizedToken = normalizeTextToken(rawToken);
      if (!normalizedToken || stopTokens.has(normalizedToken)) {
        continue;
      }
      if (!/[0-9A-Za-zА-Яа-яЁё]/.test(rawToken)) {
        continue;
      }
      const answerToken = parseOfficialAnswerVariants(rawToken).join("|");
      if (!answerToken) {
        continue;
      }
      if (!map[questionNumber]) {
        map[questionNumber] = answerToken;
      }
    }

    return Object.keys(map).length >= 5 ? map : null;
  }

  function stripOfficialServiceTail(prompt) {
    const source = normalizeOfficialPromptText(prompt);
    if (!source) {
      return "";
    }

    const markers = [
      "Проверьте, чтобы каждый ответ был записан рядом с номером соответствующего задания",
      "Система оценивания экзаменационной работы",
      "Критерии оценивания выполнения заданий",
      "Общие требования к выполнению заданий с развёрнутым ответом",
      "Часть 3 Используя прочитанный текст из части 2, выполните",
    ];

    let cutIndex = -1;
    markers.forEach((marker) => {
      const idx = source.toLowerCase().indexOf(marker.toLowerCase());
      if (idx > 60 && (cutIndex === -1 || idx < cutIndex)) {
        cutIndex = idx;
      }
    });

    return cutIndex > 0 ? source.slice(0, cutIndex).trim() : source;
  }

  function buildOfficialAnswerMaps(entries) {
    const answerMaps = {};
    (entries || []).forEach(({ question, context }) => {
      const subject = question && (question.subject || question.subjectKey || context.subject);
      if (!SUBJECT_CONFIG[subject]) {
        return;
      }
      const year = normalizeYearToken((question && question.year) || context.year);
      const variant = Number.isInteger(Number((question && question.variant) || context.variant))
        ? Number((question && question.variant) || context.variant)
        : null;
      const key = officialContextKey(subject, year, variant);
      const prompt = question && question.prompt;
      const parsed = parseOfficialAnswerMapFromPrompt(prompt);
      if (!parsed) {
        return;
      }
      if (!answerMaps[key]) {
        answerMaps[key] = {};
      }
      Object.entries(parsed).forEach(([qNumber, answer]) => {
        if (!answerMaps[key][qNumber]) {
          answerMaps[key][qNumber] = answer;
        }
      });
    });
    return answerMaps;
  }

  function ensureOfficialRubric(question) {
    if (question.rubric && typeof question.rubric === "object") {
      return question.rubric;
    }
    return {
      requiredKeyPoints: ["ключевое условие задания", "логика решения", "итоговый ответ"],
      optionalKeyPoints: ["ссылка на правило/формулу", "проверка результата"],
      checklist: ["Условие прочитано точно", "Показан ход рассуждения", "Ответ сформулирован ясно"],
      strongSample: "Сверьтесь с официальным ключом/критериями ФИПИ для этого задания.",
      typicalErrors: ["пропущен ключевой шаг решения", "ответ без обоснования"],
    };
  }

  function repairOfficialQuestion(rawQuestion, context, indexInContext, runtime) {
    const question = rawQuestion && typeof rawQuestion === "object" ? { ...rawQuestion } : {};
    const subjectKey = question.subject || question.subjectKey || context.subject;
    if (!SUBJECT_CONFIG[subjectKey]) {
      return question;
    }

    const variant = Number.isInteger(Number(question.variant))
      ? Number(question.variant)
      : Number.isInteger(Number(context.variant))
        ? Number(context.variant)
        : null;
    const year = normalizeYearToken(question.year || context.year);
    const contextKey = officialContextKey(subjectKey, year, variant);
    const questionNumber = parseOfficialQuestionNumber(question, indexInContext);
    const answerMap = (runtime && runtime.answerMaps && runtime.answerMaps[contextKey]) || {};
    const answerToken = answerMap && answerMap[String(questionNumber)];

    const basePrompt = stripOfficialServiceTail(question.prompt || "");
    const split = extractPassageAndTask(basePrompt);
    const promptText = split.promptText || basePrompt;

    const repaired = {
      ...question,
      prompt: promptText || question.prompt || "",
    };

    if (split.passageText) {
      if (runtime && runtime.lastPassageByContext) {
        runtime.lastPassageByContext[contextKey] = split.passageText;
      }
      repaired.passage = split.passageText;
      repaired.passageTitle = "Текст для заданий";
      repaired.passageGroupId = `${contextKey}-text`;
    } else if (
      runtime &&
      runtime.lastPassageByContext &&
      runtime.lastPassageByContext[contextKey] &&
      /(по тексту|предложени[ея]|прочитанн(?:ого|ый) текст)/i.test(promptText)
    ) {
      repaired.passage = runtime.lastPassageByContext[contextKey];
      repaired.passageTitle = "Текст для заданий";
      repaired.passageGroupId = `${contextKey}-text`;
    }

    const looksLikeWriting = /(сочинени|развёрнут|объяснит|аргумент|напишите|письменный ответ)/i.test(promptText);
    const shortTextCue =
      /(укажите все цифры|запишите слово|запишите ответ|раскройте скобки|замените словосочетание|вставьте пропущенные буквы)/i.test(
        promptText,
      );
    const matchingData = extractOfficialMatching(promptText);
    const options = extractOfficialOptions(promptText);
    const wantsMany = /(выберите\s+(два|три|несколько)|укажите\s+(два|три|несколько)|варианты ответов)/i.test(promptText);
    const answerVariants = parseOfficialAnswerVariants(answerToken || "");

    if (!looksLikeWriting && matchingData) {
      repaired.type = "matching";
      repaired.matching = {
        left: matchingData.left,
        right: matchingData.right,
      };
      const firstAnswerToken = answerVariants.length ? answerVariants[0] : "";
      const pairs = parseMatchingPairsFromAnswer(firstAnswerToken, matchingData.left, matchingData.right);
      repaired.matchPairs = pairs;
      if (!Object.keys(pairs).length) {
        repaired.selfCheckOnly = true;
      }
    } else if (!looksLikeWriting && options.length >= 2) {
      repaired.options = options;

      if (answerVariants.length) {
        const parsedAnswers = parseOptionIndexesFromAnswer(answerVariants[0], options.length);
        if (parsedAnswers.length > 1 || wantsMany) {
          repaired.type = "multi-choice";
          repaired.correctAnswers = parsedAnswers.length ? parsedAnswers : [];
          repaired.correctIndex = parsedAnswers.length ? parsedAnswers[0] : 0;
        } else if (parsedAnswers.length === 1) {
          repaired.type = "single-choice";
          repaired.correctIndex = parsedAnswers[0];
          repaired.correctAnswers = [];
        } else {
          repaired.type = wantsMany ? "multi-choice" : "single-choice";
          repaired.selfCheckOnly = true;
          repaired.correctAnswers = [];
          repaired.correctIndex = 0;
        }
      } else {
        repaired.type = wantsMany ? "multi-choice" : "single-choice";
        repaired.selfCheckOnly = true;
        repaired.correctAnswers = [];
        repaired.correctIndex = 0;
      }
    } else if (!looksLikeWriting && answerVariants.length) {
      const first = answerVariants[0].replace(",", ".");
      const numeric = Number(first);
      const numericCue = /(сколько|чему равн|вычисл|найдите|определите значение|масса|скорость|температур|длина|площад)/i
        .test(promptText) &&
        !/(номер|номера|вариант|цифр)/i.test(promptText);

      if (Number.isFinite(numeric) && numericCue) {
        repaired.type = "numeric-input";
        repaired.numericAnswer = numeric;
        repaired.tolerance = 0.02;
      } else {
        repaired.type = "short-text";
        repaired.acceptedAnswers = answerVariants;
      }
    } else if (!looksLikeWriting && shortTextCue) {
      repaired.type = "short-text";
      repaired.selfCheckOnly = true;
      repaired.acceptedAnswers = [];
    } else {
      repaired.type = "extended-answer-lite";
      repaired.rubric = ensureOfficialRubric(repaired);
    }

    repaired.tags = uniqueValues(
      [].concat(repaired.tags || [], ["official-structured-repair"]),
    );
    return repaired;
  }

  function normalizeOfficialEntry(rawQuestion, context, indexInContext, runtime) {
    const patched = repairOfficialQuestion(rawQuestion, context, indexInContext, runtime);
    const question = patched && typeof patched === "object" ? { ...patched } : {};
    const subjectKey = question.subject || question.subjectKey || context.subject;
    if (!SUBJECT_CONFIG[subjectKey]) {
      return null;
    }

    const variant = Number.isInteger(Number(question.variant))
      ? Number(question.variant)
      : Number.isInteger(Number(context.variant))
        ? Number(context.variant)
        : null;
    const year = normalizeYearToken(question.year || context.year);
    const source = question.source || context.source || "ФИПИ/пробник";

    const fallbackFactory = {
      subject: subjectKey,
      segment: question.segment || "Без сегмента",
      topic: question.topic || "Без темы",
      subtopic: question.subtopic || "Без подтемы",
      difficulty: question.difficulty || "medium",
      examBlueprintTag: question.examBlueprintTag || defaultExamTag(subjectKey, year),
      type: question.type || "single-choice",
      skill: question.skill || question.topic || "Официальный материал",
    };

    const input = {
      ...question,
      id:
        question.id ||
        buildOfficialId(
          subjectKey,
          year,
          variant,
          Number(indexInContext) || 0,
          question.prompt || "",
          source,
        ),
      subject: subjectKey,
      year,
      variant,
      source,
      examBlueprintTag: question.examBlueprintTag || defaultExamTag(subjectKey, year),
      sourceHint:
        question.sourceHint || normalizeOfficialSourceHint(source, year, variant),
      tags: uniqueValues([].concat(question.tags || [], ["official", "fipi-aligned"])),
    };

    return normalizeQuestionShape(input, fallbackFactory);
  }

  function validateOfficialQuestionCandidate(question) {
    const promptRaw = String((question && question.prompt) || "");
    const prompt = normalizePlainText(promptRaw);
    const type = normalizeQuestionType(question && question.type);
    if (!prompt || prompt.length < 24) {
      return { ok: false, reason: "слишком короткий prompt" };
    }
    if (prompt.length > 2600) {
      return { ok: false, reason: "слишком длинный prompt" };
    }

    const answerMentions = (promptRaw.match(/Ответ:/gi) || []).length;
    if (answerMentions > 1 && !/\d\)\s*\S+/.test(promptRaw)) {
      return { ok: false, reason: "склейка нескольких заданий" };
    }

    const hasEnumeratedOptions =
      /\b1\)\s*\S/.test(promptRaw) || /(?:^|\s)[А-ЯA-Z]\)\s*\S/.test(promptRaw);
    const saysHasAnswerVariants = /вариант(?:ы)?\s+ответ(?:ов|а)/i.test(promptRaw);
    if (type !== "extended-answer-lite" && saysHasAnswerVariants && !hasEnumeratedOptions) {
      return { ok: false, reason: "формулировка про варианты ответов без списка вариантов" };
    }

    const blacklist = [
      "при оценке грамотности",
      "система оценивания экзаменационной работы",
      "номер задания правильный ответ",
      "критерии оценивания выполнения заданий",
      "общие требования к выполнению заданий",
      "используется с бланками ответов",
      "критерии оценивания",
      "порядком проведения государственной итоговой аттестации",
      "в соответствии с порядком",
      "существенным считается",
      "фк1",
      "гк1",
      "изложения и сочинения",
      "бланке ответов",
      "третья проверка",
      "эксперт",
    ];
    if (blacklist.some((token) => prompt.includes(token))) {
      return { ok: false, reason: "служебный/критериальный текст, а не задание" };
    }

    const looksLikeTask =
      /[?]/.test(promptRaw) ||
      /\b1\)\s*\S+/.test(promptRaw) ||
      /(выберите|найдите|определите|укажите|решите|запишите|установите|прочитайте)/i.test(promptRaw);
    if (!looksLikeTask) {
      return { ok: false, reason: "не распознан формат задания" };
    }

    return { ok: true, reason: "" };
  }

  function buildPackEntries(pack) {
    const entries = [];
    if (!pack || typeof pack !== "object") {
      return entries;
    }

    const baseSource = pack.source || pack.publisher || "ФИПИ/пробник";

    if (Array.isArray(pack.questions)) {
      pack.questions.forEach((question, index) => {
        entries.push({
          question,
          context: {
            subject: question && (question.subject || question.subjectKey) || pack.subject || null,
            year: question && question.year || pack.year || null,
            variant: question && question.variant || pack.variant || null,
            source: baseSource,
            index,
          },
        });
      });
    }

    if (Array.isArray(pack.variants)) {
      pack.variants.forEach((variantEntry) => {
        if (!variantEntry || !Array.isArray(variantEntry.questions)) {
          return;
        }
        variantEntry.questions.forEach((question, index) => {
          entries.push({
            question,
            context: {
              subject:
                (question && (question.subject || question.subjectKey)) ||
                variantEntry.subject ||
                variantEntry.subjectKey ||
                pack.subject ||
                null,
              year: (question && question.year) || variantEntry.year || pack.year || null,
              variant:
                (question && question.variant) ||
                variantEntry.variant ||
                variantEntry.variantNumber ||
                pack.variant ||
                null,
              source: variantEntry.source || baseSource,
              index,
            },
          });
        });
      });
    }

    if (pack.bySubject && typeof pack.bySubject === "object") {
      Object.entries(pack.bySubject).forEach(([subjectKey, payload]) => {
        if (Array.isArray(payload)) {
          payload.forEach((question, index) => {
            entries.push({
              question,
              context: {
                subject: (question && (question.subject || question.subjectKey)) || subjectKey,
                year: (question && question.year) || pack.year || null,
                variant: (question && question.variant) || null,
                source: baseSource,
                index,
              },
            });
          });
          return;
        }

        if (payload && typeof payload === "object" && Array.isArray(payload.variants)) {
          payload.variants.forEach((variantEntry) => {
            if (!variantEntry || !Array.isArray(variantEntry.questions)) {
              return;
            }
            variantEntry.questions.forEach((question, index) => {
              entries.push({
                question,
                context: {
                  subject:
                    (question && (question.subject || question.subjectKey)) ||
                    variantEntry.subject ||
                    subjectKey,
                  year:
                    (question && question.year) ||
                    variantEntry.year ||
                    payload.year ||
                    pack.year ||
                    null,
                  variant:
                    (question && question.variant) ||
                    variantEntry.variant ||
                    variantEntry.variantNumber ||
                    null,
                  source: variantEntry.source || payload.source || baseSource,
                  index,
                },
              });
            });
          });
        }
      });
    }

    return entries;
  }

  function setOfficialPack(pack, options = {}) {
    const replace = options.replace !== false;
    const entries = buildPackEntries(pack);
    const answerMaps = buildOfficialAnswerMaps(entries);
    const runtime = {
      answerMaps,
      lastPassageByContext: {},
    };
    const errors = [];
    const warnings = [];
    const dropped = {
      russian: 0,
      math: 0,
      physics: 0,
      english: 0,
    };
    const dropReasons = {};
    const inserted = {
      russian: 0,
      math: 0,
      physics: 0,
      english: 0,
    };

    if (Object.keys(answerMaps).length) {
      warnings.push(`Найдено таблиц официальных ответов: ${Object.keys(answerMaps).length}.`);
    }

    if (replace) {
      Object.keys(OFFICIAL_QUESTION_POOL).forEach((subjectKey) => {
        OFFICIAL_QUESTION_POOL[subjectKey] = [];
      });
    }

    const seenBySubject = {};
    Object.keys(OFFICIAL_QUESTION_POOL).forEach((subjectKey) => {
      seenBySubject[subjectKey] = new Set(
        OFFICIAL_QUESTION_POOL[subjectKey].map((question) => question.signature || createQuestionSignature(question)),
      );
    });

    entries.forEach(({ question, context }) => {
      const normalized = normalizeOfficialEntry(question, context, context.index, runtime);
      if (!normalized) {
        warnings.push("Пропущен вопрос с неизвестным предметом в официальном пакете.");
        return;
      }

      const subjectKey = normalized.subject;
      const quality = validateOfficialQuestionCandidate(normalized);
      if (!quality.ok) {
        dropped[subjectKey] += 1;
        dropReasons[quality.reason] = (dropReasons[quality.reason] || 0) + 1;
        return;
      }

      const signature = normalized.signature || createQuestionSignature(normalized);
      if (seenBySubject[subjectKey].has(signature)) {
        return;
      }
      seenBySubject[subjectKey].add(signature);
      OFFICIAL_QUESTION_POOL[subjectKey].push(normalized);
      inserted[subjectKey] += 1;
    });

    const recoveredRussian = createRussianRecoveryQuestions2026().map((question) =>
      normalizeQuestionShape(question),
    );
    let recoveredAdded = 0;
    recoveredRussian.forEach((question) => {
      const quality = validateOfficialQuestionCandidate(question);
      if (!quality.ok) {
        dropped.russian += 1;
        dropReasons[quality.reason] = (dropReasons[quality.reason] || 0) + 1;
        return;
      }
      const signature = question.signature || createQuestionSignature(question);
      if (seenBySubject.russian.has(signature)) {
        return;
      }
      seenBySubject.russian.add(signature);
      OFFICIAL_QUESTION_POOL.russian.push(question);
      inserted.russian += 1;
      recoveredAdded += 1;
    });
    if (recoveredAdded) {
      warnings.push(`Добавлены восстановленные русские задания 2026: ${recoveredAdded}.`);
    }

    Object.keys(OFFICIAL_QUESTION_POOL).forEach((subjectKey) => {
      OFFICIAL_QUESTION_POOL[subjectKey] = OFFICIAL_QUESTION_POOL[subjectKey]
        .map((question) => normalizeQuestionShape(question))
        .sort((a, b) => {
          const yearA = Number(a.year || 0);
          const yearB = Number(b.year || 0);
          if (yearA !== yearB) {
            return yearA - yearB;
          }
          return String(a.id).localeCompare(String(b.id));
        });
    });

    const years = [];
    Object.values(OFFICIAL_QUESTION_POOL).forEach((items) => {
      items.forEach((question) => {
        const year = normalizeYearToken(question.year);
        if (year) {
          years.push(year);
        }
      });
    });

    OFFICIAL_PACK_STATE.version = Number(pack && pack.version) || OFFICIAL_PACK_FORMAT_VERSION;
    OFFICIAL_PACK_STATE.source = String((pack && (pack.source || pack.publisher)) || "ФИПИ/пробник");
    OFFICIAL_PACK_STATE.importedAt = new Date().toISOString();
    OFFICIAL_PACK_STATE.years = uniqueValues(years).sort((a, b) => a - b);
    OFFICIAL_PACK_STATE.bySubject = {
      russian: OFFICIAL_QUESTION_POOL.russian.length,
      math: OFFICIAL_QUESTION_POOL.math.length,
      physics: OFFICIAL_QUESTION_POOL.physics.length,
      english: OFFICIAL_QUESTION_POOL.english.length,
    };
    OFFICIAL_PACK_STATE.totalQuestions = Object.values(OFFICIAL_PACK_STATE.bySubject).reduce(
      (acc, value) => acc + value,
      0,
    );

    if (!OFFICIAL_PACK_STATE.totalQuestions) {
      errors.push("Официальный пакет не содержит валидных вопросов.");
    }

    resetDerivedCaches();
    return {
      ok: errors.length === 0,
      errors,
      warnings: warnings.concat(
        Object.entries(dropReasons).map(([reason, count]) => `Отфильтровано ${count}: ${reason}`),
      ),
      inserted,
      dropped,
      summary: clone(OFFICIAL_PACK_STATE),
    };
  }

  function getOfficialPackSummary() {
    return clone(OFFICIAL_PACK_STATE);
  }

  function getOfficialQuestionsBySubject(subjectKey) {
    if (!SUBJECT_CONFIG[subjectKey]) {
      return [];
    }
    return (OFFICIAL_QUESTION_POOL[subjectKey] || []).map((item) => normalizeQuestionShape(item));
  }

  function selectFromPoolDeterministic(pool, count, subjectKey, seed, used) {
    if (!pool.length || count <= 0) {
      return [];
    }
    const rng = createRng(hashString(`pool-select-${subjectKey}-${seed}-${count}`));
    const plan = scaledPlan(count, SUBJECT_CONFIG[subjectKey].difficultyBase || { basic: 6, medium: 12, hard: 12 });
    const chunk = selectQuestionsByPlan(pool, count, plan, rng, used);
    if (chunk.length >= count) {
      return chunk.slice(0, count);
    }

    const left = pool.filter((item) => !used.has(item.signature || createQuestionSignature(item)));
    const order = pickRandomIndexes(left.length, rng);
    for (let i = 0; i < order.length && chunk.length < count; i += 1) {
      const candidate = left[order[i]];
      const signature = candidate.signature || createQuestionSignature(candidate);
      if (used.has(signature)) {
        continue;
      }
      used.add(signature);
      chunk.push(candidate);
    }
    return chunk.slice(0, count);
  }

  function mixWithOfficialQuestions(subjectKey, variant, normalizedCount, generatedQuestions) {
    const base = (generatedQuestions || []).map((question) => normalizeQuestionShape(question));
    const officialPool = getOfficialQuestionsBySubject(subjectKey);
    if (!officialPool.length) {
      return base.slice(0, normalizedCount);
    }

    const used = new Set();
    const officialShare = subjectKey === "russian" ? 0.5 : 0.35;
    const targetOfficial = Math.min(
      officialPool.length,
      Math.max(subjectKey === "russian" ? 10 : 6, Math.ceil(normalizedCount * officialShare)),
    );
    const highlightPool =
      subjectKey === "russian"
        ? officialPool.filter(
            (question) =>
              Boolean(question.passage) ||
              question.type === "matching" ||
              question.type === "multi-choice" ||
              question.type === "short-text" ||
              (Array.isArray(question.tags) && question.tags.includes("recovered-official-demo-2026")) ||
              /установите соответствие|прочитайте текст/i.test(String(question.prompt || "")),
          )
        : [];
    const highlightTarget =
      subjectKey === "russian"
        ? Math.min(highlightPool.length, Math.max(2, Math.ceil(targetOfficial * 0.4)))
        : 0;
    const highlightSelected = highlightTarget
      ? selectFromPoolDeterministic(
          highlightPool,
          highlightTarget,
          subjectKey,
          `official-highlight-${variant}`,
          used,
        )
      : [];
    const officialSelected = highlightSelected.concat(
      selectFromPoolDeterministic(
        officialPool,
        Math.max(0, targetOfficial - highlightSelected.length),
        subjectKey,
        `official-${variant}`,
        used,
      ),
    );

    const merged = officialSelected.slice();
    if (merged.length < normalizedCount) {
      const generatedPool = base.filter(
        (question) => !used.has(question.signature || createQuestionSignature(question)),
      );
      const generatedSelected = selectFromPoolDeterministic(
        generatedPool,
        normalizedCount - merged.length,
        subjectKey,
        `generated-${variant}`,
        used,
      );
      merged.push(...generatedSelected);
    }

    if (merged.length < normalizedCount) {
      const fallbackPool = officialPool
        .concat(base)
        .filter((question) => !used.has(question.signature || createQuestionSignature(question)));
      const additional = selectFromPoolDeterministic(
        fallbackPool,
        normalizedCount - merged.length,
        subjectKey,
        `fallback-${variant}`,
        used,
      );
      merged.push(...additional);
    }

    return merged.slice(0, normalizedCount).map((question) => normalizeQuestionShape(question));
  }

  function expectedBlueprintTypes(subjectKey) {
    const blueprintRoot = SUBJECT_BLUEPRINTS[subjectKey];
    if (!blueprintRoot || !blueprintRoot.models) {
      return [];
    }
    const model = blueprintRoot.models.subjectModel || blueprintRoot.models.mixedTrainer;
    if (!model || !Array.isArray(model.blocks)) {
      return [];
    }
    const types = new Set();
    model.blocks.forEach((block) => {
      (block.allowedTypes || []).forEach((type) => types.add(normalizeQuestionType(type)));
    });
    return Array.from(types);
  }

  function evaluateOfficialAlignment(subjectKey, pool, byDifficulty, byType) {
    const targets = OFFICIAL_ALIGNMENT_TARGETS[subjectKey] || {
      minHardShare: 0.34,
      minMediumHardShare: 0.8,
      minNonSingleShare: 0.3,
    };
    const total = Math.max(1, pool.length);
    const hardShare = Number(byDifficulty.hard || 0) / total;
    const mediumHardShare = Number((byDifficulty.medium || 0) + (byDifficulty.hard || 0)) / total;
    const singleCount = Number(byType["single-choice"] || 0);
    const nonSingleShare = (total - singleCount) / total;
    const expectedTypes = expectedBlueprintTypes(subjectKey);
    const missingExpectedTypes = expectedTypes.filter((type) => !byType[type]);

    const status =
      hardShare >= targets.minHardShare &&
      mediumHardShare >= targets.minMediumHardShare &&
      nonSingleShare >= targets.minNonSingleShare &&
      missingExpectedTypes.length === 0
        ? "aligned"
        : "needs-attention";

    return {
      status,
      hardShare: Number(hardShare.toFixed(3)),
      mediumHardShare: Number(mediumHardShare.toFixed(3)),
      nonSingleShare: Number(nonSingleShare.toFixed(3)),
      expectedTypes,
      missingExpectedTypes,
      targets,
    };
  }

  function getSubjectDefaults(subjectKey) {
    const defaults = SUBJECT_CONFIG[subjectKey];
    if (!defaults) {
      throw new Error(`Неизвестный предмет: ${subjectKey}`);
    }
    return { ...defaults };
  }

  function clampQuestionCount(subjectKey, requestedCount) {
    const config = getSubjectDefaults(subjectKey);
    const numeric = Number(requestedCount);

    if (!Number.isFinite(numeric)) {
      return config.defaultQuestions;
    }

    return clamp(Math.floor(numeric), config.minQuestions, config.maxQuestions);
  }

  function clampTimeLimit(subjectKey, requestedMinutes) {
    const config = getSubjectDefaults(subjectKey);
    const numeric = Number(requestedMinutes);

    if (!Number.isFinite(numeric)) {
      return config.defaultMinutes;
    }

    return clamp(Math.floor(numeric), MIN_TIME_MINUTES, MAX_TIME_MINUTES);
  }

  function pickWeightedKey(rng, map) {
    const entries = Object.entries(map).filter(([, value]) => value > 0);
    if (!entries.length) {
      return null;
    }

    const total = entries.reduce((acc, [, value]) => acc + value, 0);
    let point = rng() * total;

    for (let i = 0; i < entries.length; i += 1) {
      const [key, weight] = entries[i];
      point -= weight;
      if (point <= 0) {
        return key;
      }
    }

    return entries[entries.length - 1][0];
  }

  function buildCoverageMatrix(subjectKey, questionCount) {
    const config = getSubjectDefaults(subjectKey);
    const normalized = clampQuestionCount(subjectKey, questionCount);
    const difficultyPlan = scaledPlan(normalized, config.difficultyBase);
    const segmentPlan = scaledPlan(normalized, config.segmentWeights);
    const typeWeights = SUBJECT_TYPE_WEIGHTS[subjectKey] || { "single-choice": 1 };
    const typePlan = scaledPlan(normalized, typeWeights);

    return {
      questionCount: normalized,
      difficultyPlan,
      segmentPlan,
      typePlan,
      mandatorySegments: config.mandatorySegments.slice(),
      hardShareMin: config.hardShareMin,
    };
  }

  function canUseFactory(factory, selectedFactoryCount) {
    const maxUse = Number.isInteger(factory.maxUse)
      ? factory.maxUse
      : factory.singleUse
        ? 1
        : Number.POSITIVE_INFINITY;
    return (selectedFactoryCount[factory.key] || 0) < maxUse;
  }

  function selectFactoryForSegment(
    factories,
    segment,
    remainingDifficulty,
    remainingTypes,
    rng,
    selectedFactoryCount,
  ) {
    const bySegment = factories.filter(
      (factory) => factory.segment === segment && canUseFactory(factory, selectedFactoryCount),
    );

    if (!bySegment.length) {
      return null;
    }

    const preferred = bySegment.filter((factory) => {
      const type = normalizeQuestionType(factory.type || "single-choice");
      return remainingDifficulty[factory.difficulty] > 0 && remainingTypes[type] > 0;
    });
    if (preferred.length) {
      return pick(rng, preferred);
    }

    const byType = bySegment.filter((factory) => {
      const type = normalizeQuestionType(factory.type || "single-choice");
      return remainingTypes[type] > 0;
    });
    if (byType.length) {
      return pick(rng, byType);
    }

    return pick(rng, bySegment);
  }

  function chooseFactory(
    factories,
    remainingDifficulty,
    remainingSegments,
    remainingTypes,
    rng,
    selectedFactoryCount,
  ) {
    let targetDifficulty = pickWeightedKey(rng, remainingDifficulty);
    if (!targetDifficulty) {
      targetDifficulty = pick(rng, ["basic", "medium", "hard"]);
    }

    let targetSegment = pickWeightedKey(rng, remainingSegments);
    if (!targetSegment) {
      targetSegment = pick(rng, uniqueValues(factories.map((factory) => factory.segment)));
    }

    let targetType = pickWeightedKey(rng, remainingTypes);
    if (!targetType) {
      targetType = "single-choice";
    }

    let candidates = factories.filter(
      (factory) =>
        factory.difficulty === targetDifficulty &&
        factory.segment === targetSegment &&
        normalizeQuestionType(factory.type || "single-choice") === targetType &&
        canUseFactory(factory, selectedFactoryCount),
    );

    if (!candidates.length) {
      candidates = factories.filter(
        (factory) =>
          factory.segment === targetSegment &&
          normalizeQuestionType(factory.type || "single-choice") === targetType &&
          canUseFactory(factory, selectedFactoryCount),
      );
    }

    if (!candidates.length) {
      candidates = factories.filter(
        (factory) =>
          factory.difficulty === targetDifficulty &&
          normalizeQuestionType(factory.type || "single-choice") === targetType &&
          canUseFactory(factory, selectedFactoryCount),
      );
    }

    if (!candidates.length) {
      candidates = factories.filter(
        (factory) => factory.difficulty === targetDifficulty && canUseFactory(factory, selectedFactoryCount),
      );
    }

    if (!candidates.length) {
      candidates = factories.filter(
        (factory) => factory.segment === targetSegment && canUseFactory(factory, selectedFactoryCount),
      );
    }

    if (!candidates.length) {
      candidates = factories.filter((factory) => canUseFactory(factory, selectedFactoryCount));
    }

    if (!candidates.length) {
      candidates = factories;
    }

    return pick(rng, candidates);
  }

  function serializePrompt(question) {
    const type = question.type || "single-choice";
    const options = Array.isArray(question.options)
      ? makeUniqueOptions(question.options)
          .sort((a, b) => optionComparableKey(a).localeCompare(optionComparableKey(b)))
          .join("|")
      : "";
    const sequence = Array.isArray(question.sequenceItems)
      ? question.sequenceItems
          .map((item) => `${item.id}:${item.label}`)
          .sort()
          .join("|")
      : "";
    const matching =
      question.matchPairs && typeof question.matchPairs === "object"
        ? Object.entries(question.matchPairs)
            .sort(([leftA], [leftB]) => String(leftA).localeCompare(String(leftB)))
            .map(([left, right]) => `${left}:${right}`)
            .join("|")
        : "";
    const blanks = Array.isArray(question.blanks)
      ? question.blanks.map((item) => item.id || item.label || "").join("|")
      : "";
    const rubric =
      question.rubric && question.rubric.keyPoints ? question.rubric.keyPoints.join("|") : "";
    const accepted = Array.isArray(question.acceptedAnswers)
      ? uniqueValues(question.acceptedAnswers.map((item) => normalizeTextToken(item))).sort().join("|")
      : "";

    return `${question.segment}|${question.topic}|${type}|${normalizeTextToken(question.prompt)}|${options}|${sequence}|${matching}|${blanks}|${rubric}|${accepted}`;
  }

  function createQuestionId(subjectKey, variant, index, factoryKey, prompt) {
    const fingerprint = hashString(`${subjectKey}|${variant}|${index}|${factoryKey}|${prompt}`)
      .toString(36)
      .slice(0, 8);
    return `${subjectKey}-v${variant}-q${index + 1}-${fingerprint}`;
  }

  function createVariantId(subjectKey, variant, modelKey, questionCount) {
    const normalizedModel = modelKey || "mixedTrainer";
    const count = clampQuestionCount(subjectKey, questionCount || SUBJECT_CONFIG[subjectKey].defaultQuestions);
    const token = hashString(`${subjectKey}|${variant}|${normalizedModel}|${count}`)
      .toString(36)
      .slice(0, 8);
    return `${subjectKey}-${normalizedModel}-v${String(variant).padStart(2, "0")}-${token}`;
  }

  function createQuestionSignature(question) {
    const subject = question.subject || "";
    const segment = question.segment || "";
    const topic = question.topic || "";
    const subtopic = question.subtopic || "";
    const prompt = normalizeTextToken(question.prompt || "");
    const type = normalizeQuestionType(question.type || "single-choice");
    const rawOptions = Array.isArray(question.options) ? question.options.map(String) : [];
    const options = makeUniqueOptions(rawOptions).sort((a, b) =>
      optionComparableKey(a).localeCompare(optionComparableKey(b)),
    );
    const accepted = Array.isArray(question.acceptedAnswers)
      ? uniqueValues(question.acceptedAnswers.map((item) => normalizeTextToken(item))).sort()
      : [];
    const correctOptionValues =
      type === "multi-choice" && Array.isArray(question.correctAnswers)
        ? uniqueValues(
            question.correctAnswers
              .filter((index) => Number.isInteger(index) && index >= 0 && index < rawOptions.length)
              .map((index) => optionComparableKey(rawOptions[index])),
          ).sort()
        : type === "single-choice" &&
            Number.isInteger(question.correctIndex) &&
            question.correctIndex >= 0 &&
            question.correctIndex < rawOptions.length
          ? [optionComparableKey(rawOptions[question.correctIndex])]
          : [];
    const numeric = Number.isFinite(Number(question.numericAnswer))
      ? Number(question.numericAnswer).toString()
      : "";
    const blanks = Array.isArray(question.correctBlanks)
      ? question.correctBlanks
          .map((blank) =>
            Array.isArray(blank)
              ? uniqueValues(blank.map((item) => normalizeTextToken(item))).sort().join("/")
              : normalizeTextToken(blank),
          )
          .join("|")
      : "";
    return `${subject}|${segment}|${topic}|${subtopic}|${type}|${prompt}|${options.join("|")}|${correctOptionValues.join("|")}|${accepted.join("|")}|${numeric}|${blanks}`;
  }

  function normalizeQuestionShape(question, fallbackFactory) {
    question = normalizeLegacyEnumeratedChoiceQuestion(question);
    question.prompt = normalizeHumanReadableText(question.prompt || "");
    if (Array.isArray(question.options)) {
      question.options = question.options.map((item) => normalizeHumanReadableText(item));
    }
    if (typeof question.passage === "string") {
      question.passage = normalizeHumanReadableText(question.passage);
    }
    if (typeof question.passageTitle === "string") {
      question.passageTitle = normalizeHumanReadableText(question.passageTitle);
    }

    const explanation = question.explanation || {};
    const rule = normalizeHumanReadableText(question.rule || explanation.rule || "");
    const steps = normalizeHumanReadableText(question.steps || explanation.stepByStep || "");
    const commonMistake = normalizeHumanReadableText(
      question.commonMistake || explanation.commonMistakes || "",
    );
    const recognitionTip = normalizeHumanReadableText(
      question.recognitionTip || explanation.recognitionTip || "",
    );
    const fallbackType = fallbackFactory && fallbackFactory.type;
    const type = normalizeQuestionType(question.type || fallbackType || "single-choice");
    const answerFormat = question.format || (QUESTION_TYPE_META[type] && QUESTION_TYPE_META[type].answerFormat) || "single-select";
    const rawOptions = Array.isArray(question.options) ? question.options.map((item) => String(item)) : [];
    const options = makeUniqueOptions(rawOptions);
    const originalToNormalized = [];
    const seenOptions = new Map();
    rawOptions.forEach((item, index) => {
      const key = optionComparableKey(item);
      if (!seenOptions.has(key)) {
        seenOptions.set(key, seenOptions.size);
      }
      originalToNormalized[index] = seenOptions.get(key);
    });
    const fallbackDifficulty = fallbackFactory && fallbackFactory.difficulty;
    const difficulty = question.difficulty || fallbackDifficulty || "medium";
    const fallbackSubject = (fallbackFactory && fallbackFactory.subject) || "";
    const fallbackSegment = (fallbackFactory && fallbackFactory.segment) || "";
    const fallbackTopic = (fallbackFactory && fallbackFactory.topic) || "";
    const fallbackSubtopic = (fallbackFactory && fallbackFactory.subtopic) || "";
    const fallbackBlueprintTag = (fallbackFactory && fallbackFactory.examBlueprintTag) || "";
    const fallbackSkill = (fallbackFactory && fallbackFactory.skill) || "";

    const normalized = {
      ...question,
      subject: question.subject || fallbackSubject || "",
      segment: question.segment || fallbackSegment || "Без сегмента",
      topic: question.topic || fallbackTopic || "Без темы",
      subtopic: question.subtopic || fallbackSubtopic || "Без подтемы",
      difficulty,
      examBlueprintTag: question.examBlueprintTag || fallbackBlueprintTag || "",
      tags: Array.isArray(question.tags) ? question.tags : [],
      type,
      format: answerFormat,
      skill: question.skill || fallbackSkill || question.topic || fallbackTopic || "",
      requiredCoverage:
        question.requiredCoverage !== undefined
          ? Boolean(question.requiredCoverage)
          : ((SUBJECT_CONFIG[question.subject || fallbackSubject || ""] &&
              SUBJECT_CONFIG[question.subject || fallbackSubject || ""].mandatorySegments &&
              SUBJECT_CONFIG[question.subject || fallbackSubject || ""].mandatorySegments.includes(
                question.segment || fallbackSegment || "",
              )) ||
            false),
      expectedTimeSec:
        Number.isFinite(Number(question.expectedTimeSec))
          ? Number(question.expectedTimeSec)
          : defaultExpectedTimeSec(difficulty, type),
      sourceHint: question.sourceHint || "Локальный банк ОГЭ-тренажера",
      explanation: {
        correctAnswer: normalizeHumanReadableText(
          explanation.correctAnswer || options[question.correctIndex] || "",
        ),
        why: normalizeHumanReadableText(explanation.why || ""),
        rule,
        formula: normalizeHumanReadableText(
          explanation.formula || "Не применяется для этого типа задания.",
        ),
        stepByStep: steps,
        commonMistakes: commonMistake,
        alternateMethod: normalizeHumanReadableText(explanation.alternateMethod || ""),
        recognitionTip,
      },
      rule,
      steps,
      commonMistake,
      recognitionTip,
      options,
      correctIndex:
        Number.isInteger(question.correctIndex) && question.correctIndex >= 0
          ? Number(originalToNormalized[question.correctIndex] !== undefined ? originalToNormalized[question.correctIndex] : question.correctIndex)
          : 0,
      correctAnswers: Array.isArray(question.correctAnswers)
        ? uniqueValues(
            question.correctAnswers
              .map((index) =>
                Number(
                  originalToNormalized[index] !== undefined ? originalToNormalized[index] : index,
                ),
              )
              .filter((index) => Number.isInteger(index) && index >= 0 && index < options.length),
          )
        : [],
      acceptedAnswers: Array.isArray(question.acceptedAnswers) ? question.acceptedAnswers : [],
      numericAnswer:
        Number.isFinite(Number(question.numericAnswer)) ? Number(question.numericAnswer) : null,
      tolerance:
        Number.isFinite(Number(question.tolerance)) && Number(question.tolerance) >= 0
          ? Number(question.tolerance)
          : 0.01,
      sequenceItems: Array.isArray(question.sequenceItems) ? question.sequenceItems : [],
      correctSequence: Array.isArray(question.correctSequence) ? question.correctSequence : [],
      matching: question.matching && typeof question.matching === "object" ? question.matching : null,
      matchPairs: question.matchPairs && typeof question.matchPairs === "object" ? question.matchPairs : {},
      blanks: Array.isArray(question.blanks) ? question.blanks : [],
      correctBlanks: Array.isArray(question.correctBlanks) ? question.correctBlanks : [],
      rubric: question.rubric && typeof question.rubric === "object" ? question.rubric : null,
      id: question.id || `q-${hashString(createQuestionSignature(question)).toString(36)}`,
      signature: "",
    };

    normalized.signature = createQuestionSignature(normalized);
    if (!Number.isInteger(normalized.correctIndex) || normalized.correctIndex < 0 || normalized.correctIndex >= normalized.options.length) {
      normalized.correctIndex = 0;
    }
    return normalized;
  }

  function generateVariantOnce(subjectKey, variant, questionCount, attemptSalt) {
    const config = getSubjectDefaults(subjectKey);
    const normalizedCount = clampQuestionCount(subjectKey, questionCount);
    const factories = FACTORIES[subjectKey];

    if (!factories || !factories.length) {
      throw new Error(`Нет фабрик вопросов для предмета ${subjectKey}`);
    }

    const matrix = buildCoverageMatrix(subjectKey, normalizedCount);
    const remainingDifficulty = { ...matrix.difficultyPlan };
    const remainingSegments = { ...matrix.segmentPlan };
    const remainingTypes = { ...(matrix.typePlan || { "single-choice": normalizedCount }) };
    const selectedFactoryCount = {};

    const selectionRng = createRng(hashString(`select-${subjectKey}-${variant}-${normalizedCount}-${attemptSalt}`));
    const selectedFactories = [];

    matrix.mandatorySegments.forEach((segment) => {
      let picked = selectFactoryForSegment(
        factories,
        segment,
        remainingDifficulty,
        remainingTypes,
        selectionRng,
        selectedFactoryCount,
      );
      if (!picked) {
        picked = chooseFactory(
          factories.filter((factory) => factory.segment === segment),
          remainingDifficulty,
          remainingSegments,
          remainingTypes,
          selectionRng,
          selectedFactoryCount,
        );
      }
      selectedFactories.push(picked);
      selectedFactoryCount[picked.key] = (selectedFactoryCount[picked.key] || 0) + 1;
      const pickedType = normalizeQuestionType(picked.type || "single-choice");
      if (remainingTypes[pickedType] > 0) {
        remainingTypes[pickedType] -= 1;
      }
      if (remainingDifficulty[picked.difficulty] > 0) {
        remainingDifficulty[picked.difficulty] -= 1;
      }
      if (remainingSegments[picked.segment] > 0) {
        remainingSegments[picked.segment] -= 1;
      }
    });

    while (selectedFactories.length < normalizedCount) {
      const picked = chooseFactory(
        factories,
        remainingDifficulty,
        remainingSegments,
        remainingTypes,
        selectionRng,
        selectedFactoryCount,
      );
      selectedFactories.push(picked);
      selectedFactoryCount[picked.key] = (selectedFactoryCount[picked.key] || 0) + 1;
      const pickedType = normalizeQuestionType(picked.type || "single-choice");
      if (remainingTypes[pickedType] > 0) {
        remainingTypes[pickedType] -= 1;
      }
      if (remainingDifficulty[picked.difficulty] > 0) {
        remainingDifficulty[picked.difficulty] -= 1;
      }
      if (remainingSegments[picked.segment] > 0) {
        remainingSegments[picked.segment] -= 1;
      }
    }

    const orderedFactories = shuffle(selectedFactories, selectionRng);
    const questions = [];
    const seenPrompts = new Set();
    const seenIds = new Set();

    orderedFactories.forEach((factory, index) => {
      let builtQuestion = null;
      let localAttempt = 0;

      while (!builtQuestion && localAttempt < 8) {
        const rng = createRng(
          hashString(`${subjectKey}-${variant}-${attemptSalt}-${index}-${factory.key}-${localAttempt}`),
        );

        const payload = factory.build(rng, {
          subjectKey,
          variant,
          index,
        });

        const candidate = {
          ...payload,
          id: createQuestionId(subjectKey, variant, index, factory.key, payload.prompt),
          subject: subjectKey,
          segment: factory.segment,
          topic: factory.topic,
          subtopic: factory.subtopic,
          difficulty: factory.difficulty,
          examBlueprintTag: factory.examBlueprintTag,
          prompt: payload.prompt,
          options: Array.isArray(payload.options) ? payload.options : [],
          correctIndex: Number.isInteger(payload.correctIndex) ? payload.correctIndex : 0,
          type: payload.type || factory.type || "single-choice",
          format: payload.format || (QUESTION_TYPE_META[payload.type] && QUESTION_TYPE_META[payload.type].answerFormat) || "",
          skill: payload.skill || factory.skill || factory.topic,
          expectedTimeSec: payload.expectedTimeSec,
          sourceHint: payload.sourceHint,
          requiredCoverage:
            payload.requiredCoverage !== undefined
              ? Boolean(payload.requiredCoverage)
              : factory.requiredCoverage || false,
          explanation: payload.explanation,
          tags: payload.tags || [],
        };

        const signature = serializePrompt(candidate);
        if (!seenPrompts.has(signature) && !seenIds.has(candidate.id)) {
          seenPrompts.add(signature);
          seenIds.add(candidate.id);
          builtQuestion = candidate;
        }

        localAttempt += 1;
      }

      if (!builtQuestion) {
        throw new Error(`Не удалось сгенерировать уникальный вопрос для ${subjectKey} в позиции ${index + 1}`);
      }

      questions.push(normalizeQuestionShape(builtQuestion, factory));
    });

    return {
      questions,
      matrix,
      validation: validateVariant(subjectKey, questions, matrix),
      config,
    };
  }

  function validateQuestionShape(question, index) {
    const issues = [];
    const difficultySet = new Set(["basic", "medium", "hard"]);
    const type = normalizeQuestionType(question.type || "single-choice");

    if (!question.id || typeof question.id !== "string") {
      issues.push(`q${index + 1}: отсутствует корректный id`);
    }
    if (!question.segment || !question.topic || !question.subtopic) {
      issues.push(`q${index + 1}: отсутствует segment/topic/subtopic`);
    }
    if (!difficultySet.has(question.difficulty)) {
      issues.push(`q${index + 1}: недопустимая сложность ${question.difficulty}`);
    }
    if (["single-choice", "multi-choice"].includes(type)) {
      if (!Array.isArray(question.options) || question.options.length < 2) {
        issues.push(`q${index + 1}: некорректные options`);
      } else {
        const normalizedOptions = question.options.map((item) => optionComparableKey(item));
        if (new Set(normalizedOptions).size !== normalizedOptions.length) {
          issues.push(`q${index + 1}: в options есть дублирующиеся варианты ответа`);
        }
      }
    }

    if (type === "single-choice") {
      if (
        !Number.isInteger(question.correctIndex) ||
        question.correctIndex < 0 ||
        question.correctIndex >= question.options.length
      ) {
        issues.push(`q${index + 1}: некорректный correctIndex`);
      }
    }

    if (type === "multi-choice") {
      if (!Array.isArray(question.correctAnswers) || !question.correctAnswers.length) {
        issues.push(`q${index + 1}: нет корректного correctAnswers для multi-choice`);
      }
    }

    if (type === "short-text") {
      if (!Array.isArray(question.acceptedAnswers) || !question.acceptedAnswers.length) {
        issues.push(`q${index + 1}: нет acceptedAnswers для short-text`);
      }
    }

    if (type === "numeric-input") {
      if (!Number.isFinite(Number(question.numericAnswer))) {
        issues.push(`q${index + 1}: нет numericAnswer для numeric-input`);
      }
    }

    if (type === "sequence-order") {
      if (!Array.isArray(question.sequenceItems) || !Array.isArray(question.correctSequence)) {
        issues.push(`q${index + 1}: некорректные sequenceItems/correctSequence`);
      }
    }

    if (type === "matching") {
      if (!question.matching || !question.matchPairs) {
        issues.push(`q${index + 1}: отсутствуют matching/matchPairs`);
      }
    }

    if (type === "fill-in-the-blank") {
      if (!Array.isArray(question.blanks) || !Array.isArray(question.correctBlanks)) {
        issues.push(`q${index + 1}: отсутствуют blanks/correctBlanks`);
      }
    }

    if (type === "extended-answer-lite") {
      const rubric = question.rubric || {};
      const hasLegacyKeyPoints = Array.isArray(rubric.keyPoints) && rubric.keyPoints.length > 0;
      const hasRequiredKeyPoints =
        Array.isArray(rubric.requiredKeyPoints) && rubric.requiredKeyPoints.length > 0;
      if (!question.rubric || (!hasLegacyKeyPoints && !hasRequiredKeyPoints)) {
        issues.push(`q${index + 1}: отсутствуют rubric.keyPoints или rubric.requiredKeyPoints`);
      }
    }

    const explanation = question.explanation || {};
    if (!explanation.rule || !explanation.commonMistakes || !explanation.recognitionTip) {
      issues.push(`q${index + 1}: explanation не содержит обязательные поля качества`);
    }

    return issues;
  }

  function validateVariant(subjectKey, questions, matrix) {
    const config = getSubjectDefaults(subjectKey);
    const errors = [];

    if (questions.length !== matrix.questionCount) {
      errors.push(`Ожидалось ${matrix.questionCount} вопросов, получено ${questions.length}`);
    }

    const segmentCount = {};
    const difficultyCount = { basic: 0, medium: 0, hard: 0 };
    const signatures = new Set();
    const ids = new Set();

    questions.forEach((question, index) => {
      segmentCount[question.segment] = (segmentCount[question.segment] || 0) + 1;
      difficultyCount[question.difficulty] = (difficultyCount[question.difficulty] || 0) + 1;
      signatures.add(serializePrompt(question));

      if (ids.has(question.id)) {
        errors.push(`Дублирующийся id вопроса: ${question.id}`);
      } else {
        ids.add(question.id);
      }

      const shapeIssues = validateQuestionShape(question, index);
      if (shapeIssues.length) {
        errors.push(...shapeIssues);
      }
    });

    config.mandatorySegments.forEach((segment) => {
      if (!segmentCount[segment]) {
        errors.push(`Не покрыт обязательный сегмент: ${segment}`);
      }
    });

    const requiredHard = Math.ceil(matrix.questionCount * config.hardShareMin);
    if ((difficultyCount.hard || 0) < requiredHard) {
      errors.push(`Недостаточно сложных вопросов: ${difficultyCount.hard} вместо минимум ${requiredHard}`);
    }

    if (signatures.size !== questions.length) {
      errors.push("Вариант содержит дублирующиеся вопросы");
    }

    return {
      ok: errors.length === 0,
      errors,
      segmentCount,
      difficultyCount,
      requiredHard,
    };
  }

  function getQuestions(subjectKey, variant, questionCount) {
    if (variant < 1 || variant > VARIANT_COUNT) {
      throw new Error(`Вариант должен быть в диапазоне 1..${VARIANT_COUNT}`);
    }

    const normalizedCount = clampQuestionCount(subjectKey, questionCount);
    const key = cacheKey("variant", subjectKey, variant, normalizedCount);
    if (VARIANT_CACHE.has(key)) {
      return clone(VARIANT_CACHE.get(key));
    }

    let lastResult = null;
    let attempt = 0;
    while (attempt < 6) {
      let result = null;
      try {
        result = generateVariantOnce(subjectKey, variant, normalizedCount, attempt);
      } catch (error) {
        result = null;
      }
      if (!result) {
        attempt += 1;
        continue;
      }
      lastResult = result;
      if (result.validation.ok) {
        const prepared = mixWithOfficialQuestions(
          subjectKey,
          variant,
          normalizedCount,
          result.questions,
        );
        VARIANT_CACHE.set(key, clone(prepared));
        return clone(prepared);
      }
      attempt += 1;
    }

    if (lastResult && lastResult.questions && lastResult.questions.length) {
      const fallback = mixWithOfficialQuestions(subjectKey, variant, normalizedCount, lastResult.questions)
        .slice(0, normalizedCount)
        .map((question) =>
        normalizeQuestionShape(question),
      );
      VARIANT_CACHE.set(key, clone(fallback));
      return clone(fallback);
    }

    const emergencyFactories = FACTORIES[subjectKey] || [];
    if (emergencyFactories.length) {
      const rng = createRng(hashString(`emergency-${subjectKey}-${variant}-${normalizedCount}`));
      const emergency = [];
      for (let index = 0; index < normalizedCount; index += 1) {
        const factory = emergencyFactories[index % emergencyFactories.length];
        const payload = factory.build(rng, { subjectKey, variant, index });
        const built = normalizeQuestionShape(
          {
            ...payload,
            id: createQuestionId(subjectKey, variant, index, factory.key, payload.prompt || `${factory.key}-${index}`),
            subject: subjectKey,
            segment: factory.segment,
            topic: factory.topic,
            subtopic: factory.subtopic,
            difficulty: factory.difficulty,
            examBlueprintTag: factory.examBlueprintTag,
            prompt: payload.prompt || `${factory.segment}: аварийный вопрос ${index + 1}`,
            options: Array.isArray(payload.options) ? payload.options : ["A", "B", "C", "D"],
            correctIndex: Number.isInteger(payload.correctIndex) ? payload.correctIndex : 0,
            type: payload.type || factory.type || "single-choice",
            format:
              payload.format ||
              (QUESTION_TYPE_META[payload.type || factory.type || "single-choice"] &&
                QUESTION_TYPE_META[payload.type || factory.type || "single-choice"].answerFormat) ||
              "single-select",
          },
          factory,
        );
        emergency.push(built);
      }
      const emergencyMixed = mixWithOfficialQuestions(subjectKey, variant, normalizedCount, emergency);
      VARIANT_CACHE.set(key, clone(emergencyMixed));
      return clone(emergencyMixed);
    }

    throw new Error(`Не удалось собрать вариант для предмета ${subjectKey}`);
  }

  function getVariantDiagnostics(subjectKey, variant, questionCount) {
    if (variant < 1 || variant > VARIANT_COUNT) {
      throw new Error(`Вариант должен быть в диапазоне 1..${VARIANT_COUNT}`);
    }

    const normalizedCount = clampQuestionCount(subjectKey, questionCount);
    const key = cacheKey("variant-diag", subjectKey, variant, normalizedCount);
    if (VARIANT_DIAGNOSTICS_CACHE.has(key)) {
      return clone(VARIANT_DIAGNOSTICS_CACHE.get(key));
    }

    let lastResult = null;
    let attempt = 0;
    while (attempt < 6) {
      let result = null;
      try {
        result = generateVariantOnce(subjectKey, variant, normalizedCount, attempt);
      } catch (error) {
        result = null;
      }
      if (!result) {
        attempt += 1;
        continue;
      }
      lastResult = result;
      if (result.validation.ok) {
        const diagnostics = {
          matrix: result.matrix,
          validation: result.validation,
          variantId: createVariantId(subjectKey, variant, "mixedTrainer", normalizedCount),
          officialPack: getOfficialPackSummary(),
        };
        VARIANT_DIAGNOSTICS_CACHE.set(key, clone(diagnostics));
        return diagnostics;
      }
      attempt += 1;
    }

    if (lastResult) {
      return {
        matrix: lastResult.matrix,
        validation: lastResult.validation,
        variantId: createVariantId(subjectKey, variant, "mixedTrainer", normalizedCount),
        fallback: true,
        officialPack: getOfficialPackSummary(),
      };
    }

    throw new Error(`Не удалось получить диагностику варианта для предмета ${subjectKey}`);
  }

  function rebuildVariant(subjectKey, variant, questionCount) {
    const normalizedCount = clampQuestionCount(subjectKey, questionCount);
    const variantKey = cacheKey("variant", subjectKey, variant, normalizedCount);
    const diagKey = cacheKey("variant-diag", subjectKey, variant, normalizedCount);
    VARIANT_CACHE.delete(variantKey);
    VARIANT_DIAGNOSTICS_CACHE.delete(diagKey);
    QUESTION_POOL_CACHE.clear();
    COVERAGE_CACHE.clear();
    return getQuestions(subjectKey, variant, normalizedCount);
  }

  function listStableVariants(subjectKey, options = {}) {
    if (!SUBJECT_CONFIG[subjectKey]) {
      throw new Error(`Неизвестный предмет: ${subjectKey}`);
    }
    const modelKey =
      options.modelKey ||
      ((SUBJECT_BLUEPRINTS[subjectKey] && SUBJECT_BLUEPRINTS[subjectKey].defaultModel) || "mixedTrainer");
    const count = clampQuestionCount(
      subjectKey,
      Number(options.questionCount) || SUBJECT_CONFIG[subjectKey].defaultQuestions,
    );
    return Array.from({ length: VARIANT_COUNT }, (_, index) => {
      const variant = index + 1;
      return {
        variant,
        variantId: createVariantId(subjectKey, variant, modelKey, count),
        subject: subjectKey,
        modelKey,
        questionCount: count,
      };
    });
  }

  function getQuestionPool(subjectKey, options = {}) {
    if (!SUBJECT_CONFIG[subjectKey]) {
      throw new Error(`Неизвестный предмет: ${subjectKey}`);
    }

    const variantFrom = Math.max(1, Number(options.variantFrom) || 1);
    const variantTo = Math.min(VARIANT_COUNT, Number(options.variantTo) || VARIANT_COUNT);
    const requestedCount = clampQuestionCount(
      subjectKey,
      Number(options.questionCount) || SUBJECT_CONFIG[subjectKey].defaultQuestions,
    );
    const key = cacheKey("pool", subjectKey, variantFrom, variantTo, requestedCount);
    if (QUESTION_POOL_CACHE.has(key)) {
      return clone(QUESTION_POOL_CACHE.get(key));
    }

    const pool = [];
    const seen = new Set();

    for (let variant = variantFrom; variant <= variantTo; variant += 1) {
      const variantQuestions = getQuestions(subjectKey, variant, requestedCount);
      variantQuestions.forEach((question) => {
        const normalized = normalizeQuestionShape(question);
        const key = normalized.signature;
        if (!seen.has(key)) {
          seen.add(key);
          pool.push(normalized);
        }
      });
    }

    const official = getOfficialQuestionsBySubject(subjectKey);
    official.forEach((question) => {
      const normalized = normalizeQuestionShape(question);
      const key = normalized.signature || createQuestionSignature(normalized);
      if (!seen.has(key)) {
        seen.add(key);
        pool.push(normalized);
      }
    });

    QUESTION_POOL_CACHE.set(key, clone(pool));
    return pool;
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getSubjectBlueprint(subjectKey, modelKey) {
    const blueprint = SUBJECT_BLUEPRINTS[subjectKey];
    if (!blueprint) {
      throw new Error(`Неизвестный blueprint для предмета ${subjectKey}`);
    }

    const normalizedModelKey =
      modelKey === "subjectModel"
        ? "subjectModelExact"
        : modelKey === "subjectModelTrain"
          ? "subjectModelTraining"
          : modelKey;

    const selectedModelKey = normalizedModelKey || blueprint.defaultModel;
    const model = blueprint.models[selectedModelKey] || blueprint.models[blueprint.defaultModel];
    const examProfile = model.examProfile || {};
    const timing = examProfile.timing || {};

    return deepClone({
      subject: subjectKey,
      modelKey: model.key,
      title: model.title,
      resultMode: model.resultMode,
      rules: model.rules || {},
      timeLimitMinutes: timing.recommendedMinutes || SUBJECT_CONFIG[subjectKey].defaultMinutes,
      warningAtMinutes: timing.warningAtMinutes || 20,
      strictness: model.strictness || "soft",
      examProfile,
      scoring: examProfile.scoring || {},
      resultDisplay: examProfile.resultDisplay || {},
      orderPolicy: examProfile.orderPolicy || "balanced-randomized",
      notices: {
        selfCheck: (model.rules && model.rules.selfCheckLabel) || "учебная самопроверка",
        disclaimer:
          (examProfile && examProfile.scoring && examProfile.scoring.note) ||
          "Автоматическая проверка развёрнутых ответов ориентировочная, сверяйте решение по чек-листу.",
      },
      blocks: model.blocks || [],
    });
  }

  function pickRandomIndexes(length, rng) {
    const indexes = Array.from({ length }, (_, index) => index);
    for (let i = indexes.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
    }
    return indexes;
  }

  function variantBucketBySignature(signature) {
    const value = String(signature || "");
    return (hashString(`variant-bucket-${value}`) % VARIANT_COUNT) + 1;
  }

  function circularDistance(from, to, maxValue) {
    const diff = Math.abs(Number(from) - Number(to));
    return Math.min(diff, Math.max(0, maxValue - diff));
  }

  function buildVariantRanker(seedVariant, preferredSignatures) {
    const normalizedSeed = Math.min(VARIANT_COUNT, Math.max(1, Number(seedVariant) || 1));
    const preferred = preferredSignatures || new Set();
    return function rankQuestionByVariant(question) {
      const signature = question.signature || createQuestionSignature(question);
      const bucket = variantBucketBySignature(signature);
      const distance = circularDistance(normalizedSeed, bucket, VARIANT_COUNT);
      const preferredBoost = preferred.has(signature) ? -1.75 : 0;
      const jitter = (hashString(`ranker-${normalizedSeed}-${signature}`) % 1000) / 10000;
      return distance + preferredBoost + jitter;
    };
  }

  function orderCandidates(candidates, rng, ranker) {
    if (!Array.isArray(candidates) || !candidates.length) {
      return [];
    }
    if (!ranker) {
      const order = pickRandomIndexes(candidates.length, rng);
      return order.map((index) => candidates[index]);
    }
    const scored = candidates.map((item, index) => ({
      item,
      index,
      score: Number(ranker(item)),
      tie: rng(),
    }));
    scored.sort((a, b) => a.score - b.score || a.tie - b.tie || a.index - b.index);
    return scored.map((entry) => entry.item);
  }

  function selectQuestionsByPlan(candidates, count, difficultyPlan, rng, used, ranker) {
    const selected = [];
    const remaining = candidates.slice();
    const removeBySignature = (item) => {
      const signature = item.signature || createQuestionSignature(item);
      used.add(signature);
      return signature;
    };

    Object.entries(difficultyPlan).forEach(([difficulty, value]) => {
      let amount = value;
      if (!amount) {
        return;
      }
      const chunk = remaining.filter((item) => item.difficulty === difficulty);
      const ordered = orderCandidates(chunk, rng, ranker);
      for (let i = 0; i < ordered.length && selected.length < count && amount > 0; i += 1) {
        const candidate = ordered[i];
        const signature = candidate.signature || createQuestionSignature(candidate);
        if (used.has(signature)) {
          continue;
        }
        selected.push(candidate);
        removeBySignature(candidate);
        amount -= 1;
      }
    });

    if (selected.length < count) {
      const fallback = remaining.filter((item) => !used.has(item.signature || createQuestionSignature(item)));
      const orderedFallback = orderCandidates(fallback, rng, ranker);
      for (let i = 0; i < orderedFallback.length && selected.length < count; i += 1) {
        const candidate = orderedFallback[i];
        selected.push(candidate);
        removeBySignature(candidate);
      }
    }

    return selected.slice(0, count);
  }

  function getExamByBlueprint(subjectKey, options = {}) {
    const requestedCount = clampQuestionCount(
      subjectKey,
      Number(options.questionCount) || SUBJECT_CONFIG[subjectKey].defaultQuestions,
    );
    const modelKey = options.modelKey || (SUBJECT_BLUEPRINTS[subjectKey] && SUBJECT_BLUEPRINTS[subjectKey].defaultModel);
    const blueprint = getSubjectBlueprint(subjectKey, modelKey);
    const seedVariant = Number(options.seedVariant) || 1;
    const variantId = createVariantId(subjectKey, seedVariant, blueprint.modelKey, requestedCount);
    const strictMode = blueprint.strictness === "strict";
    const pool = getQuestionPool(subjectKey, {
      variantFrom: 1,
      variantTo: VARIANT_COUNT,
      questionCount: SUBJECT_CONFIG[subjectKey].defaultQuestions,
    }).map((item) => normalizeQuestionShape(item));

    if (!blueprint.blocks.length) {
      return {
        questions: getQuestions(subjectKey, seedVariant, requestedCount),
        blueprint,
        diagnostics: {
          missingBlocks: [],
          requestedCount,
          selectedCount: requestedCount,
          variantId,
          note: "Для модели нет блочной структуры, использована стандартная генерация.",
        },
      };
    }

    const blockBase = Object.fromEntries(blueprint.blocks.map((block) => [block.id, block.count]));
    const blockPlan = scaledPlan(requestedCount, blockBase);
    const used = new Set();
    const selected = [];
    const missingBlocks = [];
    const softMisses = [];
    const rng = createRng(hashString(`blueprint-${subjectKey}-${modelKey}-${seedVariant}-${requestedCount}`));
    const preferredSignatures = new Set(
      getQuestions(
        subjectKey,
        Math.min(VARIANT_COUNT, Math.max(1, seedVariant)),
        SUBJECT_CONFIG[subjectKey].defaultQuestions,
      )
        .map((item) => normalizeQuestionShape(item))
        .map((item) => item.signature || createQuestionSignature(item)),
    );
    const variantRanker = buildVariantRanker(seedVariant, preferredSignatures);

    blueprint.blocks.forEach((block) => {
      const blockCount = blockPlan[block.id] || 0;
      if (!blockCount) {
        return;
      }

      let filtered = pool.filter((question) => {
        const segmentOk = !block.segments || !block.segments.length || block.segments.includes(question.segment);
        const typeOk = !block.allowedTypes || !block.allowedTypes.length || block.allowedTypes.includes(question.type);
        return segmentOk && typeOk;
      });

      if (!strictMode && filtered.length < blockCount) {
        filtered = pool.filter((question) => {
          const segmentOk = !block.segments || !block.segments.length || block.segments.includes(question.segment);
          return segmentOk;
        });
      }

      const preselected = [];
      if (subjectKey === "russian" && block.id === "ru-text" && filtered.length) {
        const priorityChecks = [
          (question) => Array.isArray(question.tags) && question.tags.includes("recovered-official-demo-2026"),
          (question) => Boolean(question.passage),
          (question) => question.type === "matching",
          (question) => question.type === "short-text",
          (question) => question.type === "multi-choice",
        ];
        priorityChecks.forEach((predicate) => {
          if (preselected.length >= blockCount) {
            return;
          }
          const candidates = filtered.filter((question) => {
            const signature = question.signature || createQuestionSignature(question);
            const already = preselected.some(
              (item) => (item.signature || createQuestionSignature(item)) === signature,
            );
            return !already && !used.has(signature) && predicate(question);
          });
          if (!candidates.length) {
            return;
          }
          const ranked = orderCandidates(candidates, rng, variantRanker);
          if (ranked.length) {
            const picked = ranked[0];
            preselected.push(picked);
            used.add(picked.signature || createQuestionSignature(picked));
          }
        });
      }

      const difficultyPlan = scaledPlan(blockCount, block.difficultyPlan || { basic: 2, medium: 4, hard: 4 });
      preselected.forEach((question) => {
        if (difficultyPlan[question.difficulty] > 0) {
          difficultyPlan[question.difficulty] -= 1;
        }
      });

      const remainderCount = Math.max(0, blockCount - preselected.length);
      const chunk = preselected.concat(
        selectQuestionsByPlan(filtered, remainderCount, difficultyPlan, rng, used, variantRanker),
      ).slice(0, blockCount);

      if (chunk.length < blockCount && block.required) {
        const payload = {
          blockId: block.id,
          title: block.title,
          required: block.required,
          expected: blockCount,
          got: chunk.length,
        };
        if (strictMode) {
          missingBlocks.push(payload);
        } else {
          softMisses.push(payload);
        }
      }

      selected.push(
        ...chunk.map((question) => ({
          ...question,
          blueprintBlock: block.id,
        })),
      );
    });

    if (selected.length < requestedCount) {
      const fallback = pool.filter((question) => !used.has(question.signature || createQuestionSignature(question)));
      const additionalPlan = scaledPlan(requestedCount - selected.length, SUBJECT_CONFIG[subjectKey].difficultyBase);
      const additional = selectQuestionsByPlan(
        fallback,
        requestedCount - selected.length,
        additionalPlan,
        rng,
        used,
        variantRanker,
      );
      selected.push(...additional.map((question) => ({ ...question, blueprintBlock: "fallback" })));
    }

    const preparedQuestions = strictMode
      ? selected.slice(0, requestedCount)
      : shuffle(selected.slice(0, requestedCount), rng);

    return {
      questions: preparedQuestions,
      blueprint,
      diagnostics: {
        missingBlocks,
        softMisses,
        requestedCount,
        selectedCount: Math.min(requestedCount, preparedQuestions.length),
        blockPlan,
        variantId,
      },
    };
  }

  function statusByCoverageCount(count) {
    if (count <= 0) {
      return "нет";
    }
    if (count < 3) {
      return "слабое";
    }
    if (count < 6) {
      return "достаточное";
    }
    return "сильное";
  }

  function getContentCoverageMap(subjectKey) {
    if (!SUBJECT_CONFIG[subjectKey]) {
      throw new Error(`Неизвестный предмет: ${subjectKey}`);
    }

    const metadata = CONTENT_COVERAGE_MAP[subjectKey] || [];
    const pool = getQuestionPool(subjectKey, {
      variantFrom: 1,
      variantTo: VARIANT_COUNT,
      questionCount: SUBJECT_CONFIG[subjectKey].defaultQuestions,
    }).map((item) => normalizeQuestionShape(item));

    const topicMap = {};

    metadata.forEach((entry) => {
      const key = `${entry.section}::${entry.topic}::${entry.subtopic}`;
      if (!topicMap[key]) {
        topicMap[key] = {
          subject: entry.subject,
          section: entry.section,
          topic: entry.topic,
          subtopic: entry.subtopic,
          skill: entry.skill,
          examBlueprintTag: entry.examBlueprintTag,
          requiredCoverage: entry.requiredCoverage,
          totalQuestions: 0,
          byDifficulty: { basic: 0, medium: 0, hard: 0 },
          byType: {},
          formats: {},
          status: "нет",
          imbalance: false,
        };
      }
    });

    pool.forEach((question) => {
      const key = `${question.segment}::${question.topic}::${question.subtopic}`;
      if (!topicMap[key]) {
        topicMap[key] = {
          subject: question.subject,
          section: question.segment,
          topic: question.topic,
          subtopic: question.subtopic,
          skill: question.skill || question.topic,
          examBlueprintTag: question.examBlueprintTag || "",
          requiredCoverage: false,
          totalQuestions: 0,
          byDifficulty: { basic: 0, medium: 0, hard: 0 },
          byType: {},
          formats: {},
          status: "нет",
          imbalance: false,
        };
      }

      const row = topicMap[key];
      row.totalQuestions += 1;
      row.byDifficulty[question.difficulty] = (row.byDifficulty[question.difficulty] || 0) + 1;
      row.byType[question.type] = (row.byType[question.type] || 0) + 1;
      row.formats[question.format] = (row.formats[question.format] || 0) + 1;
    });

    const items = Object.values(topicMap)
      .map((row) => {
        row.status = statusByCoverageCount(row.totalQuestions);
        const maxDiff = Math.max(...Object.values(row.byDifficulty));
        row.imbalance = row.totalQuestions > 0 ? maxDiff / row.totalQuestions > 0.72 : false;
        row.formats = Object.keys(row.formats);
        row.types = Object.keys(row.byType);
        return row;
      })
      .sort((a, b) => a.section.localeCompare(b.section, "ru") || a.topic.localeCompare(b.topic, "ru"));

    const summary = {
      subject: subjectKey,
      totalTopics: items.length,
      noCoverage: items.filter((item) => item.status === "нет").length,
      weakCoverage: items.filter((item) => item.status === "слабое").length,
      sufficientCoverage: items.filter((item) => item.status === "достаточное").length,
      strongCoverage: items.filter((item) => item.status === "сильное").length,
      imbalanceTopics: items.filter((item) => item.imbalance).length,
      knownFormats: Array.from(new Set(items.flatMap((item) => item.formats))).sort(),
    };

    const map = {
      subject: subjectKey,
      generatedAt: new Date().toISOString(),
      summary,
      items,
    };
    COVERAGE_CACHE.set(subjectKey, clone(map));
    return map;
  }

  function normalizePlainText(value) {
    const source = String(value || "")
      .toLowerCase()
      .replace(/ё/g, "е");

    let normalized = "";
    for (const char of source) {
      const code = char.charCodeAt(0);
      const isLatin = code >= 97 && code <= 122;
      const isCyrillic = code >= 1072 && code <= 1103;
      const isDigit = code >= 48 && code <= 57;
      const isSpace = /\s/.test(char);

      normalized += isLatin || isCyrillic || isDigit || isSpace ? char : " ";
    }

    return normalized.replace(/\s+/g, " ").trim();
  }

  function tokenSet(value) {
    return new Set(
      normalizePlainText(value)
        .split(" ")
        .filter((token) => token.length >= 3),
    );
  }

  function jaccardSimilarity(a, b) {
    if (!a.size || !b.size) {
      return 0;
    }
    let intersection = 0;
    a.forEach((item) => {
      if (b.has(item)) {
        intersection += 1;
      }
    });
    const union = new Set([...a, ...b]).size;
    return union ? intersection / union : 0;
  }

  function explanationQualityScore(question) {
    const explanation = question.explanation || {};
    const rubric = question.rubric || {};

    const checks = [
      explanation.why || "",
      explanation.stepByStep || question.steps || "",
      explanation.rule || question.rule || "",
      explanation.formula || "",
      explanation.commonMistakes || question.commonMistake || "",
      explanation.recognitionTip || question.recognitionTip || "",
    ];

    const answeredChecks = checks.filter((value) => normalizePlainText(value).length >= 8).length;
    const baseScore = Math.round((answeredChecks / checks.length) * 100);

    const hasStrongSample =
      question.type !== "extended-answer-lite" ||
      normalizePlainText(rubric.strongSample || "").length >= 30;

    const adjusted = hasStrongSample ? baseScore : Math.max(0, baseScore - 20);
    const level = adjusted >= 80 ? "strong" : adjusted >= 55 ? "medium" : "weak";

    return {
      score: adjusted,
      level,
      missingFields: {
        why: !normalizePlainText(explanation.why || "").length,
        stepByStep: !normalizePlainText(explanation.stepByStep || question.steps || "").length,
        rule: !normalizePlainText(explanation.rule || question.rule || "").length,
        formula: !normalizePlainText(explanation.formula || "").length,
        commonMistakes: !normalizePlainText(explanation.commonMistakes || question.commonMistake || "").length,
        recognitionTip: !normalizePlainText(explanation.recognitionTip || question.recognitionTip || "").length,
        strongSample: question.type === "extended-answer-lite" && !hasStrongSample,
      },
    };
  }

  function collectAllVariantQuestions(subjectKey) {
    const config = SUBJECT_CONFIG[subjectKey];
    const questions = [];
    for (let variant = 1; variant <= VARIANT_COUNT; variant += 1) {
      const variantQuestions = getQuestions(subjectKey, variant, config.defaultQuestions).map((question) =>
        normalizeQuestionShape(question),
      );
      variantQuestions.forEach((question) => {
        questions.push({
          ...question,
          __variant: variant,
        });
      });
    }
    return questions;
  }

  function getOfficialAlignmentReport() {
    const bySubject = {};
    Object.keys(SUBJECT_CONFIG).forEach((subjectKey) => {
      const pool = getQuestionPool(subjectKey, {
        variantFrom: 1,
        variantTo: VARIANT_COUNT,
        questionCount: SUBJECT_CONFIG[subjectKey].defaultQuestions,
      }).map((question) => normalizeQuestionShape(question));
      const byDifficulty = { basic: 0, medium: 0, hard: 0 };
      const byType = {};
      pool.forEach((question) => {
        byDifficulty[question.difficulty] = (byDifficulty[question.difficulty] || 0) + 1;
        byType[question.type] = (byType[question.type] || 0) + 1;
      });
      bySubject[subjectKey] = {
        questionCount: pool.length,
        officialQuestionCount: getOfficialQuestionsBySubject(subjectKey).length,
        alignment: evaluateOfficialAlignment(subjectKey, pool, byDifficulty, byType),
      };
    });
    return {
      generatedAt: new Date().toISOString(),
      officialPack: getOfficialPackSummary(),
      bySubject,
    };
  }

  function validateQuestionBank() {
    const errors = [];
    const warnings = [];
    const bySubject = {};
    const globalIds = new Map();
    const coverageGaps = [];
    const weakCoverage = [];
    const lowDifficultyDiversity = [];
    const missingExplanationFields = [];
    const duplicateCandidates = [];
    const nearDuplicateCandidates = [];
    const explanationQuality = {
      strong: 0,
      medium: 0,
      weak: 0,
      averageScore: 0,
      total: 0,
    };

    Object.keys(SUBJECT_CONFIG).forEach((subjectKey) => {
      const allVariantQuestions = collectAllVariantQuestions(subjectKey);
      const pool = [];
      const seenSignatures = new Set();

      allVariantQuestions.forEach((question) => {
        const signature = question.signature || createQuestionSignature(question);
        if (!seenSignatures.has(signature)) {
          seenSignatures.add(signature);
          pool.push(question);
        }
      });

      const byDifficulty = { basic: 0, medium: 0, hard: 0 };
      const byType = {};
      const byFormat = {};
      const topics = new Set();
      const exactSignatures = new Map();
      const promptTokens = [];
      const subjectQuality = { strong: 0, medium: 0, weak: 0 };

      allVariantQuestions.forEach((question) => {
        const signature = question.signature || createQuestionSignature(question);
        if (!exactSignatures.has(signature)) {
          exactSignatures.set(signature, []);
        }
        exactSignatures.get(signature).push({
          id: question.id,
          variant: question.__variant,
        });
      });

      pool.forEach((question, index) => {
        validateQuestionShape(question, index).forEach((issue) => errors.push(`${subjectKey}: ${issue}`));

        byDifficulty[question.difficulty] = (byDifficulty[question.difficulty] || 0) + 1;
        byType[question.type] = (byType[question.type] || 0) + 1;
        byFormat[question.format] = (byFormat[question.format] || 0) + 1;
        topics.add(`${question.segment}::${question.topic}::${question.subtopic}`);

        const quality = explanationQualityScore(question);
        explanationQuality[quality.level] += 1;
        explanationQuality.averageScore += quality.score;
        explanationQuality.total += 1;
        subjectQuality[quality.level] += 1;

        const missing = Object.entries(quality.missingFields)
          .filter(([, isMissing]) => isMissing)
          .map(([field]) => field);
        if (missing.length) {
          missingExplanationFields.push({
            subject: subjectKey,
            id: question.id,
            topic: question.topic,
            missing,
          });
        }

        if (globalIds.has(question.id)) {
          errors.push(`Дублирующийся id в банке: ${question.id} (${subjectKey})`);
        } else {
          globalIds.set(question.id, subjectKey);
        }

        promptTokens.push({
          question,
          tokens: tokenSet(question.prompt),
        });
      });

      const hardRatio = pool.length ? byDifficulty.hard / pool.length : 0;
      if (hardRatio < SUBJECT_CONFIG[subjectKey].hardShareMin) {
        warnings.push(
          `${subjectKey}: доля hard ${Math.round(hardRatio * 100)}% ниже целевой ${Math.round(
            SUBJECT_CONFIG[subjectKey].hardShareMin * 100,
          )}%`,
        );
      }

      const singleChoiceCount = Number(byType["single-choice"] || 0);
      const nonSingleRatio = pool.length ? (pool.length - singleChoiceCount) / pool.length : 0;
      if (nonSingleRatio < 0.3) {
        warnings.push(
          `${subjectKey}: доля не single-choice ${Math.round(nonSingleRatio * 100)}% ниже целевых 30%`,
        );
      }

      const coverage = getContentCoverageMap(subjectKey);
      if (coverage.summary.noCoverage > 0) {
        warnings.push(`${subjectKey}: непокрытых тем ${coverage.summary.noCoverage}`);
      }
      if (coverage.summary.weakCoverage > 0) {
        warnings.push(`${subjectKey}: слабое покрытие в ${coverage.summary.weakCoverage} темах`);
      }

      coverage.items.forEach((item) => {
        if (item.status === "нет") {
          coverageGaps.push({
            subject: subjectKey,
            section: item.section,
            topic: item.topic,
            subtopic: item.subtopic,
            reason: "нет покрытия",
          });
        } else if (item.status === "слабое") {
          weakCoverage.push({
            subject: subjectKey,
            section: item.section,
            topic: item.topic,
            subtopic: item.subtopic,
            reason: "слабое покрытие",
          });
        }
      });

      const difficultyNonZero = Object.values(byDifficulty).filter((value) => value > 0).length;
      if (difficultyNonZero < 3) {
        lowDifficultyDiversity.push({
          subject: subjectKey,
          byDifficulty,
          reason: "Покрыты не все уровни сложности",
        });
      }

      const alignment = evaluateOfficialAlignment(subjectKey, pool, byDifficulty, byType);
      if (alignment.missingExpectedTypes.length) {
        warnings.push(
          `${subjectKey}: отсутствуют ожидаемые форматы по blueprint: ${alignment.missingExpectedTypes.join(", ")}`,
        );
      }
      if (alignment.hardShare < alignment.targets.minHardShare) {
        warnings.push(
          `${subjectKey}: hard ${Math.round(alignment.hardShare * 100)}% ниже целевого порога ${Math.round(
            alignment.targets.minHardShare * 100,
          )}%`,
        );
      }
      if (alignment.mediumHardShare < alignment.targets.minMediumHardShare) {
        warnings.push(
          `${subjectKey}: medium+hard ${Math.round(
            alignment.mediumHardShare * 100,
          )}% ниже целевого порога ${Math.round(alignment.targets.minMediumHardShare * 100)}%`,
        );
      }
      if (alignment.nonSingleShare < alignment.targets.minNonSingleShare) {
        warnings.push(
          `${subjectKey}: доля не single-choice ${Math.round(
            alignment.nonSingleShare * 100,
          )}% ниже порога ${Math.round(alignment.targets.minNonSingleShare * 100)}%`,
        );
      }

      exactSignatures.forEach((ids, signature) => {
        if (ids.length > 1) {
          duplicateCandidates.push({
            subject: subjectKey,
            signature,
            ids,
          });
        }
      });

      for (let i = 0; i < promptTokens.length; i += 1) {
        for (let j = i + 1; j < promptTokens.length; j += 1) {
          const similarity = jaccardSimilarity(promptTokens[i].tokens, promptTokens[j].tokens);
          if (similarity >= 0.86) {
            nearDuplicateCandidates.push({
              subject: subjectKey,
              idA: promptTokens[i].question.id,
              idB: promptTokens[j].question.id,
              similarity: Number(similarity.toFixed(2)),
            });
          }
        }
      }

      bySubject[subjectKey] = {
        questionCount: pool.length,
        variantQuestionCount: allVariantQuestions.length,
        topicCount: topics.size,
        byDifficulty,
        byType,
        byFormat,
        officialQuestionCount: getOfficialQuestionsBySubject(subjectKey).length,
        alignment,
        coverage: coverage.summary,
        explanationQuality: subjectQuality,
      };
    });

    const trimmedNearDuplicates = nearDuplicateCandidates
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 120);

    const trimmedMissingExplanation = missingExplanationFields.slice(0, 250);

    const averageExplanationScore =
      explanationQuality.total > 0
        ? Math.round(explanationQuality.averageScore / explanationQuality.total)
        : 0;

    return {
      ok: errors.length === 0,
      errors,
      warnings,
      coverageGaps,
      weakCoverage,
      lowDifficultyDiversity,
      missingExplanationFields: trimmedMissingExplanation,
      duplicateCandidates,
      nearDuplicateCandidates: trimmedNearDuplicates,
      explanationQuality: {
        strong: explanationQuality.strong,
        medium: explanationQuality.medium,
        weak: explanationQuality.weak,
        averageScore: averageExplanationScore,
      },
      summary: {
        totalSubjects: Object.keys(bySubject).length,
        totalQuestions: Object.values(bySubject).reduce((acc, item) => acc + item.questionCount, 0),
      },
      officialPack: getOfficialPackSummary(),
      bySubject,
    };
  }

  global.ExamData = {
    VARIANT_COUNT,
    BASE_QUESTION_COUNT,
    MIN_TIME_MINUTES,
    MAX_TIME_MINUTES,
    SUBJECTS,
    getSubjectDefaults,
    clampQuestionCount,
    clampTimeLimit,
    buildCoverageMatrix,
    getVariantDiagnostics,
    rebuildVariant,
    listStableVariants,
    createVariantId,
    getQuestions,
    getQuestionPool,
    getSubjectBlueprint,
    getExamByBlueprint,
    getContentCoverageMap,
    validateQuestionBank,
    getOfficialAlignmentReport,
    setOfficialPack,
    getOfficialPackSummary,
    SUBJECT_BLUEPRINTS,
    SUBJECT_EXAM_PROFILES,
    CONTENT_COVERAGE_MAP,
    QUESTION_TYPE_META,
    OFFICIAL_PACK_FORMAT_VERSION,
    createQuestionSignature,
    normalizeQuestionShape,
    bootErrors: {
      blueprintUpgrade: BLUEPRINT_UPGRADE_ERROR ? String(BLUEPRINT_UPGRADE_ERROR.message || BLUEPRINT_UPGRADE_ERROR) : null,
      factoryValidation: FACTORY_VALIDATION_ERROR ? String(FACTORY_VALIDATION_ERROR.message || FACTORY_VALIDATION_ERROR) : null,
    },
  };
})(window);
