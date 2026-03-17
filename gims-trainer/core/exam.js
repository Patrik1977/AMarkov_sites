(function attachExamCore(global) {
  var IMAGE_REQUIRED_PATTERNS = [
    /на\s+(?:рисунк(?:е|у|а)|иллюстрац(?:ии|ию|ия)|схем(?:е|у|а))/i,
    /по\s+(?:рисунк(?:у|е)|иллюстрац(?:ии|ию)|схем(?:е|у))/i,
    /согласно\s+рисунк(?:у|е)/i,
    /изображ[её]н(?:о|а|ы|ный|ная)?/i,
    /изображенн(?:ый|ая|ые|ого|ому|ыми|ых)/i,
    /показан(?:о|а|ы)?\s+на\s+(?:рисунк(?:е|у)|иллюстрац(?:ии|ию)|схем(?:е|у))/i,
    /обозначен(?:о|а|ы)?\s+букв(?:ой|ами|а)/i,
    /букв[аы]\s*[A-Za-zА-Яа-я]/i,
    /по\s+данной\s+схеме/i,
  ];

  var EXPLANATION_NOISE_PATTERNS = [
    /для\s+успешной\s+сдачи\s+экзамена[^.?!\n]*(?:зелен|зел[её]н)/gi,
    /(?:как|то)\s+выделено\s+зелен[а-я\s-]*выше/gi,
    /смотрите\s+красн[а-я\s-]*рамк/gi,
    /как\s+подсвечен[а-я\s-]*/gi,
    /выделено\s+зелен[а-я\s-]*выше/gi,
  ];

  function clamp(num, min, max) {
    if (num < min) return min;
    if (num > max) return max;
    return num;
  }

  function shuffle(list) {
    var arr = list.slice();
    for (var i = arr.length - 1; i > 0; i -= 1) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
    return arr;
  }

  function uniqueBy(list, keyFn) {
    var map = {};
    var out = [];
    list.forEach(function (item) {
      var key = keyFn(item);
      if (!map[key]) {
        map[key] = true;
        out.push(item);
      }
    });
    return out;
  }

  function questionSignature(ids) {
    return ids.slice().sort().join("|");
  }

  function buildContextKey(options) {
    return [options.scenario, options.vesselType || "-", options.area || "-", options.sessionMode || "-"].join("::");
  }

  function normalizePrompt(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  function normalizeMediaSrc(value) {
    return String(value || "")
      .trim()
      .replace(/^\.\//, "")
      .replace(/^\/+/, "");
  }

  function makeMediaLookup(mediaManifest) {
    var lookup = {};
    if (!Array.isArray(mediaManifest)) {
      return { lookup: lookup, enforce: false };
    }

    mediaManifest.forEach(function (src) {
      var key = normalizeMediaSrc(src);
      if (!key) return;
      lookup[key] = true;
    });

    return {
      lookup: lookup,
      enforce: true,
    };
  }

  function normalizeOptionText(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/["«»]/g, "")
      .replace(/[^a-zа-я0-9\s-]+/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function explanationMentionsOptionIndexes(text, options) {
    if (!text || !Array.isArray(options) || options.length === 0) {
      return [];
    }

    var normText = normalizeOptionText(text);
    if (!normText) {
      return [];
    }

    var mentions = [];
    options.forEach(function (option, index) {
      var normOption = normalizeOptionText(option);
      if (!normOption || normOption.length < 4) {
        return;
      }
      if (normText.indexOf(normOption) >= 0) {
        mentions.push(index);
      }
    });

    return mentions;
  }

  function ensureExplanationMatchesCorrectOption(question) {
    if (!question || !Array.isArray(question.options) || typeof question.correctIndex !== "number") {
      return {
        updated: false,
        reason: null,
      };
    }

    if (question.correctIndex < 0 || question.correctIndex >= question.options.length) {
      return {
        updated: false,
        reason: null,
      };
    }

    var shortMentions = explanationMentionsOptionIndexes(question.explanationShort, question.options);
    var longMentions = explanationMentionsOptionIndexes(question.explanationLong, question.options);
    var allMentions = shortMentions.concat(longMentions);
    var hasMentions = allMentions.length > 0;
    var mentionsCorrect = allMentions.indexOf(question.correctIndex) >= 0;

    if (hasMentions && !mentionsCorrect) {
      var correctText = String(question.options[question.correctIndex] || "").trim();
      var fallback = "Правильный вариант: " + correctText + ".";
      question.explanationShort = fallback;
      question.explanationLong = fallback;
      return {
        updated: true,
        reason: "explanation-conflict",
      };
    }

    return {
      updated: false,
      reason: null,
    };
  }

  function sanitizeExplanation(text) {
    var raw = String(text || "");
    var cleaned = raw;
    var noiseDetected = false;

    EXPLANATION_NOISE_PATTERNS.forEach(function (pattern) {
      var next = cleaned.replace(pattern, " ");
      if (next !== cleaned) {
        noiseDetected = true;
        cleaned = next;
      }
    });

    cleaned = cleaned
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\s+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    var changed = cleaned !== raw.trim() || noiseDetected;

    if (!cleaned && raw.trim()) {
      cleaned = "Пояснение приведено в нейтральной формулировке по тренировочному банку.";
      changed = true;
      noiseDetected = true;
    }

    return {
      text: cleaned,
      changed: changed,
      noiseDetected: noiseDetected,
    };
  }

  function normalizeQuestion(question) {
    if (!question || typeof question !== "object") return null;

    var out = JSON.parse(JSON.stringify(question));

    if (!out.source) {
      out.source = "training";
    }

    if (!Array.isArray(out.tags)) {
      out.tags = [];
    }

    if (!Array.isArray(out.whyWrongOptions)) {
      out.whyWrongOptions = [];
    }

    var shortSanitized = sanitizeExplanation(out.explanationShort);
    var longSanitized = sanitizeExplanation(out.explanationLong);
    out.explanationShort = shortSanitized.text;
    out.explanationLong = longSanitized.text;

    var mediaSource = null;

    if (out.media && typeof out.media === "object") {
      mediaSource = out.media;
    } else if (typeof out.image === "string" || typeof out.imageSrc === "string") {
      mediaSource = {
        type: "image",
        src: out.imageSrc || out.image,
        alt: out.imageAlt || "",
      };
    } else if (out.figure && typeof out.figure === "object") {
      mediaSource = {
        type: out.figure.type || "image",
        src: out.figure.src || out.figure.imageSrc || "",
        alt: out.figure.alt || "",
      };
    }

    if (mediaSource) {
      var mediaType = String(mediaSource.type || "image").trim().toLowerCase();
      var mediaSrc = normalizeMediaSrc(mediaSource.src || mediaSource.imageSrc || "");
      var mediaAlt = String(mediaSource.alt || out.imageAlt || "").trim();
      if (!mediaAlt) {
        mediaAlt = String(out.prompt || "Иллюстрация к вопросу").trim();
      }

      out.media = {
        type: mediaType,
        src: mediaSrc,
        alt: mediaAlt,
      };
    } else {
      out.media = null;
    }

    var explanationCheck = ensureExplanationMatchesCorrectOption(out);

    out._normalization = {
      explanationChanged: shortSanitized.changed || longSanitized.changed || explanationCheck.updated,
      explanationNoiseDetected: shortSanitized.noiseDetected || longSanitized.noiseDetected,
      explanationConflictFixed: explanationCheck.updated,
    };

    return out;
  }

  function questionNeedsImage(question) {
    var text = [question.prompt, question.explanationShort, question.explanationLong].join(" ");
    return IMAGE_REQUIRED_PATTERNS.some(function (pattern) {
      return pattern.test(text);
    });
  }

  function validateMedia(media, mediaLookup) {
    if (!media) {
      return {
        exists: false,
        valid: false,
        reasons: ["media-missing"],
      };
    }

    var reasons = [];
    if (media.type !== "image") {
      reasons.push("media-invalid-type");
    }
    if (!String(media.src || "").trim()) {
      reasons.push("media-empty-src");
    }
    if (!String(media.alt || "").trim()) {
      reasons.push("media-empty-alt");
    }

    if (mediaLookup && mediaLookup.enforce && String(media.src || "").trim()) {
      var key = normalizeMediaSrc(media.src);
      if (!mediaLookup.lookup[key]) {
        reasons.push("media-src-not-found");
      }
    }

    return {
      exists: true,
      valid: reasons.length === 0,
      reasons: reasons,
    };
  }

  function prepareQuestionBank(questions, options) {
    var opts = options || {};
    var errors = [];
    var warnings = [];
    var idSet = {};
    var promptSet = {};
    var required = [
      "id",
      "section",
      "topic",
      "subtopic",
      "difficulty",
      "prompt",
      "options",
      "correctIndex",
      "explanationShort",
      "explanationLong",
      "whyWrongOptions",
      "tags",
    ];

    var mediaLookup = makeMediaLookup(opts.mediaManifest);

    var normalizedQuestions = [];
    var activeQuestions = [];
    var excludedQuestionIds = [];
    var missingMediaRequiredIds = [];
    var brokenMediaSrcIds = [];
    var noisyExplanationIds = [];
    var normalizedExplanationIds = [];

    questions.forEach(function (rawQuestion, index) {
      var question = normalizeQuestion(rawQuestion);
      if (!question) {
        errors.push("Question #" + index + " invalid object");
        return;
      }

      normalizedQuestions.push(question);

      var questionErrors = [];
      var normalizedPrompt = normalizePrompt(question.prompt);

      required.forEach(function (field) {
        if (question[field] === undefined || question[field] === null || question[field] === "") {
          questionErrors.push("Question #" + index + " missing field: " + field);
        }
      });

      if (!question.id) {
        questionErrors.push("Question #" + index + " missing id");
      } else if (idSet[question.id]) {
        questionErrors.push("Duplicate id: " + question.id);
      } else {
        idSet[question.id] = true;
      }

      if (!normalizedPrompt) {
        questionErrors.push("Question " + (question.id || "#" + index) + " has empty prompt");
      } else if (promptSet[normalizedPrompt]) {
        questionErrors.push("Duplicate prompt: " + question.prompt);
      } else {
        promptSet[normalizedPrompt] = true;
      }

      if (!Array.isArray(question.options) || question.options.length < 2) {
        questionErrors.push("Question " + (question.id || "#" + index) + " must have at least 2 options");
      }

      if (
        !Number.isInteger(question.correctIndex) ||
        question.correctIndex < 0 ||
        question.correctIndex >= (Array.isArray(question.options) ? question.options.length : 0)
      ) {
        questionErrors.push("Question " + (question.id || "#" + index) + " has invalid correctIndex");
      }

      if (!Array.isArray(question.whyWrongOptions) || question.whyWrongOptions.length < 1) {
        questionErrors.push("Question " + (question.id || "#" + index) + " must have whyWrongOptions explanations");
      }

      if (!String(question.explanationShort || "").trim() || !String(question.explanationLong || "").trim()) {
        questionErrors.push("Question " + (question.id || "#" + index) + " has empty explanation fields");
      }

      if (question.section !== "type" && question.section !== "area") {
        questionErrors.push("Question " + (question.id || "#" + index) + " has invalid section");
      }

      if (question.section === "type" && !question.vesselType) {
        questionErrors.push("Question " + (question.id || "#" + index) + " missing vesselType for type section");
      }

      if (question.section === "area" && !question.area) {
        questionErrors.push("Question " + (question.id || "#" + index) + " missing area for area section");
      }

      if (!rawQuestion.source) {
        warnings.push("Question " + (question.id || "#" + index) + " has no source mark, defaulted to training.");
      }

      if (question._normalization && question._normalization.explanationNoiseDetected) {
        noisyExplanationIds.push(question.id);
        warnings.push("Question " + question.id + " explanation normalized: removed UI-dependent phrases.");
      }

      if (question._normalization && question._normalization.explanationChanged) {
        normalizedExplanationIds.push(question.id);
      }

      var needsImage = questionNeedsImage(question);
      var mediaCheck = validateMedia(question.media, mediaLookup);

      if (mediaCheck.exists && !mediaCheck.valid) {
        if (mediaCheck.reasons.indexOf("media-src-not-found") >= 0 || mediaCheck.reasons.indexOf("media-empty-src") >= 0) {
          brokenMediaSrcIds.push(question.id);
        }
        warnings.push(
          "Question " +
            question.id +
            " has invalid media: " +
            mediaCheck.reasons.join(", ")
        );
      }

      if (needsImage && !mediaCheck.valid) {
        missingMediaRequiredIds.push(question.id);
        questionErrors.push("Question " + question.id + " requires image but has no usable media.");
      }

      if (!needsImage && mediaCheck.exists && !mediaCheck.valid) {
        question.media = null;
      }

      if (questionErrors.length > 0) {
        errors = errors.concat(questionErrors);
        excludedQuestionIds.push(question.id || "#" + index);
      } else {
        activeQuestions.push(question);
      }

      delete question._normalization;
    });

    excludedQuestionIds = uniqueBy(excludedQuestionIds, function (id) {
      return id;
    });
    missingMediaRequiredIds = uniqueBy(missingMediaRequiredIds, function (id) {
      return id;
    });
    brokenMediaSrcIds = uniqueBy(brokenMediaSrcIds, function (id) {
      return id;
    });
    noisyExplanationIds = uniqueBy(noisyExplanationIds, function (id) {
      return id;
    });
    normalizedExplanationIds = uniqueBy(normalizedExplanationIds, function (id) {
      return id;
    });

    var summary = {
      total: normalizedQuestions.length,
      valid: activeQuestions.length,
      missingMediaRequired: missingMediaRequiredIds.length,
      brokenMediaSrc: brokenMediaSrcIds.length,
      noisyExplanations: noisyExplanationIds.length,
      normalizedExplanations: normalizedExplanationIds.length,
      excluded: excludedQuestionIds.length,
      active: activeQuestions.length,
    };

    return {
      questions: normalizedQuestions,
      activeQuestions: activeQuestions,
      excludedQuestionIds: excludedQuestionIds,
      missingMediaRequiredIds: missingMediaRequiredIds,
      brokenMediaSrcIds: brokenMediaSrcIds,
      noisyExplanationIds: noisyExplanationIds,
      normalizedExplanationIds: normalizedExplanationIds,
      validation: {
        ok: errors.length === 0,
        errors: errors,
        warnings: warnings,
        summary: summary,
      },
    };
  }

  function validateQuestionBank(questions, options) {
    return prepareQuestionBank(questions, options).validation;
  }

  function createInitialQuestionStat(question) {
    return {
      attempts: 0,
      correct: 0,
      wrong: 0,
      streakCorrect: 0,
      lastAt: null,
      masteryScore: 0,
      topic: question.topic,
      subtopic: question.subtopic,
    };
  }

  function computeMastery(stat, config, nowIso) {
    var attempts = stat.attempts || 0;
    var correct = stat.correct || 0;
    var accuracy = attempts > 0 ? correct / attempts : 0;
    var streakBonus = Math.min(stat.streakCorrect || 0, 5) * 0.06;
    var wrongPenalty = Math.min(stat.wrong || 0, 10) * 0.015;

    var decay = 0;
    if (stat.lastAt && nowIso) {
      var days = Math.max(0, (Date.parse(nowIso) - Date.parse(stat.lastAt)) / (1000 * 60 * 60 * 24));
      decay = days * config.adaptation.masteryDecayPerDay;
    }

    return clamp(accuracy + streakBonus - wrongPenalty - decay, 0, 1);
  }

  function registerAnswer(stats, question, isCorrect, config, nowIso) {
    var questionStats = stats.questionStats || {};
    var item = questionStats[question.id] || createInitialQuestionStat(question);

    item.attempts += 1;
    item.lastAt = nowIso;
    item.topic = question.topic;
    item.subtopic = question.subtopic;

    if (isCorrect) {
      item.correct += 1;
      item.streakCorrect += 1;
    } else {
      item.wrong += 1;
      item.streakCorrect = 0;
    }

    item.masteryScore = computeMastery(item, config, nowIso);
    questionStats[question.id] = item;
    stats.questionStats = questionStats;
    return item;
  }

  function getRecentSignatures(stats, contextKey) {
    var bag = stats.recentTicketSignatures || {};
    return Array.isArray(bag[contextKey]) ? bag[contextKey] : [];
  }

  function saveRecentSignature(stats, contextKey, signature, maxLen) {
    if (!stats.recentTicketSignatures || typeof stats.recentTicketSignatures !== "object") {
      stats.recentTicketSignatures = {};
    }
    var list = getRecentSignatures(stats, contextKey).slice();
    list.unshift(signature);
    var unique = uniqueBy(list, function (item) {
      return item;
    });
    stats.recentTicketSignatures[contextKey] = unique.slice(0, maxLen);
  }

  function resolveSessionContextKey(session) {
    if (!session || typeof session !== "object") {
      return "";
    }
    if (session.contextKey) {
      return session.contextKey;
    }
    return buildContextKey({
      scenario: session.scenario,
      vesselType: session.vesselType,
      area: session.area,
      sessionMode: session.sessionMode,
    });
  }

  function collectRecentContextSessions(stats, contextKey, limitSessions) {
    var sessions = stats.sessions || [];
    var out = [];
    var cap = Math.max(1, Number(limitSessions) || 1);

    for (var i = 0; i < sessions.length; i += 1) {
      var session = sessions[i];
      if (!session || !Array.isArray(session.questionIds) || session.questionIds.length === 0) {
        continue;
      }

      var sessionContextKey = resolveSessionContextKey(session);
      if (contextKey && sessionContextKey && sessionContextKey !== contextKey) {
        continue;
      }

      out.push(session);
      if (out.length >= cap) {
        break;
      }
    }

    return out;
  }

  function collectRecentQuestionIds(stats, contextKey, questionLimit, sessionLimit) {
    var sessions = collectRecentContextSessions(stats, contextKey, sessionLimit);
    var out = [];
    var seen = {};
    var cap = Math.max(1, Number(questionLimit) || 1);

    for (var i = 0; i < sessions.length; i += 1) {
      var questionIds = sessions[i].questionIds || [];
      for (var j = 0; j < questionIds.length; j += 1) {
        var id = questionIds[j];
        if (seen[id]) {
          continue;
        }
        seen[id] = true;
        out.push(id);
        if (out.length >= cap) {
          return out;
        }
      }
    }

    return out;
  }

  function collectRecentQuestionCounts(stats, contextKey, sessionLimit) {
    var sessions = collectRecentContextSessions(stats, contextKey, sessionLimit);
    var counts = {};

    sessions.forEach(function (session) {
      (session.questionIds || []).forEach(function (id) {
        counts[id] = (counts[id] || 0) + 1;
      });
    });

    return counts;
  }

  function collectRecentQuestionSets(stats, contextKey, sessionLimit) {
    return collectRecentContextSessions(stats, contextKey, sessionLimit).map(function (session) {
      return uniqueBy(session.questionIds || [], function (id) {
        return id;
      });
    });
  }

  function maxOverlapCount(ids, recentSets) {
    if (!Array.isArray(ids) || !ids.length || !Array.isArray(recentSets) || !recentSets.length) {
      return 0;
    }

    var lookup = {};
    ids.forEach(function (id) {
      lookup[id] = true;
    });

    var maxOverlap = 0;
    recentSets.forEach(function (setIds) {
      var overlap = 0;
      (setIds || []).forEach(function (id) {
        if (lookup[id]) {
          overlap += 1;
        }
      });
      if (overlap > maxOverlap) {
        maxOverlap = overlap;
      }
    });

    return maxOverlap;
  }

  function buildBasePool(allQuestions, scenario, vesselType, area) {
    if (scenario === "type-ticket") {
      return allQuestions.filter(function (q) {
        return q.section === "type" && (q.vesselType === vesselType || q.vesselType === "any");
      });
    }

    if (scenario === "area-ticket") {
      return allQuestions.filter(function (q) {
        return q.section === "area" && (q.area === area || q.area === "any");
      });
    }

    if (scenario === "full") {
      return allQuestions.filter(function (q) {
        if (q.section === "type") {
          return q.vesselType === vesselType || q.vesselType === "any";
        }
        if (q.section === "area") {
          return q.area === area || q.area === "any";
        }
        return false;
      });
    }

    return allQuestions.slice();
  }

  function questionPriority(question, stats, recentIds, recentCounts, randomShift) {
    var qStat = stats.questionStats[question.id] || null;
    var mastery = qStat && typeof qStat.masteryScore === "number" ? qStat.masteryScore : 0;
    var seenRecently = recentIds.indexOf(question.id) >= 0;
    var recentPenalty = seenRecently ? -0.32 : 0;
    var frequencyPenalty = -Math.min(6, recentCounts[question.id] || 0) * 0.09;
    var generalPenalty = question.vesselType === "any" || question.area === "any" ? -0.1 : 0;
    return (1 - mastery) + recentPenalty + frequencyPenalty + generalPenalty + randomShift;
  }

  function pickBalanced(pool, count, stats, recentIds, recentCounts) {
    var maxPerSubtopic = Math.max(2, Math.ceil(count / 3));
    var bySubtopicCount = {};
    var counts = recentCounts || {};
    var ranked = pool
      .map(function (question) {
        return {
          q: question,
          score: questionPriority(question, stats, recentIds, counts, Math.random() * 0.75),
        };
      })
      .sort(function (a, b) {
        return b.score - a.score;
      });

    var selected = [];

    ranked.forEach(function (row) {
      if (selected.length >= count) {
        return;
      }
      var sub = row.q.subtopic || "Без подтемы";
      var used = bySubtopicCount[sub] || 0;
      if (used >= maxPerSubtopic) {
        return;
      }
      selected.push(row.q);
      bySubtopicCount[sub] = used + 1;
    });

    if (selected.length < count) {
      ranked.forEach(function (row) {
        if (selected.length >= count) {
          return;
        }
        if (selected.indexOf(row.q) >= 0) {
          return;
        }
        selected.push(row.q);
      });
    }

    return shuffle(selected.slice(0, count));
  }

  function avoidRecentWhenPossible(pool, recentIds, desiredCount) {
    var fresh = pool.filter(function (q) {
      return recentIds.indexOf(q.id) < 0;
    });

    if (fresh.length >= desiredCount) {
      return shuffle(fresh);
    }

    var minFresh = Math.max(3, Math.floor(desiredCount * 0.6));
    if (fresh.length >= minFresh) {
      var stale = shuffle(
        pool.filter(function (q) {
          return recentIds.indexOf(q.id) >= 0;
        })
      );
      return shuffle(fresh).concat(stale);
    }

    return shuffle(pool);
  }

  function calculateScenarioCount(config, scenario) {
    if (scenario === "type-ticket") return config.ticketSize.typeTicket;
    if (scenario === "area-ticket") return config.ticketSize.areaTicket;
    if (scenario === "mistakes") return config.ticketSize.mistakesDefault;
    return config.ticketSize.fullType + config.ticketSize.fullArea;
  }

  function splitFullPools(allQuestions, vesselType, area) {
    return {
      typePool: allQuestions.filter(function (q) {
        return q.section === "type" && (q.vesselType === vesselType || q.vesselType === "any");
      }),
      areaPool: allQuestions.filter(function (q) {
        return q.section === "area" && (q.area === area || q.area === "any");
      }),
    };
  }

  function buildMistakesPool(allQuestions, stats, config, vesselType, area) {
    return allQuestions.filter(function (q) {
      var stat = stats.questionStats[q.id];
      if (!stat) return false;
      var isMistake =
        stat.wrong >= config.mistakes.minWrongAttempts &&
        (typeof stat.masteryScore !== "number" || stat.masteryScore < config.mistakes.masteryScoreToExitMistakes);
      if (!isMistake) return false;
      if (q.section === "type") {
        return q.vesselType === vesselType || q.vesselType === "any";
      }
      if (q.section === "area") {
        return q.area === area || q.area === "any";
      }
      return false;
    });
  }

function getScenarioAvailability(options) {
  var questions = options.questions || [];
  var stats = options.stats || { questionStats: {} };
  var config = options.config;
  var scenario = options.scenario;
  var vesselType = options.vesselType;
  var area = options.area;

  if (scenario === "mistakes") {
    var requested = Number(options.mistakesCount) || config.ticketSize.mistakesDefault;
    var mistakesPool = buildMistakesPool(questions, stats, config, vesselType, area);
    return {
      scenario: scenario,
      requiredCount: requested,
      availableCount: mistakesPool.length,
      hasAny: mistakesPool.length > 0,
      hasEnough: mistakesPool.length >= requested,
      details: {
        mistakesPool: mistakesPool.length,
      },
    };
  }

  if (scenario === "full") {
    var split = splitFullPools(questions, vesselType, area);
    var typeNeed = config.ticketSize.fullType;
    var areaNeed = config.ticketSize.fullArea;
    var available = Math.min(typeNeed, split.typePool.length) + Math.min(areaNeed, split.areaPool.length);
    return {
      scenario: scenario,
      requiredCount: typeNeed + areaNeed,
      availableCount: available,
      hasAny: available > 0,
      hasEnough: split.typePool.length >= typeNeed && split.areaPool.length >= areaNeed,
      details: {
        typeRequired: typeNeed,
        typeAvailable: split.typePool.length,
        areaRequired: areaNeed,
        areaAvailable: split.areaPool.length,
      },
    };
  }

  var requiredCount = calculateScenarioCount(config, scenario);
  var pool = buildBasePool(questions, scenario, vesselType, area);
  return {
    scenario: scenario,
    requiredCount: requiredCount,
    availableCount: pool.length,
    hasAny: pool.length > 0,
    hasEnough: pool.length >= requiredCount,
    details: {},
  };
}

function generateTicket(options) {
  var questions = options.questions;
  var stats = options.stats;
  var config = options.config;
  var scenario = options.scenario;
  var vesselType = options.vesselType;
  var area = options.area;
  var allowShortTicket = Boolean(options.allowShortTicket);

  var contextKey = buildContextKey(options);
  var recentSignatures = getRecentSignatures(stats, contextKey);
  var recentQuestionIds = collectRecentQuestionIds(
    stats,
    contextKey,
    config.adaptation.recentQuestionWindow,
    config.adaptation.recentTicketWindow
  );
  var recentQuestionCounts = collectRecentQuestionCounts(stats, contextKey, config.adaptation.recentTicketWindow);
  var recentQuestionSets = collectRecentQuestionSets(stats, contextKey, config.adaptation.recentTicketWindow);
  var overlapRatio =
    typeof config.adaptation.maxTicketOverlapRatio === "number"
      ? config.adaptation.maxTicketOverlapRatio
      : 0.55;

  var warningBag = [];
  var candidate = [];
  var candidateFactory = null;

  if (scenario === "mistakes") {
    var mistakesPool = buildMistakesPool(questions, stats, config, vesselType, area);
    var requested = Number(options.mistakesCount) || config.ticketSize.mistakesDefault;
    mistakesPool = avoidRecentWhenPossible(mistakesPool, recentQuestionIds, requested);

    if (mistakesPool.length === 0) {
      return {
        ok: false,
        reason: "no-mistakes",
        questions: [],
        requiredCount: requested,
        availableCount: 0,
      };
    }

    if (mistakesPool.length < requested && !allowShortTicket) {
      return {
        ok: false,
        reason: "insufficient-pool",
        questions: [],
        requiredCount: requested,
        availableCount: mistakesPool.length,
        shortage: true,
      };
    }

    if (mistakesPool.length < requested) {
      warningBag.push(
        "Для работы над ошибками доступно только " + mistakesPool.length + " валидных вопросов из " + requested + "."
      );
    }

    candidate = pickBalanced(
      mistakesPool,
      Math.min(requested, mistakesPool.length),
      stats,
      recentQuestionIds,
      recentQuestionCounts
    );
    return {
      ok: candidate.length > 0,
      reason: candidate.length > 0 ? null : "no-mistakes",
      questions: candidate,
      requiredCount: requested,
      availableCount: mistakesPool.length,
      warnings: warningBag,
      contextKey: contextKey,
    };
  }

  var availability = getScenarioAvailability({
    questions: questions,
    stats: stats,
    config: config,
    scenario: scenario,
    vesselType: vesselType,
    area: area,
  });

  if (!availability.hasAny) {
    return {
      ok: false,
      reason: "pool-empty",
      questions: [],
      requiredCount: availability.requiredCount,
      availableCount: availability.availableCount,
    };
  }

  if (!availability.hasEnough && !allowShortTicket) {
    return {
      ok: false,
      reason: "insufficient-pool",
      questions: [],
      requiredCount: availability.requiredCount,
      availableCount: availability.availableCount,
      details: availability.details,
      shortage: true,
    };
  }

  if (scenario === "full") {
    var split = splitFullPools(questions, vesselType, area);
    var typeNeed = config.ticketSize.fullType;
    var areaNeed = config.ticketSize.fullArea;

    split.typePool = avoidRecentWhenPossible(split.typePool, recentQuestionIds, typeNeed);
    split.areaPool = avoidRecentWhenPossible(split.areaPool, recentQuestionIds, areaNeed);

    if (split.typePool.length < typeNeed) {
      warningBag.push("Недостаточно вопросов по типу судна: доступно " + split.typePool.length + " из " + typeNeed + ".");
    }
    if (split.areaPool.length < areaNeed) {
      warningBag.push("Недостаточно вопросов по району плавания: доступно " + split.areaPool.length + " из " + areaNeed + ".");
    }

    candidateFactory = function () {
      var typePart = pickBalanced(
        split.typePool,
        Math.min(typeNeed, split.typePool.length),
        stats,
        recentQuestionIds,
        recentQuestionCounts
      );
      var areaPart = pickBalanced(
        split.areaPool,
        Math.min(areaNeed, split.areaPool.length),
        stats,
        recentQuestionIds,
        recentQuestionCounts
      );
      return uniqueBy(typePart.concat(areaPart), function (q) {
        return q.id;
      });
    };

    candidate = candidateFactory();
  } else {
    var targetCount = calculateScenarioCount(config, scenario);
    var pool = buildBasePool(questions, scenario, vesselType, area);
    pool = avoidRecentWhenPossible(pool, recentQuestionIds, targetCount);
    if (pool.length < targetCount) {
      warningBag.push("Для сценария доступно " + pool.length + " валидных вопросов из " + targetCount + ".");
    }

    candidateFactory = function () {
      return pickBalanced(
        pool,
        Math.min(targetCount, pool.length),
        stats,
        recentQuestionIds,
        recentQuestionCounts
      );
    };

    candidate = candidateFactory();
  }

  if (candidate.length === 0) {
    return {
      ok: false,
      reason: "pool-empty",
      questions: [],
      requiredCount: availability.requiredCount,
      availableCount: availability.availableCount,
      warnings: warningBag,
    };
  }

  var selected = candidate;
  var selectedIds = selected.map(function (q) {
    return q.id;
  });
  var selectedSignature = questionSignature(selectedIds);
  var maxAllowedOverlap = Math.max(2, Math.floor(selectedIds.length * overlapRatio));
  var selectedOverlap = maxOverlapCount(selectedIds, recentQuestionSets);
  var hasFreshSignature = recentSignatures.indexOf(selectedSignature) < 0;

  if ((!hasFreshSignature || selectedOverlap > maxAllowedOverlap) && candidateFactory) {
    var best = selected;
    var bestIds = selectedIds;
    var bestSignature = selectedSignature;
    var bestOverlap = selectedOverlap;
    var bestFresh = hasFreshSignature;
    var attempts = 0;

    while (attempts < config.adaptation.maxTicketGenerationAttempts) {
      attempts += 1;

      var alt = candidateFactory();
      if (!alt || alt.length === 0) {
        continue;
      }

      var altIds = alt.map(function (q) {
        return q.id;
      });
      var altSignature = questionSignature(altIds);
      var altFresh = recentSignatures.indexOf(altSignature) < 0;
      var altOverlap = maxOverlapCount(altIds, recentQuestionSets);

      var better = false;
      if (altFresh && !bestFresh) {
        better = true;
      } else if (altFresh === bestFresh && altOverlap < bestOverlap) {
        better = true;
      } else if (altFresh === bestFresh && altOverlap === bestOverlap && Math.random() > 0.5) {
        better = true;
      }

      if (better) {
        best = alt;
        bestIds = altIds;
        bestSignature = altSignature;
        bestOverlap = altOverlap;
        bestFresh = altFresh;
      }

      if (altFresh && altOverlap <= maxAllowedOverlap) {
        break;
      }
    }

    selected = best;
    selectedIds = bestIds;
    selectedSignature = bestSignature;
    selectedOverlap = bestOverlap;
    hasFreshSignature = bestFresh;

    if (!hasFreshSignature) {
      warningBag.push("Банк ограничен: полностью новый набор вопросов собрать не удалось.");
    }
    if (selectedOverlap > maxAllowedOverlap) {
      warningBag.push("Часть вопросов повторяется из недавних билетов из-за ограничений выбранного фильтра.");
    }
  }

  return {
    ok: true,
    reason: null,
    questions: selected,
    requiredCount: availability.requiredCount,
    availableCount: availability.availableCount,
    contextKey: contextKey,
    signature: selectedSignature,
    warnings: warningBag,
  };
}

  function registerTicket(stats, contextKey, signature, config) {
    saveRecentSignature(stats, contextKey, signature, config.adaptation.recentTicketWindow);
  }

  function pickWeakAndStrongTopics(stats) {
    var topicMap = {};
    Object.keys(stats.questionStats || {}).forEach(function (questionId) {
      var stat = stats.questionStats[questionId];
      var topic = stat.topic || "Без темы";
      if (!topicMap[topic]) {
        topicMap[topic] = {
          topic: topic,
          attempts: 0,
          correct: 0,
          wrong: 0,
          avgMastery: 0,
          _count: 0,
        };
      }
      var row = topicMap[topic];
      row.attempts += stat.attempts || 0;
      row.correct += stat.correct || 0;
      row.wrong += stat.wrong || 0;
      row.avgMastery += Number(stat.masteryScore) || 0;
      row._count += 1;
    });

    var rows = Object.keys(topicMap).map(function (topic) {
      var row = topicMap[topic];
      var mastery = row._count > 0 ? row.avgMastery / row._count : 0;
      return {
        topic: row.topic,
        attempts: row.attempts,
        correct: row.correct,
        wrong: row.wrong,
        mastery: mastery,
      };
    });

    rows.sort(function (a, b) {
      return a.mastery - b.mastery;
    });

    return {
      weak: rows.slice(0, 5),
      strong: rows.slice().reverse().slice(0, 5),
      all: rows,
    };
  }

  function getTopProblemQuestions(stats, questions, limit) {
    var byId = {};
    questions.forEach(function (q) {
      byId[q.id] = q;
    });

    return Object.keys(stats.questionStats || {})
      .map(function (id) {
        var stat = stats.questionStats[id];
        return {
          id: id,
          prompt: byId[id] ? byId[id].prompt : id,
          topic: stat.topic || "Без темы",
          wrong: stat.wrong || 0,
          attempts: stat.attempts || 0,
          mastery: typeof stat.masteryScore === "number" ? stat.masteryScore : 0,
        };
      })
      .filter(function (row) {
        return row.wrong > 0;
      })
      .sort(function (a, b) {
        if (a.mastery !== b.mastery) return a.mastery - b.mastery;
        if (a.wrong !== b.wrong) return b.wrong - a.wrong;
        return b.attempts - a.attempts;
      })
      .slice(0, limit);
  }

  global.ExamCore = {
    validateQuestionBank: validateQuestionBank,
    prepareQuestionBank: prepareQuestionBank,
    questionNeedsImage: questionNeedsImage,
    registerAnswer: registerAnswer,
    computeMastery: computeMastery,
    generateTicket: generateTicket,
    registerTicket: registerTicket,
    pickWeakAndStrongTopics: pickWeakAndStrongTopics,
    getTopProblemQuestions: getTopProblemQuestions,
    buildContextKey: buildContextKey,
    getScenarioAvailability: getScenarioAvailability,
    shuffle: shuffle,
  };
})(window);
