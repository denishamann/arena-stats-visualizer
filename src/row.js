import {
  ALL_CLASSES,
  SEASON_EIGHT_END,
  SEASON_EIGHT_START,
  SEASON_FIVE_END,
  SEASON_FIVE_START,
  SEASON_FOUR_END,
  SEASON_FOUR_START,
  SEASON_NINE_START,
  SEASON_ONE_END,
  SEASON_ONE_START,
  SEASON_SEVEN_END,
  SEASON_SEVEN_START,
  SEASON_SIX_END,
  SEASON_SIX_START,
  SEASON_THREE_END,
  SEASON_THREE_START,
  SEASON_TWO_END,
  SEASON_TWO_START,
} from './constants';
import { enemy } from './util';

export class ClassAndSpec {
  constructor(playerClass, spec) {
    this.playerClass = playerClass;
    this.spec = spec;
  }
}
// noinspection JSUnusedGlobalSymbols
export class Row {
  constructor(row) {
    this.isRanked = row[0];
    this.startTime = row[1] !== '' ? Number(row[1]) : undefined;
    this.endTime = row[2] !== '' ? Number(row[2]) : undefined;
    this.zoneId = row[3];
    this.duration = row[4] !== '' ? Number(row[4]) : undefined;
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
    this.oldTeamRating = row[23] !== '' ? Number(row[23]) : undefined;
    this.newTeamRating = row[24] !== '' ? Number(row[24]) : undefined;
    this.diffRating = row[25] !== '' ? Number(row[25]) : undefined;
    this.mmr = row[26] !== '' ? Number(row[26]) : undefined;
    this.enemyOldTeamRating = row[27] !== '' ? Number(row[27]) : undefined;
    this.enemyNewTeamRating = row[28] !== '' ? Number(row[28]) : undefined;
    this.enemyDiffRating = row[29] !== '' ? Number(row[29]) : undefined;
    this.enemyMmr = row[30] !== '' ? Number(row[30]) : undefined;
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
    this.teamSpec1 = row[48];
    this.teamSpec2 = row[49];
    this.teamSpec3 = row[50];
    this.teamSpec4 = row[51];
    this.teamSpec5 = row[52];
    this.enemySpec1 = row[53];
    this.enemySpec2 = row[54];
    this.enemySpec3 = row[55];
    this.enemySpec4 = row[56];
    this.enemySpec5 = row[57];
  }

  // Returns an string containing uppercase classes joined by a '+', or an empty string if the composition is invalid!
  getComposition = (brackets, showSpecs) => {
    // We could have added all 5 classes and then filter out falsy values, but it would not be resilient to "ghost player" bugs. isValidNComp addresses that problem. Ghost player entries are therefore ignored.
    const enemyPlayerClasses = [];
    if (this.isValid5sComp() && brackets.includes('5s')) {
      enemyPlayerClasses.push(
        this.enemyPlayerClass1 + (showSpecs ? '%' + this.enemySpec1 : ''),
        this.enemyPlayerClass2 + (showSpecs ? '%' + this.enemySpec2 : ''),
        this.enemyPlayerClass3 + (showSpecs ? '%' + this.enemySpec3 : ''),
        this.enemyPlayerClass4 + (showSpecs ? '%' + this.enemySpec4 : ''),
        this.enemyPlayerClass5 + (showSpecs ? '%' + this.enemySpec5 : '')
      );
    } else if (this.isValid3sComp() && brackets.includes('3s')) {
      enemyPlayerClasses.push(
        this.enemyPlayerClass1 + (showSpecs ? '%' + this.enemySpec1 : ''),
        this.enemyPlayerClass2 + (showSpecs ? '%' + this.enemySpec2 : ''),
        this.enemyPlayerClass3 + (showSpecs ? '%' + this.enemySpec3 : '')
      );
    } else if (this.isValid2sComp() && brackets.includes('2s')) {
      enemyPlayerClasses.push(
        this.enemyPlayerClass1 + (showSpecs ? '%' + this.enemySpec1 : ''),
        this.enemyPlayerClass2 + (showSpecs ? '%' + this.enemySpec2 : '')
      );
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
    this.duration &&
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
    return (
      this.startTime > SEASON_FOUR_START && this.startTime < SEASON_FOUR_END
    );
  }

  isSeasonFive() {
    return (
      this.startTime > SEASON_FIVE_START && this.startTime < SEASON_FIVE_END
    );
  }

  isSeasonSix() {
    return this.startTime > SEASON_SIX_START && this.startTime < SEASON_SIX_END;
  }

  isSeasonSeven() {
    return (
      this.startTime > SEASON_SEVEN_START && this.startTime < SEASON_SEVEN_END
    );
  }

  isSeasonEight() {
    return (
      this.startTime > SEASON_EIGHT_START && this.startTime < SEASON_EIGHT_END
    );
  }

  isSeasonNineOrLater() {
    return this.startTime > SEASON_NINE_START;
  }

  isValidSeason() {
    return (
      this.isSeasonOne() ||
      this.isSeasonTwo() ||
      this.isSeasonThree() ||
      this.isSeasonFour() ||
      this.isSeasonFive() ||
      this.isSeasonSix() ||
      this.isSeasonSeven() ||
      this.isSeasonEight() ||
      this.isSeasonNineOrLater()
    );
  }

  matchSummary = () => {
    const outcome = this.won() ? 'Victory' : 'Defeat';
    const mmr = this.mmr ? ` at ${this.mmr} MMR` : '';
    const enemies = this.enemies();
    return `${outcome} as ${this.allies()} vs ${enemies}${mmr}`;
    // could also have shown isRanked/diffRating, day (endTime), zoneId...
  };

  allyClasses = () => {
    const allies = [
      this.teamPlayerClass1,
      this.teamPlayerClass2,
      this.teamPlayerClass3,
      this.teamPlayerClass4,
      this.teamPlayerClass5,
    ];

    return allies.filter(a => !!a);
  };

  teamComp = () => {
    const allies = [
      new ClassAndSpec(this.teamPlayerClass1, this.teamSpec1),
      new ClassAndSpec(this.teamPlayerClass2, this.teamSpec2),
      new ClassAndSpec(this.teamPlayerClass3, this.teamSpec3),
      new ClassAndSpec(this.teamPlayerClass4, this.teamSpec4),
      new ClassAndSpec(this.teamPlayerClass5, this.teamSpec5),
    ];

    return allies.filter(a => !!a.playerClass);
  };

  allies = () => {
    const allies = [
      new ClassAndSpec(this.teamPlayerName1, this.teamSpec1),
      new ClassAndSpec(this.teamPlayerName2, this.teamSpec2),
      new ClassAndSpec(this.teamPlayerName3, this.teamSpec3),
      new ClassAndSpec(this.teamPlayerName4, this.teamSpec4),
      new ClassAndSpec(this.teamPlayerName5, this.teamSpec5),
    ];

    return allies
      .filter(a => !!a.playerClass)
      .map(a => a.playerClass)
      .join('/');
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
