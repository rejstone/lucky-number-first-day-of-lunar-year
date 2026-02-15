export type LotteryResults = {
  consolation: string[];
  third: string[];
  second: string[];
  first: string[];
  special: string[];
};

export const EMPTY_RESULTS: LotteryResults = {
  consolation: [],
  third: [],
  second: [],
  first: [],
  special: []
};
