function attendancePercentage(attended, totalSessions) {
  if (!totalSessions || totalSessions <= 0) return 0;
  return Math.round((attended / totalSessions) * 100);
}

function isBelowThreshold(percentage, threshold) {
  return percentage < threshold;
}

module.exports = { attendancePercentage, isBelowThreshold };
