const APP_DATA = window.NAWAT_DATA;
const LESSONS = APP_DATA.lessons;

function getById(id) {
  return document.getElementById(id);
}

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function findLesson(id) {
  return LESSONS.find((lesson) => lesson.id === id);
}

function findUnit(unitId) {
  for (const term of APP_DATA.grade1.terms) {
    const unit = term.units.find((item) => item.id === unitId);
    if (unit) {
      return { unit, term };
    }
  }
  return null;
}

function createLinkCard(lesson, label) {
  return `
    <a class="lesson-link-card" href="lessons/lesson.html?id=${lesson.id}">
      <span class="lesson-chip">${label}</span>
      <h3>${lesson.title}</h3>
      <p>${lesson.summary}</p>
      <span class="mini-link">افتح الدرس</span>
    </a>
  `;
}

function renderGrade1Page() {
  const term1 = getById("term1Units");
  const term2 = getById("term2Units");
  if (!term1 || !term2) return;

  APP_DATA.grade1.terms.forEach((term) => {
    const target = term.id === "term1" ? term1 : term2;
    target.innerHTML = term.units
      .map((unit, index) => {
        const lessons = unit.lessons.map(findLesson);
        const items = lessons
          .map((lesson) => `<a href="lessons/lesson.html?id=${lesson.id}">${lesson.title}</a>`)
          .join("");
        return `
          <article class="unit-card" style="--unit-color:${unit.color}">
            <span class="unit-badge">الوحدة ${index + 1 + (term.id === "term2" ? 3 : 0)}</span>
            <h3>${unit.title}</h3>
            <p>${lessons.length} درس${lessons.length > 1 ? "ًا" : ""} تفاعلي مع أنشطة STEM</p>
            <div class="unit-lessons">${items}</div>
          </article>
        `;
      })
      .join("");
  });
}

function renderGamesPage() {
  const grid = getById("gamesGrid");
  if (!grid) return;
  const gameLabels = {
    dragdrop: "لعبة سحب وإفلات",
    matching: "لعبة مطابقة",
    sequence: "لعبة ترتيب",
    multiple: "لعبة اختيار من متعدد",
    truefalse: "لعبة صح أو خطأ"
  };

  grid.innerHTML = LESSONS.map((lesson) => createLinkCard(lesson, gameLabels[lesson.game.type] || "لعبة"))
    .join("");
}

function renderLessonPage() {
  const titleEl = getById("lessonTitle");
  if (!titleEl) return;

  const params = new URLSearchParams(window.location.search);
  const lessonId = params.get("id") || "l1";
  const lesson = findLesson(lessonId);

  if (!lesson) {
    titleEl.textContent = "الدرس غير موجود";
    return;
  }

  const unitInfo = findUnit(lesson.unitId);
  document.title = `${lesson.title} | نوات ستيم`;
  getById("lessonTitle").textContent = lesson.title;
  getById("lessonSummary").textContent = lesson.summary;
  getById("lessonUnitLabel").textContent = `${lesson.term} - ${unitInfo.unit.title}`;
  getById("activityTitle").textContent = lesson.stemActivity.title;
  getById("activityDuration").textContent = lesson.stemActivity.duration;
  getById("activityOutcome").textContent = lesson.stemActivity.outcome;
  getById("gameTypeLabel").textContent = gameTypeLabel(lesson.game.type);
  getById("gameIntro").textContent = lesson.game.intro;

  getById("lessonObjectives").innerHTML = lesson.objectives.map((item) => `<li>${item}</li>`).join("");
  getById("lessonConcepts").innerHTML = lesson.concepts.map((item) => `<span>${item}</span>`).join("");
  getById("activityMaterials").innerHTML = lesson.stemActivity.materials.map((item) => `<li>${item}</li>`).join("");
  getById("activitySteps").innerHTML = lesson.stemActivity.steps.map((item) => `<li>${item}</li>`).join("");
  getById("activityQuestions").innerHTML = lesson.stemActivity.reflection.map((item) => `<li>${item}</li>`).join("");

  getById("printLessonButton").addEventListener("click", () => window.print());
  renderAssessment(lesson);
  setupLessonGame(lesson);
}

function gameTypeLabel(type) {
  const labels = {
    dragdrop: "Drag & Drop",
    matching: "Matching",
    sequence: "Sequencing",
    multiple: "Multiple Choice",
    truefalse: "True / False"
  };
  return labels[type] || type;
}

function updateLessonGameMeta(lessonId, score, message) {
  const key = `nawat-game-${lessonId}`;
  const best = Math.max(Number(localStorage.getItem(key) || 0), score);
  localStorage.setItem(key, String(best));
  getById("lessonGameScore").textContent = score;
  getById("lessonGameBest").textContent = best;
  getById("lessonGameFeedback").textContent = message;
}

function setupLessonGame(lesson) {
  const board = getById("lessonGameArea");
  const resetButton = getById("resetLessonGame");
  if (!board || !resetButton) return;

  const game = lesson.game;
  if (game.type === "matching") {
    setupMatchingGame(lesson, board, resetButton);
  } else if (game.type === "dragdrop") {
    setupDragDropGame(lesson, board, resetButton);
  } else if (game.type === "sequence") {
    setupSequenceGame(lesson, board, resetButton);
  } else if (game.type === "multiple") {
    setupMultipleGame(lesson, board, resetButton);
  } else if (game.type === "truefalse") {
    setupTrueFalseGame(lesson, board, resetButton);
  }
}

function setupMatchingGame(lesson, board, resetButton) {
  let score = 0;
  let selectedLeft = null;
  let selectedRight = null;
  let matchedCount = 0;

  function render() {
    score = 0;
    selectedLeft = null;
    selectedRight = null;
    matchedCount = 0;
    const left = shuffle(lesson.game.pairs);
    const right = shuffle(lesson.game.pairs);
    board.innerHTML = `
      <div class="matching-columns">
        <div class="answer-stack">
          ${left
            .map(
              (item) =>
                `<button class="match-choice" data-side="left" data-id="${item.id}" type="button">${item.left}</button>`
            )
            .join("")}
        </div>
        <div class="answer-stack">
          ${right
            .map(
              (item) =>
                `<button class="match-choice" data-side="right" data-id="${item.id}" type="button">${item.right}</button>`
            )
            .join("")}
        </div>
      </div>
    `;
    updateLessonGameMeta(lesson.id, 0, "ابدأ باختيار بطاقة من كل عمود.");
    board.querySelectorAll(".match-choice").forEach((button) => {
      button.addEventListener("click", () => {
        if (button.disabled) return;
        const side = button.dataset.side;
        if (side === "left") {
          if (selectedLeft) selectedLeft.classList.remove("is-selected");
          selectedLeft = button;
        } else {
          if (selectedRight) selectedRight.classList.remove("is-selected");
          selectedRight = button;
        }
        button.classList.add("is-selected");
        if (selectedLeft && selectedRight) {
          const correct = selectedLeft.dataset.id === selectedRight.dataset.id;
          if (correct) {
            selectedLeft.classList.add("is-correct");
            selectedRight.classList.add("is-correct");
            selectedLeft.disabled = true;
            selectedRight.disabled = true;
            score += 1;
            matchedCount += 1;
            updateLessonGameMeta(
              lesson.id,
              score,
              matchedCount === lesson.game.pairs.length ? "أحسنت، أنهيت جميع المطابقات." : "مطابقة صحيحة."
            );
          } else {
            selectedLeft.classList.add("is-wrong");
            selectedRight.classList.add("is-wrong");
            updateLessonGameMeta(lesson.id, score, "ليست مطابقة صحيحة، جرّب مرة أخرى.");
            setTimeout(() => {
              selectedLeft.classList.remove("is-wrong", "is-selected");
              selectedRight.classList.remove("is-wrong", "is-selected");
            }, 700);
          }
          setTimeout(() => {
            if (selectedLeft) selectedLeft.classList.remove("is-selected");
            if (selectedRight) selectedRight.classList.remove("is-selected");
            selectedLeft = null;
            selectedRight = null;
          }, 720);
        }
      });
    });
  }

  resetButton.onclick = render;
  render();
}

function setupDragDropGame(lesson, board, resetButton) {
  let score = 0;

  function render() {
    score = 0;
    board.innerHTML = `
      <div class="drop-zones">
        ${lesson.game.categories
          .map(
            (category) => `
              <div class="drop-zone" data-category="${category.id}">
                <h4>${category.label}</h4>
                <div class="drop-slot">ضع البطاقات هنا</div>
              </div>
            `
          )
          .join("")}
      </div>
      <div class="drag-pool">
        ${shuffle(lesson.game.items)
          .map(
            (item) =>
              `<div class="drag-card" draggable="true" data-category="${item.category}" data-id="${item.id}">${item.label}</div>`
          )
          .join("")}
      </div>
    `;
    updateLessonGameMeta(lesson.id, 0, "اسحب البطاقات إلى الصندوق المناسب.");

    board.querySelectorAll(".drag-card").forEach((card) => {
      card.addEventListener("dragstart", (event) => {
        event.dataTransfer.setData("text/plain", card.dataset.id);
      });
    });

    board.querySelectorAll(".drop-zone").forEach((zone) => {
      zone.addEventListener("dragover", (event) => event.preventDefault());
      zone.addEventListener("drop", (event) => {
        event.preventDefault();
        const id = event.dataTransfer.getData("text/plain");
        const card = board.querySelector(`.drag-card[data-id="${id}"]`);
        if (!card || card.classList.contains("is-correct")) return;
        const correct = card.dataset.category === zone.dataset.category;
        if (correct) {
          zone.querySelector(".drop-slot").append(card);
          card.classList.add("is-correct");
          card.setAttribute("draggable", "false");
          score += 1;
          const finished = score === lesson.game.items.length;
          updateLessonGameMeta(lesson.id, score, finished ? "رائع، أنهيت التصنيف كاملًا." : "إجابة صحيحة.");
        } else {
          card.classList.add("is-wrong");
          updateLessonGameMeta(lesson.id, score, "هذا الصندوق غير مناسب لهذه البطاقة.");
          setTimeout(() => card.classList.remove("is-wrong"), 700);
        }
      });
    });
  }

  resetButton.onclick = render;
  render();
}

function setupSequenceGame(lesson, board, resetButton) {
  let score = 0;
  let stepIndex = 0;
  const correctSequence = lesson.game.sequence;

  function render() {
    score = 0;
    stepIndex = 0;
    board.innerHTML = `
      <div class="sequence-pool">
        ${shuffle(correctSequence)
          .map((item) => `<button class="sequence-choice" type="button">${item}</button>`)
          .join("")}
      </div>
    `;
    updateLessonGameMeta(lesson.id, 0, "اضغط المراحل بالترتيب الصحيح.");
    board.querySelectorAll(".sequence-choice").forEach((button) => {
      button.addEventListener("click", () => {
        const expected = correctSequence[stepIndex];
        const correct = button.textContent === expected;
        if (correct) {
          button.classList.add("is-correct");
          button.disabled = true;
          stepIndex += 1;
          score += 1;
          updateLessonGameMeta(
            lesson.id,
            score,
            stepIndex === correctSequence.length ? "ترتيب ممتاز." : "خطوة صحيحة، أكمل."
          );
        } else {
          button.classList.add("is-wrong");
          updateLessonGameMeta(lesson.id, score, `ابدأ بـ "${expected}".`);
          setTimeout(() => button.classList.remove("is-wrong"), 700);
        }
      });
    });
  }

  resetButton.onclick = render;
  render();
}

function setupMultipleGame(lesson, board, resetButton) {
  let score = 0;
  let index = 0;

  function renderQuestion() {
    const item = lesson.game.questions[index];
    board.innerHTML = `
      <div class="assessment-question">
        <h4>${item.prompt}</h4>
        <div class="answer-stack">
          ${item.options
            .map((option, optionIndex) => `<button class="choice-button" data-index="${optionIndex}" type="button">${option}</button>`)
            .join("")}
        </div>
      </div>
    `;
    board.querySelectorAll(".choice-button").forEach((button) => {
      button.addEventListener("click", () => {
        const correct = Number(button.dataset.index) === item.answer;
        board.querySelectorAll(".choice-button").forEach((btn) => (btn.disabled = true));
        if (correct) {
          button.classList.add("is-correct");
          score += 1;
        } else {
          button.classList.add("is-wrong");
          board.querySelectorAll(".choice-button")[item.answer].classList.add("is-correct");
        }
        updateLessonGameMeta(lesson.id, score, correct ? "إجابة صحيحة." : "جرّب السؤال التالي.");
        index += 1;
        if (index < lesson.game.questions.length) {
          setTimeout(renderQuestion, 900);
        } else {
          setTimeout(() => {
            updateLessonGameMeta(lesson.id, score, "انتهت اللعبة. اضغط إعادة اللعبة للمحاولة من جديد.");
          }, 900);
        }
      });
    });
  }

  function render() {
    score = 0;
    index = 0;
    renderQuestion();
    updateLessonGameMeta(lesson.id, 0, "ابدأ باختيار الإجابة الصحيحة.");
  }

  resetButton.onclick = render;
  render();
}

function setupTrueFalseGame(lesson, board, resetButton) {
  let score = 0;
  let answered = 0;

  function render() {
    score = 0;
    answered = 0;
    board.innerHTML = lesson.game.statements
      .map(
        (item, index) => `
          <div class="assessment-question" data-answer="${item.answer}">
            <h4>${item.text}</h4>
            <div class="tf-grid">
              <button class="tf-button" data-value="true" type="button">صح</button>
              <button class="tf-button" data-value="false" type="button">خطأ</button>
            </div>
          </div>
        `
      )
      .join("");
    updateLessonGameMeta(lesson.id, 0, "اقرأ كل جملة واختر صح أو خطأ.");

    board.querySelectorAll(".assessment-question").forEach((questionCard) => {
      questionCard.querySelectorAll(".tf-button").forEach((button) => {
        button.addEventListener("click", () => {
          if (questionCard.dataset.done) return;
          questionCard.dataset.done = "true";
          const correct = String(questionCard.dataset.answer) === button.dataset.value;
          questionCard.querySelectorAll(".tf-button").forEach((btn) => (btn.disabled = true));
          if (correct) {
            button.classList.add("is-correct");
            score += 1;
          } else {
            button.classList.add("is-wrong");
            const correctButton = [...questionCard.querySelectorAll(".tf-button")].find(
              (btn) => btn.dataset.value === String(questionCard.dataset.answer)
            );
            if (correctButton) correctButton.classList.add("is-correct");
          }
          answered += 1;
          updateLessonGameMeta(
            lesson.id,
            score,
            answered === lesson.game.statements.length ? "أكملت جميع الجمل." : "تم تسجيل إجابتك."
          );
        });
      });
    });
  }

  resetButton.onclick = render;
  render();
}

function renderAssessment(lesson) {
  const wrap = getById("lessonAssessment");
  if (!wrap) return;
  wrap.innerHTML = lesson.assessment
    .map(
      (item, index) => `
        <div class="assessment-question" data-answer="${item.answer}">
          <h4>${index + 1}. ${item.question}</h4>
          <div class="answer-stack">
            ${item.options
              .map(
                (option, optionIndex) =>
                  `<button class="choice-button" data-index="${optionIndex}" type="button">${option}</button>`
              )
              .join("")}
          </div>
          <p class="feedback-line"></p>
        </div>
      `
    )
    .join("");

  wrap.querySelectorAll(".assessment-question").forEach((card, questionIndex) => {
    card.querySelectorAll(".choice-button").forEach((button) => {
      button.addEventListener("click", () => {
        if (card.dataset.done) return;
        card.dataset.done = "true";
        const answer = lesson.assessment[questionIndex].answer;
        const feedback = lesson.assessment[questionIndex].feedback;
        const selected = Number(button.dataset.index);
        card.querySelectorAll(".choice-button").forEach((btn) => (btn.disabled = true));
        if (selected === answer) {
          button.classList.add("is-correct");
        } else {
          button.classList.add("is-wrong");
          card.querySelectorAll(".choice-button")[answer].classList.add("is-correct");
        }
        card.querySelector(".feedback-line").textContent = feedback;
      });
    });
  });
}

function renderGlobalQuiz() {
  const card = getById("globalQuizCard");
  if (!card) return;

  const questions = LESSONS.map((lesson) => ({
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    ...lesson.assessment[0]
  }));

  const bestKey = "nawat-global-quiz-best";
  let index = 0;
  let score = 0;
  let timeLeft = 20;
  let timerId = null;

  function updateHeader() {
    getById("globalQuizProgress").textContent = `${Math.min(index + 1, questions.length)} / ${questions.length}`;
    getById("globalQuizTimer").textContent = String(timeLeft);
    getById("globalQuizBest").textContent = localStorage.getItem(bestKey) || "0";
  }

  function finish(message) {
    clearInterval(timerId);
    const best = Math.max(Number(localStorage.getItem(bestKey) || 0), score);
    localStorage.setItem(bestKey, String(best));
    updateHeader();
    card.innerHTML = `<h3>انتهى الاختبار</h3><p>نتيجتك: ${score} من ${questions.length}</p><p>${message}</p>`;
    getById("globalQuizFeedback").textContent = "يمكنك إعادة الاختبار في أي وقت.";
  }

  function startTimer() {
    clearInterval(timerId);
    timerId = setInterval(() => {
      timeLeft -= 1;
      updateHeader();
      if (timeLeft <= 0) {
        index += 1;
        getById("globalQuizFeedback").textContent = "انتهى الوقت لهذا السؤال.";
        if (index >= questions.length) {
          finish("أكملت جميع الأسئلة.");
        } else {
          timeLeft = 20;
          renderQuestion();
        }
      }
    }, 1000);
  }

  function renderQuestion() {
    if (index >= questions.length) {
      finish("أكملت جميع الأسئلة.");
      return;
    }

    const question = questions[index];
    card.innerHTML = `
      <h3>${question.lessonTitle}</h3>
      <p>${question.question}</p>
      <div class="answer-stack">
        ${question.options
          .map(
            (option, optionIndex) =>
              `<button class="choice-button" data-index="${optionIndex}" type="button">${option}</button>`
          )
          .join("")}
      </div>
    `;
    updateHeader();
    getById("globalQuizFeedback").textContent = "";
    card.querySelectorAll(".choice-button").forEach((button) => {
      button.addEventListener("click", () => {
        const selected = Number(button.dataset.index);
        card.querySelectorAll(".choice-button").forEach((btn) => (btn.disabled = true));
        if (selected === question.answer) {
          score += 1;
          button.classList.add("is-correct");
          getById("globalQuizFeedback").textContent = question.feedback;
        } else {
          button.classList.add("is-wrong");
          card.querySelectorAll(".choice-button")[question.answer].classList.add("is-correct");
          getById("globalQuizFeedback").textContent = question.feedback;
        }
        index += 1;
        clearInterval(timerId);
        setTimeout(() => {
          timeLeft = 20;
          if (index >= questions.length) {
            finish("عمل جميل.");
          } else {
            renderQuestion();
            startTimer();
          }
        }, 950);
      });
    });
  }

  function resetQuiz() {
    index = 0;
    score = 0;
    timeLeft = 20;
    renderQuestion();
    startTimer();
  }

  getById("restartGlobalQuiz").addEventListener("click", resetQuiz);
  resetQuiz();
}

function initBot() {
  const form = getById("chatForm");
  const messages = getById("chatMessages");
  const input = getById("chatInput");
  if (!form || !messages || !input) return;

  function addMessage(text, role) {
    const div = document.createElement("div");
    div.className = `chat-message ${role}`;
    div.textContent = text;
    messages.append(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function answerQuestion(question) {
    const q = question.trim().toLowerCase();
    const lesson = LESSONS.find((item) => {
      return (
        q.includes(item.title.toLowerCase()) ||
        item.concepts.some((concept) => q.includes(concept.toLowerCase()))
      );
    });

    if (lesson) {
      return `هذا مرتبط بدرس "${lesson.title}". ${lesson.summary} يمكنك أيضًا فتح الدرس وقراءة الأهداف والمفاهيم والنشاط العملي منه.`;
    }

    if (q.includes("وحدة") || q.includes("درس")) {
      return "لدينا 6 وحدات و13 درسًا في الصف الأول الابتدائي. يمكنك الدخول إلى صفحة الصف الأول لاختيار الوحدة والدرس.";
    }

    if (q.includes("حواس")) {
      return "الحواس الخمس هي: البصر والسمع والشم واللمس والتذوق. ستجدينها في وحدة الحواس الخمس.";
    }

    if (q.includes("طقس")) {
      return "في وحدة الطقس والفصول نتعلم وصف الطقس اليومي والتعرف إلى الفصول الأربعة.";
    }

    return "أنا نوات. اسألني عن درس محدد مثل: أجزاء النبات، الفصول الأربعة، الدفع والسحب، أو الحواس الخمس.";
  }

  addMessage("مرحبًا، أنا نوات. اسألني عن أي درس من دروس الصف الأول الابتدائي.", "bot");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    addMessage(text, "user");
    addMessage(answerQuestion(text), "bot");
    input.value = "";
  });
}

function init() {
  renderGrade1Page();
  renderGamesPage();
  renderLessonPage();
  renderGlobalQuiz();
  initBot();
}

init();
