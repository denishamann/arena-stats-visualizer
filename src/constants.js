export const SEASON_ONE_START = 1623628800; // Date and time (GMT): Monday 14 June 2021 00:00:01 (actually started on June 15/16th)
export const SEASON_ONE_END = 1631231999; // Date and time (GMT): Thursday 9 September 2021 23:59:59 (actually ended on September 7th)
export const SEASON_TWO_START = 1631404801; // Date and time (GMT): Sunday 12 September 2021 00:00:01 (actually started on September 14th)
export const SEASON_TWO_END = 1642031999; // Date and time (GMT): Wednesday 12 January 2022 23:59:59 (actually ended on January 10/11th)
export const SEASON_THREE_START = 1642204800; // Date and time (GMT): Saturday 15 January 2022 00:00:00 (actually started on January 17th)
export const SEASON_THREE_END = 1651795199; // Date and time (GMT): Thursday 5 May 2022 23:59:59 (actually ended on May 3rd)
export const SEASON_FOUR_START = 1652054401; // Date and time (GMT): Monday 9 May 2022 00:00:01 (actually started on May 10/11th)
export const SEASON_FOUR_END = 1661903999; // Date and time (GMT): Tuesday 30 August 2022 23:59:59 (actually ended on August 29th)
export const SEASON_FIVE_START = 1664755200; // Date and time (GMT): Monday 3 October 2022 00:00:00 (actually started on October 4/5th)
export const SEASON_FIVE_END = 1673305199;  // Date and time (GMT): Monday 9 January 2023 23:59:59
export const SEASON_SIX_START = 1673910000; // Date and time (GMT): Tuesday 17 January 2023 00:00:00

export const timestampsOk = () =>
  SEASON_ONE_START <
  SEASON_ONE_END <
  SEASON_TWO_START <
  SEASON_TWO_END <
  SEASON_THREE_START <
  SEASON_THREE_END <
  SEASON_FOUR_START <
  SEASON_FOUR_END <
  SEASON_FIVE_START;

export const ALL_CLASSES = [
  'WARRIOR',
  'DEATHKNIGHT',
  'HUNTER',
  'ROGUE',
  'MAGE',
  'WARLOCK',
  'PALADIN',
  'SHAMAN',
  'DRUID',
  'PRIEST',
];

export const ARENA_MAP_IDS_BY_NAME = {
  'Nagrand Arena': ['3698', '559'],
  "Blade's Edge Arena": ['3702', '562'],
  'Ruins of Lordaeron': ['3968', '572'],
  'Dalaran Sewers': ['4378', '617'],
  'The Ring of Valor': ['4406', '618'],
};

export const DEFAULT_SEASONS = ['s1', 's2', 's3', 's4', 's5', 's6'];
export const DEFAULT_BRACKETS = ['2s'];
