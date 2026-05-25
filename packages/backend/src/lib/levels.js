function calculateLevel(xp) {
  return Math.min(99, Math.floor(xp / 200) + 1);
}

module.exports = { calculateLevel };
