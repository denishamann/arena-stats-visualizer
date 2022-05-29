import {
  ALL_CLASSES,
  SEASON_FOUR_START,
  SEASON_ONE_END,
  SEASON_ONE_START,
  SEASON_THREE_END,
  SEASON_THREE_START,
  SEASON_TWO_END,
  SEASON_TWO_START,
} from './constants';
import { enemy } from './util';

// noinspection JSUnusedGlobalSymbols
export class Row {
  constructor(row) {
    this.isRanked = row[0];
    this.startTime = row[1] !== '' ? Number(row[1]) : undefined;
    this.endTime =  row[2] !== '' ? Number(row[2]) : undefined;
    this.zoneId = row[3];
    this.duration =  row[4] !== '' ? Number(row[4]) : undefined;
    this.teamName = row[5];
    this.teamColor = row[6];
    this.winnerColor = row[7];
    this.teamPlayerName1 = row[8];
    this.teamPlayerName2 = row[9];
    this.teamPlayerName3 = row[10];
    this.teamPlayerName4 = row[11];
    this.teamPlayerName5 = row[12];
    this.teamPlayerClass1 = row[13];
    this.teamPlayerClass2 = row[14];
    this.teamPlayerClass3 = row[15];
    this.teamPlayerClass4 = row[16];
    this.teamPlayerClass5 = row[17];
    this.teamPlayerRace1 = row[18];
    this.teamPlayerRace2 = row[19];
    this.teamPlayerRace3 = row[20];
    this.teamPlayerRace4 = row[21];
    this.teamPlayerRace5 = row[22];
    this.oldTeamRating =  row[23] !== '' ? Number(row[23]) : undefined;
    this.newTeamRating =  row[24] !== '' ? Number(row[24]) : undefined;
    this.diffRating =  row[25] !== '' ? Number(row[25]) : undefined;
    this.mmr =  row[26] !== '' ? Number(row[26]) : undefined;
    this.enemyOldTeamRating =  row[27] !== '' ? Number(row[27]) : undefined;
    this.enemyNewTeamRating =  row[28] !== '' ? Number(row[28]) : undefined;
    this.enemyDiffRating =  row[29] !== '' ? Number(row[29]) : undefined;
    this.enemyMmr =  row[30] !== '' ? Number(row[30]) : undefined;
    this.enemyTeamName = row[31];
    this.enemyPlayerName1 = row[32];
    this.enemyPlayerName2 = row[33];
    this.enemyPlayerName3 = row[34];
    this.enemyPlayerName4 = row[35];
    this.enemyPlayerName5 = row[36];
    this.enemyPlayerClass1 = row[37];
    this.enemyPlayerClass2 = row[38];
    this.enemyPlayerClass3 = row[39];
    this.enemyPlayerClass4 = row[40];
    this.enemyPlayerClass5 = row[41];
    this.enemyPlayerRace1 = row[42];
    this.enemyPlayerRace2 = row[43];
    this.enemyPlayerRace3 = row[44];
    this.enemyPlayerRace4 = row[45];
    this.enemyPlayerRace5 = row[46];
    this.enemyFaction = row[47];
  }

  // Returns an string containing uppercase classes joined by a '+', or an empty string if the composition is invalid!
  getComposition = brackets => {
    // We could have added all 5 classes and then filter out falsy values, but it would not be resilient to "ghost player" bugs. isValidNComp addresses that problem. Ghost player entries are therefore ignored.
    const enemyPlayerClasses = [];
    if (this.isValid5sComp() && brackets.includes('5s')) {
      enemyPlayerClasses.push(
        this.enemyPlayerClass1,
        this.enemyPlayerClass2,
        this.enemyPlayerClass3,
        this.enemyPlayerClass4,
        this.enemyPlayerClass5
      );
    } else if (this.isValid3sComp() && brackets.includes('3s')) {
      enemyPlayerClasses.push(
        this.enemyPlayerClass1,
        this.enemyPlayerClass2,
        this.enemyPlayerClass3
      );
    } else if (this.isValid2sComp() && brackets.includes('2s')) {
      enemyPlayerClasses.push(this.enemyPlayerClass1, this.enemyPlayerClass2);
    }
    return enemyPlayerClasses
      .sort((a, b) => ALL_CLASSES.indexOf(a) - ALL_CLASSES.indexOf(b))
      .join('+');
  };

  won = () =>
    (this.teamColor &&
      this.winnerColor &&
      this.teamColor === this.winnerColor) ||
    this.diffRating > 0 ||
    this.enemyDiffRating < 0;

  isTitleOrSkirmish = () =>
    this.isRanked === 'isRanked' ||
    this.enemyFaction === 'enemyFaction' ||
    this.isRanked === 'NO';

  // check a few basic fields and filter out completely corrupted data
  isRowClean = () =>
    this.teamPlayerName1 &&
    this.teamPlayerClass1 &&
    this.teamPlayerName2 &&
    this.teamPlayerClass2 &&
    this.enemyPlayerClass1 &&
    this.enemyFaction &&
    ((this.teamColor && this.winnerColor) || !isNaN(this.diffRating)) &&
    this.isValidSeason();

  // isNsData checks own team data. If one of your teammates is missing (e.g. didn't enter the arena), the match won't be considered at all for anything
  // isValidNsComp checks enemy data. If an enemy is missing (e.g. didn't enter the arena), or if there is a ghost player (addon bug), the match will be included in win rates and badges system, but not in the compositions table

  is2sData = () =>
    !this.teamPlayerName3 &&
    !this.teamPlayerClass3 &&
    !this.teamPlayerName4 &&
    !this.teamPlayerClass4 &&
    !this.teamPlayerName5 &&
    !this.teamPlayerClass5;

  isValid2sComp = () =>
    this.is2sData &&
    this.enemyPlayerClass1 &&
    this.enemyPlayerClass2 &&
    !this.enemyPlayerClass3 &&
    !this.enemyPlayerClass4 &&
    !this.enemyPlayerClass5;

  is3sData = () =>
    this.teamPlayerName3 &&
    this.teamPlayerClass3 &&
    !this.teamPlayerName4 &&
    !this.teamPlayerClass4 &&
    !this.teamPlayerName5 &&
    !this.teamPlayerClass5;

  isValid3sComp = () =>
    this.is3sData &&
    this.enemyPlayerClass1 &&
    this.enemyPlayerClass2 &&
    this.enemyPlayerClass3 &&
    !this.enemyPlayerClass4 &&
    !this.enemyPlayerClass5;

  is5sData = () =>
    this.teamPlayerName3 &&
    this.teamPlayerClass3 &&
    this.teamPlayerName4 &&
    this.teamPlayerClass4 &&
    this.teamPlayerName5 &&
    this.teamPlayerClass5;

  isValid5sComp = () =>
    this.is5sData &&
    this.enemyPlayerClass1 &&
    this.enemyPlayerClass2 &&
    this.enemyPlayerClass3 &&
    this.enemyPlayerClass4 &&
    this.enemyPlayerClass5;

  isSeasonOne() {
    return this.startTime > SEASON_ONE_START && this.startTime < SEASON_ONE_END;
  }

  isSeasonTwo() {
    return this.startTime > SEASON_TWO_START && this.startTime < SEASON_TWO_END;
  }

  isSeasonThree() {
    return (
      this.startTime > SEASON_THREE_START && this.startTime < SEASON_THREE_END
    );
  }

  isSeasonFour() {
    return this.startTime > SEASON_FOUR_START;
  }

  isValidSeason() {
    return (
      this.isSeasonOne() ||
      this.isSeasonTwo() ||
      this.isSeasonThree() ||
      this.isSeasonFour()
    );
  }

  matchSummary = () => {
    const outcome = this.won() ? 'Victory' : 'Defeat';
    const mmr = this.mmr ? ` at ${this.mmr} MMR` : '';
    const enemies = this.enemies();
    return `${outcome} as ${this.allies()} vs ${enemies}${mmr}`;
    // could also have shown isRanked/diffRating, day (endTime), zoneId...
  };

  allies = () => {
    const allies = [
      this.teamPlayerName1,
      this.teamPlayerName2,
      this.teamPlayerName3,
      this.teamPlayerName4,
      this.teamPlayerName5,
    ];

    return allies.filter(a => !!a).join('/');
  };

  enemies = () => {
    const enemies = [
      enemy(this.enemyPlayerName1, this.enemyPlayerClass1),
      enemy(this.enemyPlayerName2, this.enemyPlayerClass2),
      enemy(this.enemyPlayerName3, this.enemyPlayerClass3),
      enemy(this.enemyPlayerName4, this.enemyPlayerClass4),
      enemy(this.enemyPlayerName5, this.enemyPlayerClass5),
    ];

    return enemies.filter(e => !!e).join(' and ');
  };
}
