import { DateUtils } from "./helpers/date-utils";
import { LinkEx } from "./helpers/link-utils";
import { PriorityUtils } from "./helpers/priority-utils";
import { Scheduler, SimpleScheduler, AFactorScheduler } from "./scheduler";
import IW from "./main";
import { GrayMatterFile } from "gray-matter";
import { LogTo } from "./logger";
import { getLinkpath } from "obsidian";

export class MarkdownTable {
  plugin: IW;
  scheduler: Scheduler;
  private header = `| Link | Priority | Notes | Interval | Next Rep |
|------|----------|-------|---------|----------|`;
  rows: MarkdownTableRow[] = [];
  removedDeleted: boolean = false;

  // TODO: just pass the gray matter object, replace text with contents.
  constructor(plugin: IW, frontMatter?: GrayMatterFile<string>, text?: string) {
    this.plugin = plugin;
    this.scheduler = this.createScheduler(frontMatter);
    if (text) {
      text = text.trim();
      let split = text.split("\n");
      let idx = this.findYamlEnd(split);
      if (idx !== -1)
        // line after yaml + header
        this.rows = this.parseRows(split.slice(idx + 1 + 2));
    }
  }

  // TODO: test with blocks, different link settings
  removeDeleted() {
    let queuePath = this.plugin.queue.queuePath;
    let exists = this.rows.filter((r) =>
      this.plugin.links.exists(r.link, queuePath)
    );
    let removedNum = this.rows.length - exists.length;
    this.rows = exists;
    if (removedNum > 0) {
      this.removedDeleted = true;
      LogTo.Console(`Removed ${removedNum} reps with non-existent links.`);
    }
  }

  hasRowWithLink(link: string) {
    link = LinkEx.removeBrackets(link);
    return this.rows.some((r) => r.link === link);
  }

  schedule(rep: MarkdownTableRow) {
    this.scheduler.schedule(this, rep);
  }

  findYamlEnd(split: string[]) {
    let ct = 0;
    let idx = split.findIndex((value) => {
      if (value === "---") {
        if (ct === 1) {
          return true;
        }
        ct += 1;
        return false;
      }
    });

    return idx;
  }

  private createScheduler(frontMatter: GrayMatterFile<string>): Scheduler {
    let scheduler: Scheduler;

    // Default
    if (this.plugin.settings.defaultQueueType === "afactor") {
      scheduler = new AFactorScheduler();
    } else if (this.plugin.settings.defaultQueueType === "simple") {
      scheduler = new SimpleScheduler();
    }

    // Specified in YAML
    if (frontMatter) {
      let schedulerName = frontMatter.data["scheduler"];
      if (schedulerName && schedulerName === "simple") {
        scheduler = new SimpleScheduler();
      } else if (schedulerName && schedulerName === "afactor") {
        let afactor = Number(frontMatter.data["afactor"]);
        let interval = Number(frontMatter.data["interval"]);
        scheduler = new AFactorScheduler(afactor, interval);
      }
    }
    return scheduler;
  }

  parseRows(arr: string[]): MarkdownTableRow[] {
    return arr.map((v) => this.parseRow(v));
  }

  parseRow(text: string): MarkdownTableRow {
    let arr = text
      .substr(1, text.length - 1)
      .split("|")
      .map((r) => r.trim());
    return new MarkdownTableRow(
      arr[0],
      Number(arr[1]),
      arr[2],
      Number(arr[3]),
      new Date(arr[4])
    );
  }

  hasReps() {
    return this.rows.length > 0;
  }

  currentRep() {
    this.sortReps();
    return this.rows[0];
  }

  nextRep() {
    this.sortReps();
    return this.rows[1];
  }

  removeCurrentRep() {
    this.sortReps();
    let removed;
    if (this.rows.length === 1) {
      removed = this.rows.pop();
    } else if (this.rows.length > 1) {
      removed = this.rows[0];
      this.rows = this.rows.slice(1);
    }
    return removed;
  }

  sortReps() {
    if (this.scheduler instanceof SimpleScheduler) {
      this.sortByPriority();
    } else if (this.scheduler instanceof AFactorScheduler) {
      this.sortByPriority();
      this.sortByDue();
    }
  }

  getReps() {
    return this.rows;
  }

  private sortByDue() {
    this.rows.sort((a, b) => {
      if (a.isDue() && !b.isDue()) return -1;
      if (a.isDue() && b.isDue()) return 0;
      if (!a.isDue() && b.isDue()) return 1;
    });
  }

  private sortByPriority() {
    this.rows.sort((a, b) => {
      let fst = +a.priority;
      let snd = +b.priority;
      if (fst > snd) return 1;
      else if (fst == snd) return 0;
      else if (fst < snd) return -1;
    });
  }

  addRow(row: MarkdownTableRow) {
    this.rows.push(row);
  }

  sort(compareFn: (a: MarkdownTableRow, b: MarkdownTableRow) => number) {
    if (this.rows) this.rows = this.rows.sort(compareFn);
  }

  toString() {
    let table = this.scheduler.toString() + "\n";
    table += this.header;
    if (this.rows) {
      table += "\n" + this.rows.join("\n");
    }
    return table.trim();
  }
}

export class MarkdownTableRow {
  link: string;
  priority: number;
  notes: string;
  interval: number;
  nextRepDate: Date;

  constructor(
    link: string,
    priority: number,
    notes: string,
    interval: number = 1,
    nextRepDate: Date = new Date("1970-01-01")
  ) {
    this.link = LinkEx.removeBrackets(link);
    this.priority = PriorityUtils.isValid(priority) ? priority : 30;
    this.notes = notes.replace(/(\r\n|\n|\r|\|)/gm, "");
    this.interval = interval > 0 ? interval : 1;
    this.nextRepDate = DateUtils.isValid(nextRepDate)
      ? nextRepDate
      : new Date("1970-01-01");
  }

  isDue(): boolean {
    if (new Date(Date.now()) >= this.nextRepDate) return true;
    return false;
  }

  toString() {
    let date = DateUtils.formatDate(this.nextRepDate);
    let link = LinkEx.addBrackets(this.link);
    return `| ${link} | ${this.priority} | ${this.notes} | ${this.interval} | ${date} |`;
  }
}
