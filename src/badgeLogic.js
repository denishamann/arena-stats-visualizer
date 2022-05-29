import { MyBadge } from './myBadge';
import maxBy from 'lodash/maxBy';
import minBy from 'lodash/minBy';
import { ALL_CLASSES, ARENA_MAPS_BY_ID } from './constants';
import { longestSequence, mean, median, secondsToHms } from './util';

export const computeBadges = data => {
  let myBadges = [];
  ALL_CLASSES.forEach(currentClass => {
    const currentClassMatches = data.filter(
      row =>
        row.enemyPlayerClass1 === currentClass ||
        row.enemyPlayerClass2 === currentClass ||
        row.enemyPlayerClass3 === currentClass ||
        row.enemyPlayerClass4 === currentClass ||
        row.enemyPlayerClass5 === currentClass
    );
    const currentClassWinRate =
      currentClassMatches.filter(row => row.won()).length /
      currentClassMatches.length;
    if (currentClassWinRate > 0.53) {
      myBadges.push(
        new MyBadge(
          `Good against ${currentClass.toLowerCase()}`,
          `Win rate is ${(currentClassWinRate * 100).toFixed(1)}%`,
          'success'
        )
      );
    }
    if (currentClassWinRate < 0.47) {
      myBadges.push(
        new MyBadge(
          `Bad against ${currentClass.toLowerCase()}`,
          `Win rate is ${(currentClassWinRate * 100).toFixed(1)}%`,
          'danger'
        )
      );
    }
  });
  const longestMatch = maxBy(data, row => row.duration);
  const shortestMatch = minBy(data, row => row.duration);
  if (longestMatch) {
    myBadges.push(
      new MyBadge(
        `Longest match duration ${secondsToHms(longestMatch.duration)}`,
        longestMatch.matchSummary(),
        'primary'
      )
    );
  }
  if (shortestMatch) {
    myBadges.push(
      new MyBadge(
        `Shortest match lasted ${secondsToHms(shortestMatch.duration)}`,
        shortestMatch.matchSummary(),
        'primary'
      )
    );
  }
  const meanDur = secondsToHms(mean(data.map(row => row.duration)));
  const medianDur = secondsToHms(median(data.map(row => row.duration)));
  if (meanDur || medianDur) {
    myBadges.push(
      new MyBadge('Match duration trends', '', 'primary', [
        `Mean match duration: ${meanDur}`,
        `Median match duration: ${medianDur}`,
      ])
    );
  }
  const longestWinningStreak = longestSequence(
    data.map(row => row.won()),
    true
  );
  if (longestWinningStreak) {
    myBadges.push(
      new MyBadge(
        `Longest winning streak`,
        `${longestWinningStreak} victories in a row!`,
        'success'
      )
    );
  }
  const longestLosingStreak = longestSequence(
    data.map(row => row.won()),
    false
  );
  if (longestLosingStreak) {
    myBadges.push(
      new MyBadge(
        `Longest losing streak`,
        `${longestLosingStreak} defeats in a row :(`,
        'danger'
      )
    );
  }

  const highestRatingMatch = maxBy(data, row => row.newTeamRating);
  const highestMmrMatch = maxBy(data, row => row.mmr);
  const highestRatingDefeatedMatch = maxBy(data, row => row.enemyNewTeamRating);
  const highestMmrDefeatedMatch = maxBy(data, row => row.enemyMmr);
  if (highestRatingMatch) {
    myBadges.push(
      new MyBadge(
        `You peaked at ${highestRatingMatch.newTeamRating} team rating`,
        `As ${highestRatingMatch.allies()}`,
        'success'
      )
    );
  }
  if (highestMmrMatch) {
    myBadges.push(
      new MyBadge(
        `You peaked at ${highestMmrMatch.mmr} MMR`,
        `As ${highestMmrMatch.allies()}`,
        'success'
      )
    );
  }
  if (highestRatingDefeatedMatch) {
    myBadges.push(
      new MyBadge(
        `You defeated an opponent with ${highestRatingDefeatedMatch.enemyNewTeamRating} team rating`,
        `As ${highestRatingDefeatedMatch.allies()} against ${highestRatingDefeatedMatch.enemies()}`,
        'success'
      )
    );
  }
  if (highestMmrDefeatedMatch) {
    myBadges.push(
      new MyBadge(
        `You defeated an opponent with ${highestMmrDefeatedMatch.enemyMmr} MMR`,
        `As ${highestMmrDefeatedMatch.allies()} against ${highestMmrDefeatedMatch.enemies()}`,
        'success'
      )
    );
  }
  const mapNamesWinRates = Object.keys(ARENA_MAPS_BY_ID).map(mapId => {
    const currentMapMatches = data.filter(row => row.zoneId === mapId);
    const currentMapWinRate =
      currentMapMatches.filter(row => row.won()).length /
      currentMapMatches.length;
    return [ARENA_MAPS_BY_ID[mapId], currentMapWinRate];
  });
  if (mapNamesWinRates.filter(it => !isNaN(it[1])).length !== 0) {
    myBadges.push(
      new MyBadge(
        `Map win rates`,
        '',
        'primary',
        mapNamesWinRates.filter(it => !isNaN(it[1])).map(it => `${it[0]}: ${(it[1] * 100).toFixed(1)}%`)
      )
    );
  }

  return myBadges;
};
