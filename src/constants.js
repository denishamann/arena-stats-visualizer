export const SEASON_ONE_START = 1623628800; // Date and time (GMT): Monday 14 June 2021 00:00:01 (actually started on June 15/16th)
export const SEASON_ONE_END = 1631231999; // Date and time (GMT): Thursday 9 September 2021 23:59:59 (actually ended on September 7th)
export const SEASON_TWO_START = 1631404801; // Date and time (GMT): Sunday 12 September 2021 00:00:01 (actually started on September 14th)
export const SEASON_TWO_END = 1642031999; // Date and time (GMT): Wednesday 12 January 2022 23:59:59 (actually ended on January 10/11th)
export const SEASON_THREE_START = 1642204800; // Date and time (GMT): Saturday 15 January 2022 00:00:00 (actually started on January 17th)
export const SEASON_THREE_END = 1651795199; // Date and time (GMT): Thursday 5 May 2022 23:59:59 (actually ended on May 3rd)
export const SEASON_FOUR_START = 1652054401; // Date and time (GMT): Monday 9 May 2022 00:00:01 (actually started on May 10/11th)

export const timestampsOk = () =>
  SEASON_ONE_START <
  SEASON_ONE_END <
  SEASON_TWO_START <
  SEASON_TWO_END <
  SEASON_THREE_START <
  SEASON_THREE_END <
  SEASON_FOUR_START;

export const ALL_CLASSES = [
  'WARRIOR',
  'HUNTER',
  'ROGUE',
  'MAGE',
  'WARLOCK',
  'PALADIN',
  'SHAMAN',
  'DRUID',
  'PRIEST',
];

export const ARENA_MAPS_BY_ID = {
  3698: 'Nagrand Arena',
  3702: "Blade's Edge Arena",
  3968: 'Ruins of Lordaeron',
};

export const DEFAULT_SEASONS = ['s1', 's2', 's3', 's4'];
export const DEFAULT_BRACKETS = ['2s'];
