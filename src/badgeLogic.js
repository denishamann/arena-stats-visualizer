import { MyBadge } from './myBadge';
import maxBy from 'lodash/maxBy';
import minBy from 'lodash/minBy';
import { ALL_CLASSES } from './constants';
import { enemy, longestSequence, mean, median, secondsToHms } from './util';

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
  console.log('Longest match', longestMatch);
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
      new MyBadge(
        'Match duration trends',
        `Mean match duration: ${meanDur}, Median match duration: ${medianDur}`,
        'primary'
      )
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
        `With ${highestRatingMatch.teamPlayerName1}/${highestRatingMatch.teamPlayerName2}`,
        'success'
      )
    );
  }
  if (highestMmrMatch) {
    myBadges.push(
      new MyBadge(
        `You peaked at ${highestMmrMatch.mmr} MMR`,
        `With ${highestMmrMatch.teamPlayerName1}/${highestMmrMatch.teamPlayerName2}`,
        'success'
      )
    );
  }
  if (highestRatingDefeatedMatch) {
    myBadges.push(
      new MyBadge(
        `You defeated an opponent with ${highestRatingDefeatedMatch.enemyNewTeamRating} team rating`,
        `With ${highestRatingDefeatedMatch.teamPlayerName1}/${
          highestRatingDefeatedMatch.teamPlayerName2
        } against ${enemy(
          highestRatingDefeatedMatch.enemyPlayerName1,
          highestRatingDefeatedMatch.enemyPlayerClass1
        )} and ${enemy(
          highestRatingDefeatedMatch.enemyPlayerName2,
          highestRatingDefeatedMatch.enemyPlayerClass2
        )}`,
        'success'
      )
    );
  }
  if (highestMmrDefeatedMatch) {
    myBadges.push(
      new MyBadge(
        `You defeated an opponent with ${highestMmrDefeatedMatch.enemyMmr} MMR`,
        `With ${highestMmrDefeatedMatch.teamPlayerName1}/${
          highestMmrDefeatedMatch.teamPlayerName2
        } against ${enemy(
          highestMmrDefeatedMatch.enemyPlayerName1,
          highestMmrDefeatedMatch.enemyPlayerClass1
        )} and ${enemy(
          highestMmrDefeatedMatch.enemyPlayerName2,
          highestMmrDefeatedMatch.enemyPlayerClass2
        )}`,
        'success'
      )
    );
  }

  return myBadges;
};
