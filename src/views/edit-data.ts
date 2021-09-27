import {
  SliderComponent,
  TextComponent,
  ButtonComponent,
  DropdownComponent,
} from "obsidian";
import IW from "../main";
import { ModalBase } from "./modal-base";
import { LogTo } from "../logger";
import { MarkdownTable, MarkdownTableRow } from "../markdown";
import "../helpers/date-utils";
import "../helpers/number-utils";
import { NaturalDateSuggest } from "./date-suggest";

export class EditDataModal extends ModalBase {
  private inputSlider: SliderComponent;
  private inputNoteField: TextComponent;
  private inputNextRep: TextComponent;
  private currentRep: MarkdownTableRow;
  private intervalInput: TextComponent;
  private table: MarkdownTable;

  constructor(plugin: IW, curRep: MarkdownTableRow, table: MarkdownTable) {
    super(plugin);
    this.currentRep = curRep;
    this.table = table;
  }

  async onOpen() {
    let { contentEl } = this;

    contentEl.createEl("h2", { text: "Edit Rep Data" });
    contentEl.createEl("p", { text: "Current Rep: " + this.currentRep.link });

    //
    // Next Rep Date

    contentEl.appendText("Next Rep Date: ");
    this.inputNextRep = new TextComponent(contentEl).setPlaceholder(
      this.currentRep.nextRepDate.formatYYMMDD()
    );
    new NaturalDateSuggest(this.plugin, this.inputNextRep.inputEl);
    contentEl.createEl("br");

    this.inputNextRep.inputEl.focus();
    this.inputNextRep.inputEl.select();

    //
    // Priority

    contentEl.appendText("Priority: ");
    this.inputSlider = new SliderComponent(contentEl)
      .setLimits(0, 100, 1)
      .setValue(this.currentRep.priority)
      .setDynamicTooltip();
    contentEl.createEl("br");

    //
    // Interval

    contentEl.appendText("Interval: ");
    this.intervalInput = new TextComponent(contentEl).setValue(
      this.currentRep.interval.toString()
    );
    contentEl.createEl("br");

    //
    // Notes

    contentEl.appendText("Notes: ");
    this.inputNoteField = new TextComponent(contentEl).setValue(
      this.currentRep.notes
    );
    contentEl.createEl("br");

    //
    // Button

    contentEl.createEl("br");
    new ButtonComponent(contentEl).setButtonText("Update").onClick(async () => {
      await this.updateRepData();
      this.close();
    });

    this.subscribeToEvents();
  }

  async updateStatusBar() {
    const curRep = (await this.plugin.queue.loadTable())?.currentRep();
    this.plugin.statusBar.updateCurrentRep(curRep);
  }

  async updateRepData() {
    const dateStr = this.inputNextRep.getValue();
    const date = this.plugin.dates.parseDate(
      dateStr === "" ? this.currentRep.nextRepDate.formatYYMMDD() : dateStr
    );
    if (!date) {
      LogTo.Console("Failed to parse next repetition date!", true);
      return;
    }

    const interval = Number(this.intervalInput.getValue());
    if (!interval.isValidInterval()) {
      LogTo.Console("Invalid interval data!", true);
      return;
    }

    const priority = this.inputSlider.getValue();
    const notes = this.inputNoteField.getValue();
    if (notes.contains("|")) {
      LogTo.Console("Repetition notes contain illegal character '|'.", true);
      return;
    }

    this.currentRep.nextRepDate = date;
    this.currentRep.interval = interval;
    this.currentRep.priority = priority;
    this.currentRep.notes = notes;
    await this.plugin.queue.writeQueueTable(this.table);
    LogTo.Debug("Updated repetition data.", true);
    await this.updateStatusBar();
  }

  subscribeToEvents() {
    this.contentEl.addEventListener("keydown", async (ev) => {
      if (ev.key === "PageUp") {
        let curValue = this.inputSlider.getValue();
        if (curValue < 95) this.inputSlider.setValue(curValue + 5);
        else this.inputSlider.setValue(100);
      } else if (ev.key === "PageDown") {
        let curValue = this.inputSlider.getValue();
        if (curValue > 5) this.inputSlider.setValue(curValue - 5);
        else this.inputSlider.setValue(0);
      } else if (ev.key === "Enter") {
        await this.updateRepData();
        this.close();
      }
    });
  }
}
