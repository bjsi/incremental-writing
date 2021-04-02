import { MarkdownTable, MarkdownTableRow } from "./markdown"
import { DateUtils } from "./helpers/date-utils"

export abstract class Scheduler {
    // defaultPriorityMin: number
    // defaultPriorityMax: number
    name: string
    constructor(name: string){
        this.name = name;
    }

    abstract schedule(table: MarkdownTable, row: MarkdownTableRow): void
}

export class SimpleScheduler extends Scheduler {

    constructor() {
        super("simple");
    }

    roundOff(num: number, places: number) {
        const x = Math.pow(10,places);
        return Math.round(num * x) / x;
    }

    schedule(table: MarkdownTable, row: MarkdownTableRow) {
        table.addRow(row);
        // spread rows between 0 and 100 priority
        let step = 99.9 / table.rows.length;
        let curPri = step;
        for (let row of table.rows) {
            row.priority = this.roundOff(curPri, 2);
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

    afactor: number
    interval: number

    // TODO:
    constructor(afactor: number = 2, interval: number = 1) {
        super("afactor");
        this.afactor = this.isValidAFactor(afactor) ? afactor : 2;
        this.interval = this.isValidInterval(interval) ? interval : 1;
    }

    schedule(table: MarkdownTable, row: MarkdownTableRow) {
        row.nextRepDate = DateUtils.addDays(new Date(Date.now()), row.interval);
        row.interval = this.afactor * row.interval;
        table.addRow(row);
    }

    isValidAFactor(afactor: number) {
        return (!isNaN(afactor) && afactor >= 0);
    }

    isValidInterval(interval: number) {
        return (!isNaN(interval) && interval >= 0);
    }

    toString() {
        return `---
scheduler: "${this.name}"
afactor: ${this.afactor}
interval: ${this.interval}
---`;
    }
}
