declare global {
  interface Number {
    isValidAFactor(): boolean;
    round(places: number): number;
    isValidInterval(): boolean;
    isValidPriority(): boolean;
  }
}

Number.prototype.round = function (places: number): number {
  const x = Math.pow(10, places);
  return Math.round(Number(this) * x) / x;
};

Number.prototype.isValidPriority = function (): boolean {
  const priority = Number(this);
  return !isNaN(priority) && priority >= 0 && priority <= 100;
};

Number.prototype.isValidAFactor = function (): boolean {
  const afactor = Number(this);
  return !isNaN(afactor) && afactor >= 0;
};

Number.prototype.isValidInterval = function (): boolean {
  const interval = Number(this);
  return !isNaN(interval) && interval >= 0;
};

export {};
