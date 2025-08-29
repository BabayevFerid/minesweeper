let board = [];
let rows, cols, mines;
let mineCount, revealedCount, flagsPlaced;
let timer, seconds, timerInterval;
let gameOver = false;

const boardEl = document.getElementById("board");
const mineCountEl = document.getElementById("mine-count");
const timerEl = document.getElementById("timer");
const bestTimeEl = document.getElementById("best-time");
const difficultyEl = document.getElementById("difficulty");
const popup = document.getElementById("popup");
const popupMessage = document.getElementById("popup-message");

document.getElementById("restart").addEventListener("click", restartGame);
difficultyEl.addEventListener("change", restartGame);

function restartGame() {
  clearInterval(timerInterval);
  timerEl.textContent = 0;
  seconds = 0;
  gameOver = false;
  revealedCount = 0;
  flagsPlaced = 0;

  let diff = difficultyEl.value;
  if (diff === "easy") { rows = 9; cols = 9; mines = 10; }
  if (diff === "medium") { rows = 16; cols = 16; mines = 40; }
  if (diff === "hard") { rows = 16; cols = 30; mines = 99; }

  boardEl.style.gridTemplateRows = `repeat(${rows}, 30px)`;
  boardEl.style.gridTemplateColumns = `repeat(${cols}, 30px)`;
  boardEl.innerHTML = "";

  board = Array.from({ length: rows }, () => Array(cols).fill({}));

  mineCount = mines;
  mineCountEl.textContent = mines;

  // Build cells
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.dataset.row = r;
      cell.dataset.col = c;

      cell.addEventListener("click", handleCellClick);
      cell.addEventListener("contextmenu", handleRightClick);

      boardEl.appendChild(cell);
      board[r][c] = { element: cell, revealed: false, mine: false, neighbor: 0, flag: false };
    }
  }

  popup.classList.add("hidden");
}

function placeMines(firstClickRow, firstClickCol) {
  let placed = 0;
  while (placed < mines) {
    let r = Math.floor(Math.random() * rows);
    let c = Math.floor(Math.random() * cols);
    if ((r === firstClickRow && c === firstClickCol) || board[r][c].mine) continue;
    board[r][c].mine = true;
    placed++;
  }

  // Calculate neighbors
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].mine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (r+dr>=0 && r+dr<rows && c+dc>=0 && c+dc<cols && board[r+dr][c+dc].mine) count++;
        }
      }
      board[r][c].neighbor = count;
    }
  }
}

function handleCellClick(e) {
  if (gameOver) return;
  const cell = e.target;
  const r = parseInt(cell.dataset.row);
  const c = parseInt(cell.dataset.col);

  if (seconds === 0 && revealedCount === 0) {
    placeMines(r, c);
    startTimer();
  }

  reveal(r, c);
  checkWin();
}

function handleRightClick(e) {
  e.preventDefault();
  if (gameOver) return;
  const r = parseInt(e.target.dataset.row);
  const c = parseInt(e.target.dataset.col);
  const cell = board[r][c];
  if (cell.revealed) return;

  if (!cell.flag) {
    cell.flag = true;
    cell.element.textContent = "🚩";
    flagsPlaced++;
    mineCountEl.textContent = mines - flagsPlaced;
  } else {
    cell.flag = false;
    cell.element.textContent = "";
    flagsPlaced--;
    mineCountEl.textContent = mines - flagsPlaced;
  }
}

function reveal(r, c) {
  const cell = board[r][c];
  if (cell.revealed || cell.flag) return;

  cell.revealed = true;
  cell.element.classList.add("revealed");
  revealedCount++;

  if (cell.mine) {
    cell.element.textContent = "💣";
    gameOver = true;
    clearInterval(timerInterval);
    showPopup("Game Over ❌");
    revealAllMines();
    return;
  }

  if (cell.neighbor > 0) {
    cell.element.textContent = cell.neighbor;
  } else {
    // Flood fill
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (r+dr>=0 && r+dr<rows && c+dc>=0 && c+dc<cols) {
          reveal(r+dr, c+dc);
        }
      }
    }
  }
}

function revealAllMines() {
  for (let r=0; r<rows; r++) {
    for (let c=0; c<cols; c++) {
      if (board[r][c].mine) {
        board[r][c].element.textContent = "💣";
        board[r][c].element.classList.add("revealed");
      }
    }
  }
}

function checkWin() {
  if (revealedCount === rows*cols - mines) {
    gameOver = true;
    clearInterval(timerInterval);
    showPopup("You Win 🎉");
    saveBestTime();
  }
}

function startTimer() {
  seconds = 0;
  timerInterval = setInterval(() => {
    seconds++;
    timerEl.textContent = seconds;
  }, 1000);
}

function showPopup(msg) {
  popupMessage.textContent = msg;
  popup.classList.remove("hidden");
}

function saveBestTime() {
  let diff = difficultyEl.value;
  let best = localStorage.getItem(`best-${diff}`);
  if (!best || seconds < best) {
    localStorage.setItem(`best-${diff}`, seconds);
  }
  loadBestTime();
}

function loadBestTime() {
  let diff = difficultyEl.value;
  let best = localStorage.getItem(`best-${diff}`);
  bestTimeEl.textContent = best ? best+"s" : "-";
}

// Start first game
restartGame();
loadBestTime();
