function createBoard(containerId, isPlayer) {
  const board = $(`#${containerId}`);
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      const cell = $(`<div class="cell" data-x="${x}" data-y="${y}"></div>`);
      if (isPlayer) {
        cell.attr("draggable", true);
      }
      board.append(cell);
    }
  }
}

function clearBoard(containerId) {
  $(`#${containerId}`).empty();
}

function renderStats() {
  const stats = getStats();
  $("#wins").text(stats.wins);
  $("#losses").text(stats.losses);
}

function markCell(containerId, x, y, result) {
  const board = $(`#${containerId}`);
  const cell = board.find(`.cell[data-x="${x}"][data-y="${y}"]`);
  cell.addClass(result);
}

function placeShip(containerId, x, y, size, horizontal) {
  const board = $(`#${containerId}`);
  for (let i = 0; i < size; i++) {
    const cx = horizontal ? x + i : x;
    const cy = horizontal ? y : y + i;
    const cell = board.find(`.cell[data-x="${cx}"][data-y="${cy}"]`);
    cell.addClass("ship");
  }
}

function enableDragAndDrop() {
  $(".cell").on("dragstart", function (e) {
    e.originalEvent.dataTransfer.setData("text/plain", JSON.stringify({
      x: $(this).data("x"),
      y: $(this).data("y")
    }));
  });

  $(".cell").on("dragover", function (e) {
    e.preventDefault();
  });

  $(".cell").on("drop", function (e) {
    e.preventDefault();
    const data = JSON.parse(e.originalEvent.dataTransfer.getData("text/plain"));
    const targetX = $(this).data("x");
    const targetY = $(this).data("y");
  });
}
