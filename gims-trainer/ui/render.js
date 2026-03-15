(function attachRender(global) {
  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function setHidden(el, hidden) {
    if (!el) return;
    if (hidden) {
      el.classList.add("hidden");
    } else {
      el.classList.remove("hidden");
    }
  }

  function scrollAndFocus(headingEl, behavior) {
    try {
      global.scrollTo({ top: 0, behavior: behavior || "smooth" });
    } catch (error) {
      global.scrollTo(0, 0);
    }
    if (headingEl && typeof headingEl.focus === "function") {
      headingEl.focus();
    }
  }

  function showView(els, key, config) {
    var views = {
      setup: els.setupView,
      learning: els.learningView,
      exam: els.examView,
      result: els.resultView,
    };

    Object.keys(views).forEach(function (viewKey) {
      setHidden(views[viewKey], viewKey !== key);
    });

    if (key === "setup") scrollAndFocus(els.setupHeading, config.ui.scrollBehavior);
    if (key === "learning") scrollAndFocus(els.learningHeading, config.ui.scrollBehavior);
    if (key === "exam") scrollAndFocus(els.examHeading, config.ui.scrollBehavior);
    if (key === "result") scrollAndFocus(els.resultHeading, config.ui.scrollBehavior);
  }

  function renderModuleChecklist(container, modules, learningState) {
    container.innerHTML = modules
      .map(function (module, idx) {
        var info = learningState.modules[module.id] || { passed: false };
        return '<div class="check-item ' + (info.passed ? "done" : "") + '">' +
          (info.passed ? "[x]" : "[ ]") +
          " " +
          (idx + 1) +
          ". " +
          escapeHtml(module.title) +
          "</div>";
      })
      .join("");
  }

  function renderSetup(els, payload) {
    els.learningStatusText.textContent = payload.learningText;
    els.examLockText.textContent = payload.examLockText;
    els.startExamBtn.disabled = !payload.canStart;

    els.moduleProgressText.textContent = payload.moduleProgressText;
    els.moduleProgressBar.style.width = payload.moduleProgressPercent + "%";

    renderModuleChecklist(els.moduleChecklist, payload.modules, payload.learningState);

    setHidden(els.mistakesHintText, !payload.mistakesHint);
    els.mistakesHintText.textContent = payload.mistakesHint || "";

    setHidden(els.quickPresetStatus, !payload.quickPresetNote);
    els.quickPresetStatus.textContent = payload.quickPresetNote || "";

    els.historyAttemptsValue.textContent = String(payload.history.attempts);
    els.historyAverageValue.textContent = payload.history.averagePercent + "%";
    els.historyMistakesValue.textContent = String(payload.history.mistakeQuestions);

    if (!payload.history.lastSessions.length) {
      els.historyList.innerHTML = '<p class="setup-note">История пока пустая.</p>';
    } else {
      els.historyList.innerHTML = payload.history.lastSessions
        .map(function (session) {
          return (
            '<article class="history-item">' +
            '<p class="history-title">' +
            escapeHtml(session.title) +
            "</p>" +
            "<p>" +
            escapeHtml(session.meta) +
            "</p>" +
            "</article>"
          );
        })
        .join("");
    }

    if (!payload.validationErrors.length) {
      els.bankValidationBox.innerHTML = '<p class="setup-note">Банк вопросов валиден.</p>';
    } else {
      els.bankValidationBox.innerHTML = payload.validationErrors
        .map(function (line) {
          return '<p class="warning-text">' + escapeHtml(line) + "</p>";
        })
        .join("");
    }

    if (payload.topProblems.length === 0) {
      els.topProblemsBox.innerHTML = '<p class="setup-note">Проблемных вопросов пока нет.</p>';
    } else {
      els.topProblemsBox.innerHTML = payload.topProblems
        .map(function (row) {
          return (
            '<article class="history-item">' +
            '<p class="history-title">' +
            escapeHtml(row.topic) +
            "</p>" +
            "<p>" +
            escapeHtml(row.prompt) +
            "</p>" +
            '<p>Ошибок: ' +
            row.wrong +
            " · mastery: " +
            Math.round(row.mastery * 100) +
            "%</p>" +
            "</article>"
          );
        })
        .join("");
    }

    function renderTopicList(box, list, emptyText) {
      if (!list.length) {
        box.innerHTML = '<p class="setup-note">' + escapeHtml(emptyText) + "</p>";
        return;
      }
      box.innerHTML = list
        .map(function (row) {
          return (
            '<article class="history-item">' +
            '<p class="history-title">' +
            escapeHtml(row.topic) +
            "</p>" +
            '<p>Попыток: ' +
            row.attempts +
            " · Ошибок: " +
            row.wrong +
            " · mastery: " +
            Math.round(row.mastery * 100) +
            "%</p>" +
            "</article>"
          );
        })
        .join("");
    }

    renderTopicList(els.weakTopicsBox, payload.topicSummary.weak, "Пока недостаточно данных.");
    renderTopicList(els.strongTopicsBox, payload.topicSummary.strong, "Пока недостаточно данных.");
  }

  function renderLearningModule(els, module, moduleIndex, totalModules, moduleState, quizState) {
    els.learningTitle.textContent = module.title;
    els.learningCounter.textContent = "Модуль " + (moduleIndex + 1) + " из " + totalModules;
    els.learningSummary.textContent = module.summary;
    els.learningMemo.textContent = module.memo;
    els.learningPoints.innerHTML = module.points
      .map(function (point) {
        return "<li>" + escapeHtml(point) + "</li>";
      })
      .join("");

    if (moduleState.passed) {
      els.modulePassBadge.textContent = "Мини-проверка пройдена";
      els.modulePassBadge.className = "setup-note success-text";
    } else {
      els.modulePassBadge.textContent = "Модуль не завершен: пройдите мини-проверку";
      els.modulePassBadge.className = "setup-note warning-text";
    }

    els.learningQuizBox.innerHTML = module.quiz
      .map(function (quizQuestion, idx) {
        var selected = quizState.answers[quizQuestion.id];
        return (
          '<article class="quiz-item">' +
          "<p><strong>" +
          (idx + 1) +
          ". " +
          escapeHtml(quizQuestion.prompt) +
          "</strong></p>" +
          quizQuestion.options
            .map(function (option, optionIndex) {
              return (
                '<label class="option-row">' +
                '<input type="radio" name="module-quiz-' +
                escapeHtml(module.id) +
                "-" +
                idx +
                '" value="' +
                optionIndex +
                '" data-quiz-id="' +
                escapeHtml(quizQuestion.id) +
                '" ' +
                (selected === optionIndex ? "checked" : "") +
                "/>" +
                "<span>" +
                escapeHtml(option) +
                "</span>" +
                "</label>"
              );
            })
            .join("") +
          "</article>"
        );
      })
      .join("");

    if (!quizState.feedback) {
      setHidden(els.learningQuizFeedback, true);
      els.learningQuizFeedback.textContent = "";
    } else {
      setHidden(els.learningQuizFeedback, false);
      els.learningQuizFeedback.textContent = quizState.feedback;
      els.learningQuizFeedback.className =
        "feedback-box " + (quizState.success ? "correct" : "wrong");
    }
  }

  function renderLearningImage(els, imagePath) {
    setHidden(els.learningImage, false);
    setHidden(els.learningImageFallback, true);
    els.learningImage.onerror = function () {
      setHidden(els.learningImage, true);
      setHidden(els.learningImageFallback, false);
    };
    els.learningImage.onload = function () {
      setHidden(els.learningImage, false);
      setHidden(els.learningImageFallback, true);
    };
    els.learningImage.src = imagePath;
  }

  function renderExamMedia(els, question) {
    if (!els.questionMediaWrap || !els.questionMediaImage || !els.questionMediaFallback) {
      return;
    }

    var media = question && question.media && typeof question.media === "object" ? question.media : null;
    var hasImage = media && media.type === "image" && String(media.src || "").trim();

    if (!hasImage) {
      setHidden(els.questionMediaWrap, true);
      setHidden(els.questionMediaImage, true);
      setHidden(els.questionMediaFallback, true);
      els.questionMediaImage.removeAttribute("src");
      els.questionMediaImage.alt = "";
      return;
    }

    setHidden(els.questionMediaWrap, false);
    setHidden(els.questionMediaImage, false);
    setHidden(els.questionMediaFallback, true);

    els.questionMediaFallback.textContent = "Изображение к вопросу не найдено";
    els.questionMediaImage.alt = String(media.alt || "Иллюстрация к вопросу");

    els.questionMediaImage.onerror = function () {
      setHidden(els.questionMediaImage, true);
      setHidden(els.questionMediaFallback, false);
    };

    els.questionMediaImage.onload = function () {
      setHidden(els.questionMediaImage, false);
      setHidden(els.questionMediaFallback, true);
    };

    els.questionMediaImage.src = media.src;
  }

  function renderExamQuestion(els, payload) {
    els.examCounter.textContent = payload.counterText;
    els.examProgressBar.style.width = payload.progressPercent + "%";
    els.questionTopic.textContent = payload.showTopic ? payload.question.topic : "Тема скрыта до завершения экзамена";
    els.questionPrompt.textContent = payload.question.prompt;

    renderExamMedia(els, payload.question);

    els.optionsBox.innerHTML = payload.question.options
      .map(function (option, index) {
        var checked = payload.currentAnswer === index;
        return (
          '<label class="option-row">' +
          '<input type="radio" name="exam-answer" value="' +
          index +
          '" ' +
          (checked ? "checked" : "") +
          " />" +
          "<span>" +
          escapeHtml(option) +
          "</span>" +
          "</label>"
        );
      })
      .join("");

    setHidden(els.feedbackBox, !payload.feedback);
    if (payload.feedback) {
      els.feedbackBox.className = "feedback-box " + (payload.feedback.correct ? "correct" : "wrong");
      els.feedbackBox.innerHTML = payload.feedback.html;
    } else {
      els.feedbackBox.textContent = "";
      els.feedbackBox.className = "feedback-box hidden";
    }

    els.submitOrNextBtn.textContent = payload.nextButtonText;
  }

  function renderResult(els, payload) {
    els.correctValue.textContent = String(payload.correct);
    els.totalValue.textContent = String(payload.total);
    els.percentValue.textContent = payload.percent + "%";
    els.resultMeta.textContent = payload.meta;

    if (!payload.mistakes.length) {
      els.reviewList.innerHTML = "<p>Ошибок нет. Отличная работа.</p>";
    } else {
      els.reviewList.innerHTML = payload.mistakes
        .map(function (item, idx) {
          return (
            '<article class="review-item">' +
            "<h4>" +
            (idx + 1) +
            ". " +
            escapeHtml(item.prompt) +
            "</h4>" +
            "<p><strong>Тема:</strong> " +
            escapeHtml(item.topic) +
            "</p>" +
            "<p><strong>Ваш ответ:</strong> " +
            escapeHtml(item.selectedText) +
            "</p>" +
            "<p><strong>Правильный ответ:</strong> " +
            escapeHtml(item.correctText) +
            "</p>" +
            "<p><strong>Почему правильно:</strong> " +
            escapeHtml(item.explanationLong) +
            "</p>" +
            "<p><strong>Почему другие неверны:</strong> " +
            escapeHtml(item.wrongExplanation) +
            "</p>" +
            "</article>"
          );
        })
        .join("");
    }

    if (!payload.topicGroups.length) {
      els.resultTopicsBox.innerHTML = '<p class="setup-note">Нет ошибок для группировки по темам.</p>';
    } else {
      els.resultTopicsBox.innerHTML = payload.topicGroups
        .map(function (row) {
          return (
            '<article class="history-item">' +
            '<p class="history-title">' +
            escapeHtml(row.topic) +
            "</p>" +
            "<p>Ошибок в попытке: " +
            row.errors +
            "</p>" +
            "</article>"
          );
        })
        .join("");
    }
  }

  function setSelectOptions(selectEl, options, selected) {
    if (!selectEl) return;
    selectEl.innerHTML = options
      .map(function (row) {
        return '<option value="' + escapeHtml(row.value) + '" ' + (row.value === selected ? "selected" : "") + ">" + escapeHtml(row.label) + "</option>";
      })
      .join("");
  }

  global.UIRender = {
    showView: showView,
    renderSetup: renderSetup,
    renderLearningModule: renderLearningModule,
    renderLearningImage: renderLearningImage,
    renderExamQuestion: renderExamQuestion,
    renderResult: renderResult,
    setSelectOptions: setSelectOptions,
    escapeHtml: escapeHtml,
    setHidden: setHidden,
  };
})(window);
