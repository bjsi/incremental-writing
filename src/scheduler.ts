import { MarkdownTable, MarkdownTableRow } from "./markdown"
import { DateUtils } from "./helpers/date-utils"
import { LogTo } from "./logger"

interface IScheduler {
    schedule(table: MarkdownTable, row: MarkdownTableRow): void
}

export class SimpleScheduler implements IScheduler {

    schedule(table: MarkdownTable, row: MarkdownTableRow) {
        table.addRow(row);
    }
}

export class AFactorScheduler implements IScheduler {

    schedule(table: MarkdownTable, row: MarkdownTableRow) {
        row.lastRepDate = DateUtils.formatDate(new Date(Date.now()));
        row.interval = (Number(row.afactor) * Number(row.interval)).toString();
        table.addRow(row);
    }
}
