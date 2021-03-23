import { LogTo } from "./logger"

export class MarkdownTableUtils {

    static parseRows(arr: string[]): MarkdownTableRow[] {
        return arr.map((v, i, a) => this.parseRow(v))
    }

    static parseRow(text: string): MarkdownTableRow {
        let arr = text.substr(1, text.length - 1).split("|").map(r => r.trim())
        LogTo.Debug(arr.toString());
        return new MarkdownTableRow(arr[0], arr[1], arr[2]);
    }
}

export class MarkdownTable {
    
    header: MarkdownTableRow[] = [];
    rows: MarkdownTableRow[] = [];

    constructor(text?: string) {
        if (text) {
            text = text.trim();
            let split = text.split("\n");
            this.header = MarkdownTableUtils.parseRows(split.slice(0, 2));
            this.rows = MarkdownTableUtils.parseRows(split.slice(2));
        }
    }

    addRow(row: MarkdownTableRow) {
        this.rows.push(row);
    }

    sort(compareFn: (a: MarkdownTableRow, b: MarkdownTableRow) => number){
        if (this.rows)
            this.rows = this.rows.sort(compareFn);
    }

    sortByPriority(){
        this.rows.sort((a, b) => {
            let fst = +(a.priority);
            let snd = +(b.priority);
            if (fst > snd)
                return 1;
            else if (fst == snd)
                return 0;
            else if (fst < snd)
                return -1;
        });

        return this;
    }

    toString() {
        let table = this.header.join("\n");
        if (this.rows) {
            table += "\n" + this.rows.join("\n");
        }
        return table.trim();
    }
}

export class MarkdownTableRow {

    link: string
    priority: string
    notes: string

    afactor: string
    interval: string
    nextRepDate: string

    constructor(link: string, priority: string, notes: string){
        this.link = link;
        this.priority = priority;
        this.notes = notes;
    }

    toString() {
        let text = `| ${this.link} | ${this.priority} | ${this.notes} |`; // ` ${this.afactor} | ${this.interval} | ${this.nextRepDate} |`
        if (text.contains("undefined"))
            throw new Error("table contains undefined");

        return text;
    }
}
