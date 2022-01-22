import { LETTERS, WORDLE_GUESS_LIST, WORDLE_WORD_LIST } from './constants';
import { constructRegex, guess } from './guess';

const words = [...WORDLE_WORD_LIST];
const guesses = [...WORDLE_GUESS_LIST];
const letters = [...LETTERS];
const possiblyHardWords = ['jujus', 'error', 'proxy'];
console.log(guess(words, { g: '', y: ['?????'], b: '' }));
