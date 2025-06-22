class AIPlayer {
  constructor() {
    this.availableShots = [];
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        this.availableShots.push({ x, y });
      }
    }
  }

  shuffleShots() {
    for (let i = this.availableShots.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.availableShots[i], this.availableShots[j]] = [this.availableShots[j], this.availableShots[i]];
    }
  }

  nextShot() {
    return this.availableShots.pop();
  }

  placeShipsRandomly(boardId) {
    const placed = [];
    for (const template of ShipTemplates) {
      for (let i = 0; i < template.count; i++) {
        let success = false;
        while (!success) {
          const x = Math.floor(Math.random() * 10);
          const y = Math.floor(Math.random() * 10);
          const horizontal = Math.random() < 0.5;
          if (this.canPlaceShip(placed, x, y, template.size, horizontal)) {
            placed.push({ x, y, size: template.size, horizontal });
            placeShip(boardId, x, y, template.size, horizontal);
            success = true;
          }
        }
      }
    }
  }

  canPlaceShip(ships, x, y, size, horizontal) {
    for (let i = 0; i < size; i++) {
      const cx = horizontal ? x + i : x;
      const cy = horizontal ? y : y + i;
      if (cx >= 10 || cy >= 10) return false;
      for (const ship of ships) {
        for (let j = 0; j < ship.size; j++) {
          const sx = ship.horizontal ? ship.x + j : ship.x;
          const sy = ship.horizontal ? ship.y : ship.y + j;
          if (Math.abs(sx - cx) <= 1 && Math.abs(sy - cy) <= 1) return false;
        }
      }
    }
    return true;
  }
}
