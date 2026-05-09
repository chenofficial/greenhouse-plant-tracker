import type { AppState, Stats } from '../shared/types.js';
import { BADGES } from '../shared/types.js';
import { awardBadge } from './repo.js';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

export function computeStreak(state: AppState): { current: number; longest: number } {
  const waterDays = [...new Set(state.log.map((e) => e.date.slice(0, 10)))].sort().reverse();
  if (waterDays.length === 0) return { current: 0, longest: 0 };

  const t = today();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  let current = 0;

  if (waterDays[0] === t || waterDays[0] === yesterday) {
    current = 1;
    for (let i = 1; i < waterDays.length; i++) {
      if (daysBetween(waterDays[i], waterDays[i - 1]) === 1) current++;
      else break;
    }
  }

  let longest = 1;
  let run = 1;
  for (let i = 1; i < waterDays.length; i++) {
    if (daysBetween(waterDays[i], waterDays[i - 1]) === 1) {
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  return { current, longest: Math.max(longest, current) };
}

export function computeStats(state: AppState): Stats {
  const streak = computeStreak(state);
  const todayStr = today();
  const wateredTodayIds = new Set(
    state.log.filter((e) => e.date.slice(0, 10) === todayStr).map((e) => e.plantId),
  );
  const allWateredToday =
    state.plants.length > 0 && state.plants.every((p) => wateredTodayIds.has(p.id));

  return {
    totalPlants: state.plants.length,
    totalWaterings: state.log.length,
    wateredToday: wateredTodayIds.size,
    currentStreak: streak.current,
    longestStreak: streak.longest,
    allWateredToday,
    badgesEarned: state.badges.length,
  };
}

export function checkBadges(state: AppState): { id: string; earnedAt: string }[] {
  const stats = computeStats(state);
  const earned = new Set(state.badges.map((b) => b.id));
  const newBadges: { id: string; earnedAt: string }[] = [];
  for (const b of BADGES) {
    if (!earned.has(b.id) && b.check(stats)) {
      const awarded = awardBadge(b.id);
      if (awarded) newBadges.push(awarded);
    }
  }
  return newBadges;
}
