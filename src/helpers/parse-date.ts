import { App } from "obsidian";
import { ObsidianUtilsBase } from "./obsidian-utils-base";

export class DateParser extends ObsidianUtilsBase {
  constructor(app: App) {
    super(app);
  }

  private parseDateAsDate(dateString: string): Date {
    return new Date(dateString);
  }

  private parseDateAsNatural(dateString: string): Date {
    const naturalLanguageDates = (<any>this.app).plugins.getPlugin(
      "nldates-obsidian"
    );

    if (!naturalLanguageDates) {
      return;
    }

    const nlDateResult = naturalLanguageDates.parseDate(dateString);
    if (nlDateResult && nlDateResult.date) return nlDateResult.date;
  }

  parseDate(dateString: string): Date {
    let d1 = this.parseDateAsDate(dateString);
    if (d1.isValid()) return d1;

    let d2 = this.parseDateAsNatural(dateString);
    if (d2.isValid()) return d2;

    return new Date("1970-01-01");
  }
}
