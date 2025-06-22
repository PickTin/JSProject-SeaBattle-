let ai;
let playerTurn = true;
let playerShips = [];
let botShips = [];

let playerBoardState = [];
let botBoardState = [];

let aiHits = [];
let aiTargetCells = [];

$(document).ready(() => {
  initBoards();
  renderStats();

  $("#start-game").on("click", () => {
    startNewGame();
  });

  startNewGame();
});

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
  playerTurn = true;
  playerShips = [];
  botShips = [];
  aiHits = [];
  aiTargetCells = [];

  playerBoardState = createEmptyBoardState();
  botBoardState = createEmptyBoardState();

  clearBoardVisual("player-board");
  clearBoardVisual("bot-board");

  placeShipsRandomly(playerShips, playerBoardState);
  placeShipsRandomly(botShips, botBoardState);

  renderShipsOnBoard("player-board", playerBoardState);

  renderStats();
  attachPlayerClickHandler();
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

function renderShipsOnBoard(containerId, boardState) {
  const board = $(`#${containerId}`);
  board.find(".cell").removeClass("ship");
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      if (boardState[y][x] === "ship") {
        $(`#${containerId} .cell[data-x=${x}][data-y=${y}]`).addClass("ship");
      }
    }
  }
}

function attachPlayerClickHandler() {
  $("#bot-board .cell").off("click").on("click", function () {
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
        playerTurn = false;
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