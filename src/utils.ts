import { UNKNOWN_LETTER } from './constants';

export const getKnownLetters = (word: string) => {
  return word
    .split('')
    .filter((l) => l !== UNKNOWN_LETTER)
    .join('');
};
