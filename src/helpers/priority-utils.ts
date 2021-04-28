export class PriorityUtils {
  static isValid(p: number) {
    return !isNaN(p) && p >= 0 && p <= 100;
  }

  static getPriorityBetween(pMin: number, pMax: number) {
    return Math.random() * (pMax - pMin) + pMin;
  }
}
