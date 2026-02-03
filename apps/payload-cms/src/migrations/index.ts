import * as migration_20250929_111647 from './20250929_111647';
import * as migration_20260203_171915 from './20260203_171915';
import * as migration_20260203_181820 from './20260203_181820';

export const migrations = [
  {
    up: migration_20250929_111647.up,
    down: migration_20250929_111647.down,
    name: '20250929_111647',
  },
  {
    up: migration_20260203_171915.up,
    down: migration_20260203_171915.down,
    name: '20260203_171915',
  },
  {
    up: migration_20260203_181820.up,
    down: migration_20260203_181820.down,
    name: '20260203_181820'
  },
];
