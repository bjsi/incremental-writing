import IW from "../main";
import { LogTo } from "../logger";
import { SliderComponent, TextComponent, ButtonComponent } from "obsidian";
import { ModalBase } from "./modal-base";
import { MarkdownTableRow, MarkdownTable } from "../markdown";
import "../helpers/date-utils";

export class NextRepScheduler extends ModalBase {
  private priorityComponent: SliderComponent;
  private repDateComponent: TextComponent;
  private curRep: MarkdownTableRow;
  private table: MarkdownTable;

  constructor(plugin: IW, curRep: MarkdownTableRow, table: MarkdownTable) {
    super(plugin);
    this.curRep = curRep;
    this.table = table;
  }

  onOpen() {
    this.subscribeToEvents();
    let { contentEl } = this;

    contentEl.createEl("h2", { text: "Set Next Repetition Data" });

    //
    // Date

    contentEl.appendText("Next repetition date: ");
    this.repDateComponent = new TextComponent(contentEl).setValue(
      this.curRep.nextRepDate.formatYYMMDD()
    );
    contentEl.createEl("br");

    this.repDateComponent.inputEl.focus();
    this.repDateComponent.inputEl.select();

    //
    // Priority

    contentEl.appendText("Priority: ");
    this.priorityComponent = new SliderComponent(contentEl)
      .setLimits(0, 100, 1)
      .setValue(this.curRep.priority)
      .setDynamicTooltip();
    contentEl.createEl("br");

    //
    // Button

    new ButtonComponent(contentEl)
      .setButtonText("Schedule")
      .onClick(async () => {
        await this.schedule();
        this.close();
      });
  }

  intervalIsValid(ivl: number) {
    return !isNaN(ivl) && ivl >= 1;
  }

  subscribeToEvents() {
    this.contentEl.addEventListener("keydown", async (ev) => {
      if (ev.key === "PageUp") {
        let curValue = this.priorityComponent.getValue();
        if (curValue < 95) this.priorityComponent.setValue(curValue + 5);
        else this.priorityComponent.setValue(100);
      } else if (ev.key === "PageDown") {
        let curValue = this.priorityComponent.getValue();
        if (curValue > 5) this.priorityComponent.setValue(curValue - 5);
        else this.priorityComponent.setValue(0);
      } else if (ev.key === "Enter") {
        await this.schedule();
        this.close();
      }
    });
  }

  async schedule() {
    const nextRepDate = this.parseDate(this.repDateComponent.getValue());
    if (!nextRepDate) {
      LogTo.Console("Failed to parse next repetition date!", true);
      return;
    }

    const priority = this.priorityComponent.getValue();
    const today = new Date();
    const interval =
      nextRepDate > today ? nextRepDate.daysDifference(today) : 1;
    this.curRep.nextRepDate = nextRepDate;
    this.curRep.priority = priority;
    this.curRep.interval = interval;
    await this.plugin.queue.writeQueueTable(this.table);
  }
}
