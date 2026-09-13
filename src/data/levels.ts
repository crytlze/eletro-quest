/**
 * Data-driven level definitions.
 * Milestone 1: shell + shape of the data. Real graph solutions land in Milestone 4/5.
 * Architecture is already sized for 20+ puzzles (see TOTAL_LEVEL_SLOTS).
 */

export type ComponentType = 'battery' | 'switch' | 'resistor' | 'bulb';

export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Expert';

export interface ComponentRequirement {
  type: ComponentType;
  count: number;
}

export interface LevelDefinition {
  id: number;
  title: string;
  subtitle: string;
  difficulty: Difficulty;
  components: ComponentRequirement[];
  /** Short human-readable goal shown in GameScene. */
  goal: string;
  hints: string[];
  /** Placeholder until CircuitGraph solution data arrives (Milestone 4). */
  solutionSummary: string;
}

export const LEVELS: LevelDefinition[] = [
  {
    id: 1,
    title: 'Light the Bulb',
    subtitle: 'Build your first loop',
    difficulty: 'Easy',
    components: [
      { type: 'battery', count: 1 },
      { type: 'bulb', count: 1 }
    ],
    goal: 'Connect the battery to the bulb so current can loop back.',
    hints: [
      'A circuit must be a closed loop.',
      'Battery + goes out, current returns to Battery −.',
      'Every terminal needs exactly one wire.'
    ],
    solutionSummary: 'Battery(+) → Bulb → Battery(−)'
  },
  {
    id: 2,
    title: 'Flip the Switch',
    subtitle: 'Control the current',
    difficulty: 'Easy',
    components: [
      { type: 'battery', count: 1 },
      { type: 'switch', count: 1 },
      { type: 'bulb', count: 1 }
    ],
    goal: 'Add a switch so you can break and complete the loop.',
    hints: [
      'Put the switch in series — current must pass through it.',
      'Battery(+) → Switch → Bulb → Battery(−).'
    ],
    solutionSummary: 'Battery(+) → Switch → Bulb → Battery(−)'
  },
  {
    id: 3,
    title: 'Series Resistor',
    subtitle: 'Tame the current',
    difficulty: 'Easy',
    components: [
      { type: 'battery', count: 1 },
      { type: 'switch', count: 1 },
      { type: 'resistor', count: 1 },
      { type: 'bulb', count: 1 }
    ],
    goal: 'Wire battery → switch → resistor → bulb in one chain.',
    hints: [
      'Series means one path: every component in a single chain.',
      'Watch the polarity on the battery terminals.'
    ],
    solutionSummary: 'Battery(+) → Switch → Resistor → Bulb → Battery(−)'
  },
  {
    id: 4,
    title: 'Parallel Path',
    subtitle: 'Two bulbs, one battery',
    difficulty: 'Medium',
    components: [
      { type: 'battery', count: 1 },
      { type: 'switch', count: 1 },
      { type: 'bulb', count: 2 }
    ],
    goal: 'Give each bulb its own branch from the same battery.',
    hints: [
      'Parallel means two loops sharing the battery.',
      'Both branches must return to Battery(−).'
    ],
    solutionSummary: 'Battery(+) splits to Bulb A and Bulb B, both return to Battery(−)'
  },
  {
    id: 5,
    title: 'Double Switch',
    subtitle: 'Two gates, one lamp',
    difficulty: 'Medium',
    components: [
      { type: 'battery', count: 1 },
      { type: 'switch', count: 2 },
      { type: 'bulb', count: 1 }
    ],
    goal: 'Wire two switches in series with the bulb.',
    hints: [
      'Current must pass Switch A AND Switch B.',
      'One open switch breaks the whole loop.'
    ],
    solutionSummary: 'Battery(+) → Switch A → Switch B → Bulb → Battery(−)'
  }
];

export function getLevelDefinition(id: number): LevelDefinition | undefined {
  return LEVELS.find((l) => l.id === id);
}
