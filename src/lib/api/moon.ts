import { MoonData } from '../types';

// Moon phase calculation based on astronomical algorithms
// Reference: Jean Meeus, "Astronomical Algorithms"

export function getMoonPhase(date?: Date): MoonData {
  const targetDate = date || new Date();

  // Calculate the moon's age in days (0-29.53)
  const moonAge = calculateMoonAge(targetDate);

  // Determine phase and illumination
  const phase = getPhaseFromAge(moonAge);
  const illumination = calculateIllumination(moonAge);
  const emoji = getPhaseEmoji(phase);

  return {
    phase,
    illumination,
    emoji,
  };
}

function calculateMoonAge(date: Date): number {
  // Known new moon reference: January 6, 2000, 18:14 UTC
  const knownNewMoon = new Date('2000-01-06T18:14:00Z');
  const synodicMonth = 29.53058867; // Average lunar month in days

  // Calculate days since known new moon
  const daysSince = (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);

  // Get the moon's age within the current cycle
  let moonAge = daysSince % synodicMonth;
  if (moonAge < 0) moonAge += synodicMonth;

  return moonAge;
}

function getPhaseFromAge(moonAge: number): MoonData['phase'] {
  const synodicMonth = 29.53058867;
  const phaseLength = synodicMonth / 8;

  if (moonAge < phaseLength) return 'New Moon';
  if (moonAge < phaseLength * 2) return 'Waxing Crescent';
  if (moonAge < phaseLength * 3) return 'First Quarter';
  if (moonAge < phaseLength * 4) return 'Waxing Gibbous';
  if (moonAge < phaseLength * 5) return 'Full Moon';
  if (moonAge < phaseLength * 6) return 'Waning Gibbous';
  if (moonAge < phaseLength * 7) return 'Last Quarter';
  return 'Waning Crescent';
}

function calculateIllumination(moonAge: number): number {
  const synodicMonth = 29.53058867;

  // Illumination follows a cosine curve
  // 0 at new moon, 1 at full moon
  const phase = (moonAge / synodicMonth) * 2 * Math.PI;
  const illumination = (1 - Math.cos(phase)) / 2;

  return Math.round(illumination * 100);
}

function getPhaseEmoji(phase: MoonData['phase']): string {
  const emojiMap: Record<MoonData['phase'], string> = {
    'New Moon': '🌑',
    'Waxing Crescent': '🌒',
    'First Quarter': '🌓',
    'Waxing Gibbous': '🌔',
    'Full Moon': '🌕',
    'Waning Gibbous': '🌖',
    'Last Quarter': '🌗',
    'Waning Crescent': '🌘',
  };

  return emojiMap[phase];
}
