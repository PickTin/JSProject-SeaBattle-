const ShipTemplates = [
  { size: 4, count: 1 },
  { size: 3, count: 2 },
  { size: 2, count: 3 },
  { size: 1, count: 4 }
];

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
