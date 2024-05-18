const questions = [
  {
    question: "Năm 2008 đội bóng nào vô địch cup C1",
    answers: [
      { text: "Real Madrid", correct: false },
      { text: "Juventus", correct: false },
      { text: "Arsenal", correct: false },
      { text: "Barcelona", correct: true }
    ]
  },
  {
    question: "Vì mày tao phải đánh tao, vì tao tao phải đánh luôn cả mày. Hỏi đang làm gì?",
    answers: [
      { text: "Đánh nhau", correct: false },
      { text: "Chơi game", correct: false },
      { text: "Tập thể dục", correct: false },
      { text: "Đập muỗi", correct: true }
    ]
  },
  {
    question: "Cái gì có thể cung cấp một nền tảng vật lý để gắn kết các linh kiện điện tử?",
    answers: [
      { text: "CPU", correct: false },
      { text: "RAM", correct: false },
      { text: "Ổ cứng", correct: false },
      { text: "Bảng mạch", correct: true }
    ]
  },
  {
    question: "Bolivia là một quốc gia ở lục địa nào?",
    answers: [
      { text: "Châu Á", correct: false },
      { text: "Châu Âu", correct: false },
      { text: "Châu Phi", correct: false },
      { text: "Nam Mỹ", correct: true }
    ]
  },
  {
    question: "Diễn viên nào đóng vai chính trong phim 'Batman Begins' (2005)?",
    answers: [
      { text: "Ben Affleck", correct: false },
      { text: "Michael Keaton", correct: false },
      { text: "George Clooney", correct: false },
      { text: "Christian Bale", correct: true }
    ]
  },
  {
    question: "Giá vàng hiện nay cán mốc bao nhiêu.",
    answers: [
      { text: "5000 USD", correct: false },
      { text: "3000 USD", correct: false },
      { text: "1000 USD", correct: false },
      { text: "Tùy thời điểm", correct: true }
    ]
  }
];
let currentQuestionIndex = 0;

function showQuestion(question) {
  const questionElement = document.getElementById('question');
  questionElement.textContent = question.question;
  const buttonsContainer = document.getElementById('answer-buttons');
  buttonsContainer.innerHTML = '';
  question.answers.forEach(answer => {
    const button = document.createElement('button');
    button.innerText = answer.text;
    button.classList.add(
      'p-2', 'text-white', 'font-bold', 'rounded-lg', 'my-2',
      'bg-blue-500', 'hover:bg-blue-700', 'focus:outline-none'
    );
    button.onclick = () => selectAnswer(answer, button);
    buttonsContainer.appendChild(button);
  });
}

function selectAnswer(answer, button) {
  const buttons = document.querySelectorAll('#answer-buttons button');
  const body = document.body;
  buttons.forEach(btn => {
    btn.disabled = true;
    if (btn.innerText === answer.text) {
      btn.classList.remove('bg-blue-500', 'hover:bg-blue-700');
      btn.classList.add(answer.correct ? 'bg-green-500' : 'bg-red-500');
    }
  });

  if (!answer.correct) {
    body.classList.add('flash-red');
    setTimeout(() => {
      body.classList.remove('flash-red');
      buttons.forEach(btn => btn.disabled = false); // Re-enable buttons for another attempt
    }, 500);
  } else {
    setTimeout(() => {
      if (currentQuestionIndex + 1 < questions.length) {
        currentQuestionIndex++;
        showQuestion(questions[currentQuestionIndex]);
      } else {
        document.getElementById('question').textContent = "'5 chú cừu lưu manh' xin Cảm ơn";
        document.getElementById('answer-buttons').innerHTML = '';
      }
    }, 1000);
  }
}

function startQuiz() {
  showQuestion(questions[currentQuestionIndex]);
}

startQuiz();
