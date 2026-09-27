import {
  Barbell,
  Fire,
  HandFist,
  Heartbeat,
  Lightning,
  Mountains,
  PersonSimpleBike,
  PersonSimpleHike,
  PersonSimpleRun,
  PersonSimpleSwim,
  PersonSimpleWalk,
  Target,
  Timer,
  Trophy,
  type IconProps,
} from "@phosphor-icons/react";
import type { ComponentType } from "react";

/**
 * Curated gym-associated icons a trainer can pick from when adding/editing an
 * exercise (trainer#33) — a fixed allowlist rather than the whole Phosphor
 * set, so the picker stays a short, scannable grid.
 */
export const EXERCISE_ICONS = [
  "Barbell",
  "HandFist",
  "PersonSimpleRun",
  "PersonSimpleWalk",
  "PersonSimpleBike",
  "PersonSimpleSwim",
  "PersonSimpleHike",
  "Heartbeat",
  "Fire",
  "Lightning",
  "Timer",
  "Target",
  "Trophy",
  "Mountains",
] as const;

export type ExerciseIconName = (typeof EXERCISE_ICONS)[number];

const ICON_COMPONENTS: Record<ExerciseIconName, ComponentType<IconProps>> = {
  Barbell,
  HandFist,
  PersonSimpleRun,
  PersonSimpleWalk,
  PersonSimpleBike,
  PersonSimpleSwim,
  PersonSimpleHike,
  Heartbeat,
  Fire,
  Lightning,
  Timer,
  Target,
  Trophy,
  Mountains,
};

/** Falls back to the generic Barbell icon for `null`/unrecognised names (older exercises). */
export function exerciseIcon(
  iconName: string | null,
): ComponentType<IconProps> {
  if (iconName && iconName in ICON_COMPONENTS) {
    return ICON_COMPONENTS[iconName as ExerciseIconName];
  }
  return Barbell;
}
