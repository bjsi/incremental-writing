import { MarkdownTable, MarkdownTableRow } from "./markdown"

interface IScheduler {
    schedule(table: MarkdownTable, row: MarkdownTableRow): void
}

export class SimpleScheduler implements IScheduler {

    schedule(table: MarkdownTable, row: MarkdownTableRow) {
        table.rows.push(row);
    }

}
