declare global {
  interface Date {
    addDays(days: number): Date;
    formatYYMMDD(): string;
    isValid(): boolean;
    daysDifference(from: Date): number;
  }
}

Date.prototype.addDays = function (days: number): Date {
  var result = new Date(this);
  result.setDate(result.getDate() + days);
  return result;
};

Date.prototype.formatYYMMDD = function (): string {
  const d = new Date(this);
  var month = "" + (d.getMonth() + 1);
  var day = "" + d.getDate();
  var year = d.getFullYear();

  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;

  return [year, month, day].join("-");
};

Date.prototype.isValid = function () {
  const date = new Date(this);
  return date instanceof Date && !isNaN(date.valueOf());
};

Date.prototype.daysDifference = function (from: Date): number {
  const date = new Date(this);
  const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  // @ts-ignore
  return Math.round(Math.abs((date - from) / oneDay));
};

export {};
