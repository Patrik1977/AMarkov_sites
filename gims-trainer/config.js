(function attachAppConfig(global) {
  const AppConfig = {
    appVersion: 2,
    questionBankLabel: "Тренировочные + расширенный импортный банк",
    defaults: {
      scenario: "full",
      sessionMode: "training",
      vesselType: "motor",
      area: "inland-waterways",
      mistakesCount: 5,
    },
    scenarios: {
      full: { key: "full", title: "Полный комплект (тип + район)" },
      typeTicket: { key: "type-ticket", title: "Билет по типу судна" },
      areaTicket: { key: "area-ticket", title: "Билет по району плавания" },
      mistakes: { key: "mistakes", title: "Работа над ошибками" },
    },
    sessionModes: {
      training: {
        key: "training",
        title: "Тренировка",
        revealDuringSession: true,
        showTopicDuringSession: true,
      },
      exam: {
        key: "exam",
        title: "Экзамен",
        revealDuringSession: false,
        showTopicDuringSession: false,
      },
    },
    ticketSize: {
      fullType: 10,
      fullArea: 10,
      typeTicket: 10,
      areaTicket: 10,
      mistakesDefault: 5,
    },
    mistakes: {
      shortTicketOptions: [3, 5, 10],
      masteryScoreToExitMistakes: 0.75,
      minWrongAttempts: 1,
    },
    passScore: {
      moduleQuiz: 0.67,
      training: 0.75,
      exam: 0.8,
    },
    adaptation: {
      streakForStrong: 3,
      masteryCorrectBonus: 0.12,
      masteryWrongPenalty: 0.18,
      masteryDecayPerDay: 0.004,
      recentTicketWindow: 12,
      recentQuestionWindow: 80,
      maxTicketOverlapRatio: 0.45,
      maxTicketGenerationAttempts: 30,
    },
    limits: {
      maxSessionsStored: 150,
      maxHistoryPreview: 10,
      maxTopProblemQuestions: 10,
    },
    ui: {
      mobileBreakpoint: 900,
      scrollBehavior: "smooth",
    },
  };

  global.AppConfig = AppConfig;
})(window);
