import IW from "../main";
import { LogTo } from "../logger";
import { SliderComponent, TextComponent, ButtonComponent } from "obsidian";
import { ModalBase } from "./modal-base";
import { MarkdownTableRow, MarkdownTable } from "../markdown";
import "../helpers/date-utils";
import { NaturalDateSuggest } from "./date-suggest";

export class NextRepScheduler extends ModalBase {
  private intervalComponent: TextComponent;
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
    this.repDateComponent = new TextComponent(contentEl).setPlaceholder(
      this.curRep.nextRepDate.formatYYMMDD()
    );
    new NaturalDateSuggest(this.plugin, this.repDateComponent.inputEl);
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
    // Interval
    contentEl.appendText("Interval: ");
    this.intervalComponent = new TextComponent(contentEl).setValue(
      this.curRep.interval.toString()
    );
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
    const dateStr = this.repDateComponent.getValue();
    const date = this.plugin.dates.parseDate(
      dateStr === "" ? this.curRep.nextRepDate.formatYYMMDD() : dateStr
    );
    if (!date) {
      LogTo.Console("Failed to parse next repetition date!", true);
      return;
    }

    const interval = Number(this.intervalComponent.getValue());
    if (!interval.isValidInterval()) {
      LogTo.Console("Invalid interval data", true);
      return;
    }

    const priority = this.priorityComponent.getValue();
    this.curRep.nextRepDate = date;
    this.curRep.priority = priority;
    this.curRep.interval = interval;
    await this.plugin.queue.writeQueueTable(this.table);
    await this.plugin.updateStatusBar();
  }
}
