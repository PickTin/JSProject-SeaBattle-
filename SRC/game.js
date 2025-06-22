const ShipTemplates = [
  { size: 4, count: 1 },
  { size: 3, count: 2 },
  { size: 2, count: 3 },
  { size: 1, count: 4 }
];

let manualShipTemplateIndex = 0;
let manualShipCountForCurrentSize = 0;
let playerTurn = true;
let playerShips = [];
let botShips = [];

let playerBoardState = [];
let botBoardState = [];

let aiHits = [];
let aiTargetCells = [];

let placementMode = "auto";
let manualHorizontal = true;
let gameStarted = false;

$(document).ready(() => {
  initBoards();
  renderStats();

  $("input[name='placement-mode']").change(function() {
    placementMode = $(this).val();
    startNewGame();
  });

  $("#rotate-ship").click(() => {
    manualHorizontal = !manualHorizontal;
    alert(`Орієнтація корабля: ${manualHorizontal ? "Горизонтальна" : "Вертикальна"}`);
  });

  $("#start-game").click(() => {
    if (placementMode === "manual") {
      if (!areAllManualShipsPlaced()) {
        alert("Встановіть всі кораблі вручну перед початком гри!");
        return;
      }
    }
    gameStarted = true;
    playerTurn = true;
    attachPlayerClickHandler();
    alert("Гра починається! Ваш хід.");
  });

  startNewGame();
});

function totalShipsCount() {
  return ShipTemplates.reduce((sum, s) => sum + s.count, 0);
}

function areAllManualShipsPlaced() {
  let placedCount = 0;
  for (const s of playerShips) {
    placedCount++;
  }
  return placedCount === totalShipsCount();
}

function initBoards() {
  createBoard("player-board");
  createBoard("bot-board");
}

function createBoard(containerId) {
  const board = $(`#${containerId}`);
  board.empty();
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      const cell = $(`<div class="cell" data-x="${x}" data-y="${y}"></div>`);
      board.append(cell);
    }
  }
}

function startNewGame() {
  manualShipTemplateIndex = 0;
  manualShipCountForCurrentSize = 0;
  gameStarted = false;
  playerShips = [];
  botShips = [];
  aiHits = [];
  aiTargetCells = [];

  playerBoardState = createEmptyBoardState();
  botBoardState = createEmptyBoardState();

  clearBoardVisual("player-board");
  clearBoardVisual("bot-board");

  if (placementMode === "auto") {
    placeShipsRandomly(playerShips, playerBoardState);
    renderShipsOnBoard("player-board", playerBoardState, true);
    attachPlayerClickHandler();
    gameStarted = true;
  } 
  if (placementMode === "manual") {
    alert(`Ручне розміщення кораблів. Встановіть корабель розміром ${ShipTemplates[manualShipTemplateIndex].size}. Орієнтація: Горизонтальна`);
    attachManualPlacementHandler();
  }

  placeShipsRandomly(botShips, botBoardState);
  renderShipsOnBoard("bot-board", botBoardState, false); 

  renderStats();
}

function createEmptyBoardState() {
  const board = [];
  for (let y = 0; y < 10; y++) {
    board[y] = [];
    for (let x = 0; x < 10; x++) {
      board[y][x] = "empty";
    }
  }
  return board;
}

function clearBoardVisual(containerId) {
  const board = $(`#${containerId}`);
  board.find(".cell").removeClass("ship hit miss hit-by-bot");
}

function renderShipsOnBoard(containerId, boardState, showShips) {
  const board = $(`#${containerId}`);
  board.find(".cell").removeClass("ship");
  if (!showShips) return;
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      if (boardState[y][x] === "ship") {
        $(`#${containerId} .cell[data-x=${x}][data-y=${y}]`).addClass("ship");
      }
    }
  }
}

function placeShipsRandomly(shipArray, boardState) {
  for (const template of ShipTemplates) {
    for (let i = 0; i < template.count; i++) {
      let placed = false;
      while (!placed) {
        const x = Math.floor(Math.random() * 10);
        const y = Math.floor(Math.random() * 10);
        const horizontal = Math.random() < 0.5;
        if (canPlaceShip(boardState, x, y, template.size, horizontal)) {
          placeShipOnBoard(shipArray, boardState, x, y, template.size, horizontal);
          placed = true;
        }
      }
    }
  }
}

function canPlaceShip(boardState, x, y, size, horizontal) {
  for (let i = 0; i < size; i++) {
    let cx = horizontal ? x + i : x;
    let cy = horizontal ? y : y + i;
    if (cx < 0 || cy < 0 || cx >= 10 || cy >= 10) return false;


    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        let nx = cx + dx;
        let ny = cy + dy;
        if (nx >= 0 && ny >= 0 && nx < 10 && ny < 10) {
          if (boardState[ny][nx] === "ship") return false;
        }
      }
    }
  }
  return true;
}

function placeShipOnBoard(shipArray, boardState, x, y, size, horizontal) {
  const shipCells = [];
  for (let i = 0; i < size; i++) {
    let cx = horizontal ? x + i : x;
    let cy = horizontal ? y : y + i;
    boardState[cy][cx] = "ship";
    shipCells.push({ x: cx, y: cy, hit: false });
  }
  shipArray.push({ size: size, cells: shipCells, sunk: false });
}

function attachManualPlacementHandler() {
  $("#player-board .cell").off("click").on("click", function () {
    if (placementMode !== "manual") return;
    if (gameStarted) return;

    const x = $(this).data("x");
    const y = $(this).data("y");
    const shipSize = ShipTemplates[manualShipTemplateIndex].size;

    if (!canPlaceShip(playerBoardState, x, y, shipSize, manualHorizontal)) {
      alert("Тут не можна розмістити корабель!");
      return;
    }

    placeShipOnBoard(playerShips, playerBoardState, x, y, shipSize, manualHorizontal);
    renderShipsOnBoard("player-board", playerBoardState, true);

    manualShipCountForCurrentSize++;

    if (manualShipCountForCurrentSize >= ShipTemplates[manualShipTemplateIndex].count) {
      manualShipTemplateIndex++;
      manualShipCountForCurrentSize = 0;
    }

    if (manualShipTemplateIndex >= ShipTemplates.length) {
      alert("Всі кораблі розміщені! Натисніть 'Почати гру'.");
      $("#player-board .cell").off("click");
    } else {
      alert(`Встановіть корабель розміром ${ShipTemplates[manualShipTemplateIndex].size}. Орієнтація: ${manualHorizontal ? "Горизонтальна" : "Вертикальна"}`);
    }
  });
}

function attachPlayerClickHandler() {
  $("#bot-board .cell").off("click").on("click", function () {
    if (!gameStarted) return;
    if (!playerTurn) return;

    const x = $(this).data("x");
    const y = $(this).data("y");

    if (botBoardState[y][x] === "hit" || botBoardState[y][x] === "miss") return;

    if (botBoardState[y][x] === "ship") {
      botBoardState[y][x] = "hit";
      $(this).addClass("hit");
      markShipHit(botShips, x, y);
      if (checkWin(botShips)) {
        alert("Ви перемогли!");
        updateStats("win");
        renderStats();
        gameStarted = false;
        return;
      }
    } else {
      botBoardState[y][x] = "miss";
      $(this).addClass("miss");
    }

    playerTurn = false;
    setTimeout(botMove, 800);
  });
}

function botMove() {
  let shot;

  if (aiHits.length === 0) {
    do {
      shot = { x: Math.floor(Math.random() * 10), y: Math.floor(Math.random() * 10) };
    } while (playerBoardState[shot.y][shot.x] === "hit-by-bot" || playerBoardState[shot.y][shot.x] === "miss");
  } else {
    if (aiTargetCells.length === 0) {
      aiTargetCells = getLineTargets(aiHits);
    }

    aiTargetCells = aiTargetCells.filter(cell =>
      cell.x >= 0 && cell.x < 10 &&
      cell.y >= 0 && cell.y < 10 &&
      playerBoardState[cell.y][cell.x] !== "hit-by-bot" &&
      playerBoardState[cell.y][cell.x] !== "miss"
    );

    if (aiTargetCells.length === 0) {
      aiHits = [];
      playerTurn = true;
      return;
    }

    shot = aiTargetCells.shift();
  }

  const cellState = playerBoardState[shot.y][shot.x];

  if (cellState === "ship") {
    playerBoardState[shot.y][shot.x] = "hit-by-bot";
    $(`#player-board .cell[data-x=${shot.x}][data-y=${shot.y}]`).removeClass("ship").addClass("hit-by-bot");

    markShipHit(playerShips, shot.x, shot.y);
    aiHits.push(shot);
    aiTargetCells = getLineTargets(aiHits);

    if (checkWin(playerShips)) {
      alert("Ви програли!");
      updateStats("loss");
      renderStats();
      gameStarted = false;
      return;
    }
  } else {
    playerBoardState[shot.y][shot.x] = "miss";
    $(`#player-board .cell[data-x=${shot.x}][data-y=${shot.y}]`).addClass("miss");
  }

  playerTurn = true;
}

function markShipHit(ships, x, y) {
  for (const ship of ships) {
    for (const cell of ship.cells) {
      if (cell.x === x && cell.y === y) {
        cell.hit = true;
        if (ship.cells.every(c => c.hit)) {
          ship.sunk = true;
        }
        return;
      }
    }
  }
}

function checkWin(ships) {
  return ships.every(ship => ship.sunk);
}

function getAdjacentCells(hits) {
  let adjCells = [];
  hits.forEach(hit => {
    adjCells.push({ x: hit.x + 1, y: hit.y });
    adjCells.push({ x: hit.x - 1, y: hit.y });
    adjCells.push({ x: hit.x, y: hit.y + 1 });
    adjCells.push({ x: hit.x, y: hit.y - 1 });
  });
  return adjCells;
}

function getLineTargets(hits) {
  if (hits.length < 2) return getAdjacentCells(hits);
  let xs = hits.map(h => h.x);
  let ys = hits.map(h => h.y);
  let isHorizontal = xs.every(x => x === xs[0]) ? false : true;
  let isVertical = ys.every(y => y === ys[0]) ? false : true;
  let targets = [];
  if (isHorizontal) {
    let minX = Math.min(...xs);
    let maxX = Math.max(...xs);
    let y = ys[0];
    targets.push({ x: minX - 1, y });
    targets.push({ x: maxX + 1, y });
  } else if (isVertical) {
    let minY = Math.min(...ys);
    let maxY = Math.max(...ys);
    let x = xs[0];
    targets.push({ x, y: minY - 1 });
    targets.push({ x, y: maxY + 1 });
  } else {
    targets = getAdjacentCells(hits);
  }
  return targets;
}

function getStats() {
  const wins = parseInt(localStorage.getItem("wins")) || 0;
  const losses = parseInt(localStorage.getItem("losses")) || 0;
  return { wins, losses };
}

function updateStats(type) {
  const key = type === "win" ? "wins" : "losses";
  const current = parseInt(localStorage.getItem(key)) || 0;
  localStorage.setItem(key, current + 1);
}

function renderStats() {
  const stats = getStats();
  $("#wins").text(stats.wins);
  $("#losses").text(stats.losses);
}
