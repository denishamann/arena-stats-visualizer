export function secondsToHms(d) {
  d = Number(d);
  const h = Math.floor(d / 3600);
  const s = Math.floor((d % 3600) % 60);
  const m = Math.floor((d % 3600) / 60);

  const hDisplay = h > 0 ? h + (h === 1 ? ' hour, ' : ' hours, ') : '';
  const mDisplay = m > 0 ? m + (m === 1 ? ' min, ' : ' min, ') : '';
  const sDisplay = s > 0 ? s + (s === 1 ? ' sec' : ' sec') : '';
  return hDisplay + mDisplay + sDisplay;
}

export const mean = array => array.reduce((a, b) => a + b, 0) / array.length;
export const median = array =>
  array.slice().sort((a, b) => a - b)[Math.floor(array.length / 2)];
export const longestSequence = (array, value) => {
  let currentCount = 0;
  let maxCount = 0;
  for (let arrayValue of array) {
    if (arrayValue === value) currentCount++;
    if (arrayValue !== value) {
      maxCount = Math.max(maxCount, currentCount);
      currentCount = 0;
    }
  }
  return maxCount;
};

export const enemy = (enemyName, enemyClass) =>
  enemyClass
    ? enemyName
      ? `${enemyName} (${enemyClass})`
      : enemyClass
    : enemyName;
