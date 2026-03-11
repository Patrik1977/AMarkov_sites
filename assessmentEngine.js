(function attachAssessmentEngine(global) {
  const TYPE_LABELS = {
    "single-choice": "Один ответ",
    "multi-choice": "Несколько ответов",
    "short-text": "Короткий текст",
    "numeric-input": "Числовой ввод",
    "sequence-order": "Порядок",
    matching: "Сопоставление",
    "fill-in-the-blank": "Заполнение пропусков",
    "extended-answer-lite": "Развернутый ответ (lite)",
  };

  function normalizeType(type) {
    return TYPE_LABELS[type] ? type : "single-choice";
  }

  function normalizeText(value) {
    const source = String(value || "")
      .toLowerCase()
      .replace(/ё/g, "е");
    const allowedExtra = new Set(["+", "-", ".", "/"]);

    let normalized = "";
    for (const char of source) {
      const code = char.charCodeAt(0);
      const isLatin = code >= 97 && code <= 122;
      const isCyrillic = code >= 1072 && code <= 1103;
      const isDigit = code >= 48 && code <= 57;
      const isSpace = /\s/.test(char);
      const isAllowedExtra = allowedExtra.has(char);

      normalized += isLatin || isCyrillic || isDigit || isSpace || isAllowedExtra ? char : " ";
    }

    return normalized.replace(/\s+/g, " ").trim();
  }

  function uniqueSorted(values) {
    return Array.from(new Set(values)).sort((a, b) => a - b);
  }

  function toNumber(value) {
    const parsed = Number(String(value).replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }

  function isDigitSequenceShortText(question) {
    const answers = Array.isArray(question && question.acceptedAnswers) ? question.acceptedAnswers : [];
    if (!answers.length) {
      return false;
    }
    let digitLike = 0;
    let hasLetters = false;
    answers.forEach((item) => {
      const token = String(item || "").trim();
      if (!token) {
        return;
      }
      if (/[A-Za-zА-Яа-яЁё]/.test(token)) {
        hasLetters = true;
      }
      if (/^[\d\s,.;:-]+$/.test(token) && /\d/.test(token)) {
        digitLike += 1;
      }
    });
    return digitLike > 0 && !hasLetters;
  }

  function buildShortTextFormatHint(question, numeric) {
    if (numeric) {
      return "Формат: только число. Можно использовать точку или запятую (например, 2.5 или 2,5).";
    }
    if (!isDigitSequenceShortText(question)) {
      return "";
    }

    const accepted = Array.isArray(question.acceptedAnswers) ? question.acceptedAnswers : [];
    const canonical = accepted
      .map((item) => String(item || "").replace(/\D/g, ""))
      .find((item) => item.length >= 2);
    const sample = canonical || "39";
    return `Формат: только цифры подряд, без пробелов и запятых (как в бланке ОГЭ). Пример: ${sample}.`;
  }

  function evaluateWithoutAutoKey(isAnswered, message) {
    return {
      isAnswered,
      isCorrect: Boolean(isAnswered),
      score: isAnswered ? 0.65 : 0,
      detail: {
        noAutoCheck: true,
        noAutoCheckMessage:
          message || "Для этого задания нет эталона ответа в локальном пакете. Нужна учебная самопроверка.",
      },
    };
  }

  function lockContainer(container) {
    container.querySelectorAll("input, textarea, select, button").forEach((element) => {
      element.disabled = true;
    });
  }

  function createChoiceContainer(container, question, multiple) {
    const options = Array.isArray(question.options) ? question.options : [];
    const name = `q-${question.id || Math.random().toString(36).slice(2)}`;

    options.forEach((option, index) => {
      const row = document.createElement("label");
      row.className = "type-row";
      const input = document.createElement("input");
      input.type = multiple ? "checkbox" : "radio";
      input.name = name;
      input.value = String(index);
      const text = document.createElement("span");
      text.textContent = `${index + 1}. ${option}`;
      row.appendChild(input);
      row.appendChild(text);
      container.appendChild(row);
    });

    return {
      getUserAnswer() {
        const marked = Array.from(container.querySelectorAll("input"))
          .filter((input) => input.checked)
          .map((input) => Number(input.value));
        return multiple
          ? { selectedIndexes: uniqueSorted(marked) }
          : { selectedIndex: marked.length ? marked[0] : null };
      },
      lock() {
        lockContainer(container);
      },
    };
  }

  function createShortTextContainer(container, question, numeric) {
    const input = document.createElement("input");
    input.type = numeric ? "text" : "text";
    input.placeholder = numeric ? "Введите число" : "Введите краткий ответ";
    input.className = "text-answer-input";
    container.appendChild(input);

    const hintText = buildShortTextFormatHint(question, numeric);
    if (hintText) {
      const hint = document.createElement("p");
      hint.className = "setup-note answer-format-hint";
      hint.textContent = hintText;
      container.appendChild(hint);
    }

    return {
      getUserAnswer() {
        return numeric ? { numericValue: toNumber(input.value), raw: input.value } : { text: input.value };
      },
      lock() {
        lockContainer(container);
      },
    };
  }

  function createSequenceContainer(container, question) {
    const items = Array.isArray(question.sequenceItems) ? question.sequenceItems : [];
    const positionValues = Array.from({ length: items.length }, (_, index) => String(index + 1));

    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "type-row sequence-row";

      const title = document.createElement("span");
      title.textContent = item.label || item.id || "Элемент";

      const select = document.createElement("select");
      select.dataset.itemId = item.id;
      const empty = document.createElement("option");
      empty.value = "";
      empty.textContent = "позиция";
      select.appendChild(empty);
      positionValues.forEach((value) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
      });

      row.appendChild(title);
      row.appendChild(select);
      container.appendChild(row);
    });

    return {
      getUserAnswer() {
        const map = {};
        container.querySelectorAll("select").forEach((select) => {
          map[select.dataset.itemId] = select.value ? Number(select.value) : null;
        });

        const ordered = Object.entries(map)
          .filter(([, position]) => Number.isInteger(position))
          .sort((a, b) => a[1] - b[1])
          .map(([id]) => id);

        return { orderMap: map, orderedIds: ordered };
      },
      lock() {
        lockContainer(container);
      },
    };
  }

  function createMatchingContainer(container, question) {
    const matching = question.matching || { left: [], right: [] };
    const left = Array.isArray(matching.left) ? matching.left : [];
    const right = Array.isArray(matching.right) ? matching.right : [];

    left.forEach((leftItem) => {
      const row = document.createElement("div");
      row.className = "type-row matching-row";

      const label = document.createElement("span");
      label.textContent = leftItem.label;

      const select = document.createElement("select");
      select.dataset.leftId = leftItem.id;

      const empty = document.createElement("option");
      empty.value = "";
      empty.textContent = "выберите";
      select.appendChild(empty);

      right.forEach((rightItem) => {
        const option = document.createElement("option");
        option.value = rightItem.id;
        option.textContent = rightItem.label;
        select.appendChild(option);
      });

      row.appendChild(label);
      row.appendChild(select);
      container.appendChild(row);
    });

    return {
      getUserAnswer() {
        const pairs = {};
        container.querySelectorAll("select").forEach((select) => {
          pairs[select.dataset.leftId] = select.value || "";
        });
        return { pairs };
      },
      lock() {
        lockContainer(container);
      },
    };
  }

  function createFillBlankContainer(container, question) {
    const blanks = Array.isArray(question.blanks) ? question.blanks : [];

    const prompt = document.createElement("p");
    prompt.className = "fill-prompt";
    prompt.textContent = "Заполните пропуски:";
    container.appendChild(prompt);

    blanks.forEach((blank, index) => {
      const row = document.createElement("label");
      row.className = "type-row";
      const span = document.createElement("span");
      span.textContent = blank.label || `Пропуск ${index + 1}`;
      const input = document.createElement("input");
      input.type = "text";
      input.dataset.blankId = blank.id || `blank-${index}`;
      input.placeholder = "Введите ответ";
      row.appendChild(span);
      row.appendChild(input);
      container.appendChild(row);
    });

    return {
      getUserAnswer() {
        const answers = [];
        container.querySelectorAll("input").forEach((input) => {
          answers.push(input.value);
        });
        return { blanks: answers };
      },
      lock() {
        lockContainer(container);
      },
    };
  }

  function createExtendedAnswerContainer(container, question) {
    const area = document.createElement("textarea");
    area.rows = 8;
    area.className = "extended-answer-input";
    area.placeholder = "Напишите развернутый ответ";
    container.appendChild(area);

    const rubric = question.rubric || {};
    const checklist = Array.isArray(rubric.checklist) ? rubric.checklist : [];
    const requiredPoints = Array.isArray(rubric.requiredKeyPoints)
      ? rubric.requiredKeyPoints
      : Array.isArray(rubric.keyPoints)
        ? rubric.keyPoints
        : [];
    const optionalPoints = Array.isArray(rubric.optionalKeyPoints) ? rubric.optionalKeyPoints : [];
    if (checklist.length) {
      const list = document.createElement("div");
      list.className = "rubric-box";
      const title = document.createElement("h4");
      title.textContent = "Чек-лист самооценки";
      list.appendChild(title);
      checklist.forEach((item) => {
        const row = document.createElement("p");
        row.textContent = `• ${item}`;
        list.appendChild(row);
      });
      container.appendChild(list);
    }

    if (requiredPoints.length || optionalPoints.length) {
      const keyBox = document.createElement("div");
      keyBox.className = "rubric-box";
      const title = document.createElement("h4");
      title.textContent = "Критерии учебной проверки";
      keyBox.appendChild(title);
      if (requiredPoints.length) {
        const requiredText = document.createElement("p");
        requiredText.textContent = `Обязательные элементы: ${requiredPoints.join(", ")}`;
        keyBox.appendChild(requiredText);
      }
      if (optionalPoints.length) {
        const optionalText = document.createElement("p");
        optionalText.textContent = `Желательные элементы: ${optionalPoints.join(", ")}`;
        keyBox.appendChild(optionalText);
      }
      container.appendChild(keyBox);
    }

    const reviewBox = document.createElement("div");
    reviewBox.className = "rubric-box";
    const reviewTitle = document.createElement("h4");
    reviewTitle.textContent = "Педагогическая отметка (вручную)";
    reviewBox.appendChild(reviewTitle);
    const checks = [
      { key: "logicPresent", label: "Логика ответа есть" },
      { key: "argumentationSufficient", label: "Аргументация достаточна" },
      { key: "criticalErrors", label: "Есть критичные ошибки" },
    ];
    checks.forEach((item) => {
      const row = document.createElement("label");
      row.className = "type-row";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.dataset.reviewKey = item.key;
      const text = document.createElement("span");
      text.textContent = item.label;
      row.appendChild(input);
      row.appendChild(text);
      reviewBox.appendChild(row);
    });
    container.appendChild(reviewBox);

    return {
      getUserAnswer() {
        const manualReview = {
          logicPresent: false,
          argumentationSufficient: false,
          criticalErrors: false,
        };
        container.querySelectorAll("input[data-review-key]").forEach((input) => {
          manualReview[input.dataset.reviewKey] = Boolean(input.checked);
        });
        return { text: area.value, manualReview };
      },
      lock() {
        lockContainer(container);
      },
    };
  }

  function renderQuestionInput(container, question) {
    const type = normalizeType(question.type);
    container.innerHTML = "";

    if (type === "single-choice") {
      return createChoiceContainer(container, question, false);
    }
    if (type === "multi-choice") {
      return createChoiceContainer(container, question, true);
    }
    if (type === "short-text") {
      return createShortTextContainer(container, question, false);
    }
    if (type === "numeric-input") {
      return createShortTextContainer(container, question, true);
    }
    if (type === "sequence-order") {
      return createSequenceContainer(container, question);
    }
    if (type === "matching") {
      return createMatchingContainer(container, question);
    }
    if (type === "fill-in-the-blank") {
      return createFillBlankContainer(container, question);
    }
    if (type === "extended-answer-lite") {
      return createExtendedAnswerContainer(container, question);
    }

    return createChoiceContainer(container, question, false);
  }

  function arraysEqual(a, b) {
    if (a.length !== b.length) {
      return false;
    }
    for (let index = 0; index < a.length; index += 1) {
      if (a[index] !== b[index]) {
        return false;
      }
    }
    return true;
  }

  function evaluateExtendedAnswer(question, answerText, manualReviewInput) {
    const rubric = question.rubric || {};
    const requiredKeyPoints = Array.isArray(rubric.requiredKeyPoints)
      ? rubric.requiredKeyPoints
      : Array.isArray(rubric.keyPoints)
        ? rubric.keyPoints
        : [];
    const optionalKeyPoints = Array.isArray(rubric.optionalKeyPoints) ? rubric.optionalKeyPoints : [];
    const normalized = normalizeText(answerText);

    if (!normalized) {
      return {
        isAnswered: false,
        score: 0,
        isCorrect: false,
        detail: {
          matchedKeyPoints: [],
          matchedRequired: [],
          missingRequired: requiredKeyPoints.slice(),
          matchedOptional: [],
          missingOptional: optionalKeyPoints.slice(),
          ratio: 0,
        },
      };
    }

    const includesPoint = (point) => normalized.includes(normalizeText(point));
    const matchedRequired = requiredKeyPoints.filter(includesPoint);
    const matchedOptional = optionalKeyPoints.filter(includesPoint);
    const missingRequired = requiredKeyPoints.filter((point) => !matchedRequired.includes(point));
    const missingOptional = optionalKeyPoints.filter((point) => !matchedOptional.includes(point));

    const requiredRatio = requiredKeyPoints.length
      ? matchedRequired.length / requiredKeyPoints.length
      : 1;
    const optionalRatio = optionalKeyPoints.length
      ? matchedOptional.length / optionalKeyPoints.length
      : 0;
    const lengthScore = normalized.length >= 140 ? 1 : normalized.length >= 90 ? 0.75 : normalized.length >= 60 ? 0.45 : 0.2;
    const ratio = requiredKeyPoints.length || optionalKeyPoints.length
      ? (requiredRatio * 0.75 + optionalRatio * 0.25)
      : normalized.length > 60
        ? 1
        : 0;

    let score = Math.min(1, requiredRatio * 0.65 + optionalRatio * 0.15 + lengthScore * 0.2);
    const manualReview = manualReviewInput || null;
    if (manualReview) {
      if (manualReview.logicPresent) {
        score += 0.05;
      }
      if (manualReview.argumentationSufficient) {
        score += 0.05;
      }
      if (manualReview.criticalErrors) {
        score -= 0.15;
      }
    }
    score = Math.max(0, Math.min(1, score));
    const isCorrect = score >= 0.62 && requiredRatio >= 0.6;

    return {
      isAnswered: true,
      isCorrect,
      score,
      detail: {
        matchedKeyPoints: matchedRequired.concat(matchedOptional),
        matchedRequired,
        missingRequired,
        matchedOptional,
        missingOptional,
        ratio,
        requiredRatio,
        optionalRatio,
        strongSample: rubric.strongSample || "",
        typicalErrors: rubric.typicalErrors || [],
        manualReview: manualReview || null,
      },
    };
  }

  function evaluateAnswer(question, userAnswer) {
    const type = normalizeType(question.type);

    if (type === "single-choice") {
      const selectedIndex = Number(userAnswer && userAnswer.selectedIndex);
      const isAnswered = Number.isInteger(selectedIndex) && selectedIndex >= 0;
      if (
        question.selfCheckOnly ||
        !Array.isArray(question.options) ||
        !question.options.length ||
        !Number.isInteger(question.correctIndex) ||
        question.correctIndex < 0 ||
        question.correctIndex >= question.options.length
      ) {
        return evaluateWithoutAutoKey(
          isAnswered,
          "В этом официальном задании требуется сверка с ключом/разбором: автопроверка недоступна.",
        );
      }
      const isCorrect = isAnswered && selectedIndex === question.correctIndex;
      return { isAnswered, isCorrect, score: isCorrect ? 1 : 0, detail: {} };
    }

    if (type === "multi-choice") {
      const selected = uniqueSorted(
        Array.isArray(userAnswer && userAnswer.selectedIndexes) ? userAnswer.selectedIndexes : [],
      );
      const correct = uniqueSorted(Array.isArray(question.correctAnswers) ? question.correctAnswers : []);
      const isAnswered = selected.length > 0;
      if (question.selfCheckOnly || !correct.length) {
        return evaluateWithoutAutoKey(
          isAnswered,
          "Задание с множественным выбором требует сверки по официальному ключу (учебная самопроверка).",
        );
      }
      const matchCount = selected.filter((value) => correct.includes(value)).length;
      const score = correct.length ? Math.max(0, (matchCount - Math.max(0, selected.length - matchCount)) / correct.length) : 0;
      const isCorrect = arraysEqual(selected, correct);
      return { isAnswered, isCorrect, score: isCorrect ? 1 : Math.max(0, Math.min(1, score)), detail: {} };
    }

    if (type === "short-text") {
      const value = normalizeText(userAnswer && userAnswer.text);
      const accepted = (question.acceptedAnswers || []).map(normalizeText).filter(Boolean);
      const isAnswered = Boolean(value);
      if (question.selfCheckOnly || !accepted.length) {
        return evaluateWithoutAutoKey(
          isAnswered,
          "Для этого краткого ответа нет эталона в локальном пакете, используйте самопроверку.",
        );
      }
      const isCorrect = isAnswered && accepted.includes(value);
      return { isAnswered, isCorrect, score: isCorrect ? 1 : 0, detail: {} };
    }

    if (type === "numeric-input") {
      const numericValue = userAnswer ? userAnswer.numericValue : undefined;
      const raw = userAnswer ? userAnswer.raw : undefined;
      const value = toNumber(numericValue !== undefined && numericValue !== null ? numericValue : raw);
      const answer = Number(question.numericAnswer);
      const tolerance = Number(question.tolerance || 0.01);
      const isAnswered = Number.isFinite(value);
      if (question.selfCheckOnly || !Number.isFinite(answer)) {
        return evaluateWithoutAutoKey(
          isAnswered,
          "Числовой ответ сохранён. Для проверки нужен официальный ключ или ручная сверка.",
        );
      }
      const isCorrect = isAnswered && Math.abs(value - answer) <= tolerance;
      return { isAnswered, isCorrect, score: isCorrect ? 1 : 0, detail: { value } };
    }

    if (type === "sequence-order") {
      const ordered = Array.isArray(userAnswer && userAnswer.orderedIds) ? userAnswer.orderedIds : [];
      const correct = Array.isArray(question.correctSequence) ? question.correctSequence : [];
      const isAnswered = ordered.length === correct.length;
      let matched = 0;
      for (let index = 0; index < Math.min(ordered.length, correct.length); index += 1) {
        if (ordered[index] === correct[index]) {
          matched += 1;
        }
      }
      const ratio = correct.length ? matched / correct.length : 0;
      const isCorrect = isAnswered && arraysEqual(ordered, correct);
      return { isAnswered, isCorrect, score: isCorrect ? 1 : ratio, detail: { matched } };
    }

    if (type === "matching") {
      const pairs = (userAnswer && userAnswer.pairs) || {};
      const expected = question.matchPairs || {};
      const keys = Object.keys(expected);
      let matched = 0;
      keys.forEach((key) => {
        if (pairs[key] && pairs[key] === expected[key]) {
          matched += 1;
        }
      });
      const answered = keys.filter((key) => pairs[key]).length;
      const isAnswered = answered > 0;
      if (question.selfCheckOnly || !keys.length) {
        return evaluateWithoutAutoKey(
          isAnswered,
          "Сопоставление сохранено. Для точной проверки нужна сверка по официальному ключу.",
        );
      }
      const ratio = keys.length ? matched / keys.length : 0;
      const isCorrect = keys.length > 0 && matched === keys.length;
      return { isAnswered, isCorrect, score: isCorrect ? 1 : ratio, detail: { matched, total: keys.length } };
    }

    if (type === "fill-in-the-blank") {
      const answers = Array.isArray(userAnswer && userAnswer.blanks) ? userAnswer.blanks : [];
      const expected = Array.isArray(question.correctBlanks) ? question.correctBlanks : [];
      const isAnswered = answers.some((value) => normalizeText(value));

      let matched = 0;
      expected.forEach((variants, index) => {
        const normalizedInput = normalizeText(answers[index]);
        const accepted = (variants || []).map(normalizeText);
        if (normalizedInput && accepted.includes(normalizedInput)) {
          matched += 1;
        }
      });

      const score = expected.length ? matched / expected.length : 0;
      const isCorrect = expected.length > 0 && matched === expected.length;
      return { isAnswered, isCorrect, score: isCorrect ? 1 : score, detail: { matched, total: expected.length } };
    }

    if (type === "extended-answer-lite") {
      return evaluateExtendedAnswer(
        question,
        userAnswer && userAnswer.text,
        userAnswer && userAnswer.manualReview,
      );
    }

    return { isAnswered: false, isCorrect: false, score: 0, detail: {} };
  }

  function formatCorrectAnswer(question) {
    const type = normalizeType(question.type);
    if (question && question.selfCheckOnly) {
      return "Автопроверка недоступна: сверяйтесь с официальным ключом/разбором";
    }
    if (type === "single-choice") {
      return (question.options && question.options[question.correctIndex]) || "";
    }
    if (type === "multi-choice") {
      return (question.correctAnswers || [])
        .map((index) => (question.options ? question.options[index] : ""))
        .filter(Boolean)
        .join(", ");
    }
    if (type === "short-text") {
      return (question.acceptedAnswers || [])[0] || "";
    }
    if (type === "numeric-input") {
      return String(question.numericAnswer !== undefined && question.numericAnswer !== null ? question.numericAnswer : "");
    }
    if (type === "sequence-order") {
      return (question.correctSequence || []).join(" -> ");
    }
    if (type === "matching") {
      return Object.entries(question.matchPairs || {})
        .map(([left, right]) => `${left}-${right}`)
        .join(", ");
    }
    if (type === "fill-in-the-blank") {
      return (question.correctBlanks || []).map((item) => item[0] || "").join(" / ");
    }
    if (type === "extended-answer-lite") {
      return "Оценивается по ключевым элементам и чек-листу";
    }
    return "";
  }

  global.AssessmentEngine = {
    TYPE_LABELS,
    normalizeType,
    renderQuestionInput,
    evaluateAnswer,
    formatCorrectAnswer,
    normalizeText,
  };
})(window);
