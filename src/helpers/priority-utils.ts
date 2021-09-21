export class PriorityUtils {
  static getPriorityBetween(pMin: number, pMax: number) {
    return Math.random() * (pMax - pMin) + pMin;
  }
}
