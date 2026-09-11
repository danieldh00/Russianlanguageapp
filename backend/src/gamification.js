const XP_PER_CORRECT = 10;

const LEVELS = [
  { minXp: 0, title: 'Beginner (A1)' },
  { minXp: 100, title: 'Gevorderde beginner (A1)' },
  { minXp: 300, title: 'Elementair (A2)' },
  { minXp: 600, title: 'Gevorderd elementair (A2)' },
  { minXp: 1000, title: 'Middenniveau (B1)' },
  { minXp: 1500, title: 'Gevorderd middenniveau (B1+)' },
  { minXp: 2500, title: 'Zelfstandig gebruiker' }
];

function levelForXp(xp) {
  let index = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].minXp) index = i;
    else break;
  }
  const current = LEVELS[index];
  const next = LEVELS[index + 1] || null;
  return {
    level: index + 1,
    title: current.title,
    xpIntoLevel: xp - current.minXp,
    xpForNextLevel: next ? next.minXp - current.minXp : null,
    nextTitle: next ? next.title : null
  };
}

// dates: array of 'YYYY-MM-DD' strings (any order, duplicates ok)
function computeStreak(dates) {
  const daySet = new Set(dates);
  const fmt = (d) => d.toISOString().slice(0, 10);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  let currentStreak = 0;
  const cursor = new Date(today);
  if (!daySet.has(fmt(cursor))) {
    // haven't studied yet today -- that's fine, the streak isn't broken until a full day is skipped
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  while (daySet.has(fmt(cursor))) {
    currentStreak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  const sorted = [...daySet].sort();
  let longestStreak = 0;
  let run = 0;
  let prev = null;
  for (const d of sorted) {
    if (prev) {
      const diffDays = Math.round((new Date(d + 'T00:00:00Z') - new Date(prev + 'T00:00:00Z')) / 86400000);
      run = diffDays === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    longestStreak = Math.max(longestStreak, run);
    prev = d;
  }

  return { currentStreak, longestStreak };
}

const ACHIEVEMENTS = [
  { id: 'eerste_stap', title: 'Eerste stap', description: 'Je eerste oefening voltooid.', icon: '🚀', check: (s) => s.totalAttempts >= 1 },
  { id: 'week_streak', title: 'Een week volgehouden', description: '7 dagen op rij geoefend.', icon: '🔥', check: (s) => s.longestStreak >= 7 },
  { id: 'maand_streak', title: 'Een maand volgehouden', description: '30 dagen op rij geoefend.', icon: '🏆', check: (s) => s.longestStreak >= 30 },
  { id: 'vijftig_woorden', title: '50 woorden onder de knie', description: '50 woorden goed onder de knie.', icon: '📘', check: (s) => s.wordsMastered >= 50 },
  { id: 'honderdvijftig_woorden', title: '150 woorden onder de knie', description: '150 woorden goed onder de knie.', icon: '📚', check: (s) => s.wordsMastered >= 150 },
  { id: 'alle_grammatica', title: 'Alle grammatica onder de knie', description: 'Elke grammaticales voor 100% afgerond.', icon: '🧠', check: (s) => s.allGrammarMastered },
  { id: 'beleefd', title: 'Beleefdheden gemeesterd', description: "De les 'Begroetingen & basiszinnen' volledig onder de knie.", icon: '🤝', check: (s) => s.greetingsMastered },
  { id: 'vijfhonderd_xp', title: '500 XP verdiend', description: 'In totaal 500 XP verzameld.', icon: '⭐', check: (s) => s.xp >= 500 }
];

function computeAchievements(stats) {
  return ACHIEVEMENTS.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    icon: a.icon,
    unlocked: !!a.check(stats)
  }));
}

module.exports = { XP_PER_CORRECT, levelForXp, computeStreak, computeAchievements };
