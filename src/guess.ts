import { WORDLE_GUESS_LIST, LETTERS, UNKNOWN_LETTER } from './constants';
import { getKnownLetters } from './utils';

type Results = {
  g: string;
  y: string[];
  b: string;
};

export const guess = (wordList: string[], results: Results) => {
  // Filter words that don't abide by hints from wordList
  const regex = constructRegex(results);
  wordList = wordList.filter((w) => regex.test(w));

  // Get non-zero letter frequencies
  const letterFreqByWord: { [l: string]: number } = {};
  wordList.forEach((w) =>
    w
      .split('')
      .filter((l, i) => w.indexOf(l) === i)
      .forEach((l) => {
        if (!(l in letterFreqByWord)) letterFreqByWord[l] = 0;
        return letterFreqByWord[l]++;
      }),
  );
  for (let [k, v] of Object.entries(letterFreqByWord)) {
    letterFreqByWord[k] = v / wordList.length;
  }
  console.log(letterFreqByWord);

  // Get non-zero letter frequencies by position
  const letterFreqByPosition: { [l: string]: number[] } = {};
  wordList.forEach((w) =>
    w.split('').forEach((l, i) => {
      if (!(l in letterFreqByPosition)) letterFreqByPosition[l] = [0, 0, 0, 0, 0];
      letterFreqByPosition[l][i]++;
    }),
  );
  const totalFrequenciesByPosition = Object.values(letterFreqByPosition).reduce(
    (prev, curr) => prev.map((f, i) => f + curr[i]),
    [0, 0, 0, 0, 0],
  );
  for (let [k, v] of Object.entries(letterFreqByPosition)) {
    letterFreqByPosition[k] = v.map((f, i) => f / totalFrequenciesByPosition[i]);
    // const total = letterFreqByPosition[k].reduce((prev, curr) => prev + curr, 0);
    // letterFreqByPosition[k] = letterFreqByPosition[k].map((f) => f / total);
  }
  console.log(letterFreqByPosition);

  // Compute guess scores and sort
  const guessScores: { [l: string]: number } = {};
  WORDLE_GUESS_LIST.forEach((g) => {
    guessScores[g] = g.split('').reduce((prev, l, i) => {
      // Use letter frequency multiplied by the probability it is in that position as base score
      const baseScore =
        (letterFreqByWord[l] || 0) * (0 + (letterFreqByPosition[l] || [0, 0, 0, 0, 0])[i]);

      // Arbitrarily halving letter score if it is a repeat
      return prev + (g.indexOf(l) === i ? baseScore : baseScore / 2);
    }, 0);
  });
  const scores = Object.entries(guessScores).sort((a, b) => b[1] - a[1]);
  console.log(scores.slice(0, 20));

  // Sort closest to .5?

  // Return guess and remaining words/letters
  const guess = scores[0][0];
  return { guess, wordList };
};

export const constructRegex = (r: Results): RegExp => {
  const p: string[][] = [[], [], [], [], []];
  const prevY = r.y[r.y.length - 1].replace(new RegExp(`\\${UNKNOWN_LETTER}`, 'g'), '').split('');

  for (let i = 0; i < 5; i++) {
    // Green letters
    if (r.g[i] && r.g[i] !== UNKNOWN_LETTER) {
      p[i].push(r.g[i]);
      continue;
    }

    // All letters but black letters and yellow letters in this position
    const yellows = getKnownLetters(r.y.map((g) => g[i]).join(''));
    p[i].push(`[${LETTERS.filter((l) => !r.b.includes(l) && !yellows.includes(l)).join('')}]`);

    // Yellow letters from other positions in the last guess
    p[i].push(...prevY.filter((l) => !yellows.includes(l)).map((l) => `[${l}]`));
  }

  console.log(p);

  let possibilities = p[0]
    .flatMap((l) => p[1].map((l2) => l + l2))
    .flatMap((l) => p[2].map((l2) => l + l2))
    .flatMap((l) => p[3].map((l2) => l + l2))
    .flatMap((l) => p[4].map((l2) => l + l2));

  // Ensure regexes contain yellow tiles
  possibilities = possibilities.filter((p) => {
    return (
      prevY.every((l) => {
        const oldP = p;
        const newP = (p = p.replace(new RegExp(`\\[${l}\\]`), ''));
        return oldP.length !== newP.length;
      }) && !/\[[a-z]\]/g.test(p)
    );
  });

  let regex: string;
  if (possibilities.length === 0) {
    if (
      getKnownLetters(r.g).length === 0 &&
      r.y.map((g) => getKnownLetters(g)).every((g) => g.length === 0) &&
      r.b.length === 0
    ) {
      // Match any word for first guess
      regex = '[a-z]{5}';
    } else {
      // No possibilities but not first guess results in a thrown error
      throw 'No possibilities left';
    }
  } else {
    // Match words that matches any of the regexes
    regex = possibilities.join('|');
  }

  return new RegExp(`^${regex}$`, 'g');
};
