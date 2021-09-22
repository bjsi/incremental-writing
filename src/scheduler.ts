import { MarkdownTable, MarkdownTableRow } from "./markdown";
import "./helpers/date-utils";
import "./helpers/number-utils";

export abstract class Scheduler {
  protected name: string;
  constructor(name: string) {
    this.name = name;
  }

  abstract schedule(table: MarkdownTable, row: MarkdownTableRow): void;
}

export class SimpleScheduler extends Scheduler {
  constructor() {
    super("simple");
  }

  schedule(table: MarkdownTable, row: MarkdownTableRow) {
    table.addRow(row);
    // spread rows between 0 and 100 priority
    let step = 99.9 / table.rows.length;
    let curPri = step;
    for (let row of table.rows) {
      row.priority = curPri.round(2);
      curPri += step;
    }
  }

  toString() {
    return `---
scheduler: "${this.name}"
---`;
  }
}

export class AFactorScheduler extends Scheduler {
  private afactor: number;
  private interval: number;

  constructor(afactor: number = 2, interval: number = 1) {
    super("afactor");
    this.afactor = afactor.isValidAFactor() ? afactor : 2;
    this.interval = interval.isValidInterval() ? interval : 1;
  }

  schedule(table: MarkdownTable, row: MarkdownTableRow) {
    row.nextRepDate = new Date().addDays(row.interval);
    row.interval = this.afactor * row.interval;
    table.addRow(row);
  }

  toString() {
    return `---
scheduler: "${this.name}"
afactor: ${this.afactor}
interval: ${this.interval}
---`;
  }
}
