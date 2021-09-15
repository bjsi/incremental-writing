import IW from "../main";
import { LogTo } from "../logger";
import {
  normalizePath,
  TFolder,
  TFile,
  SliderComponent,
  Notice,
  TextComponent,
  ButtonComponent,
  debounce,
} from "obsidian";
import { ModalBase } from "./modal-base";
import { MarkdownTableRow } from "../markdown";
import { PriorityUtils } from "../helpers/priority-utils";

export class NextRepScheduler extends ModalBase {
  inputPriority: SliderComponent;
  inputInterval: TextComponent;
  curRep: MarkdownTableRow;

  constructor(plugin: IW, curRep: MarkdownTableRow) {
    super(plugin);
    this.curRep = curRep;
  }

  onOpen() {
    let { contentEl } = this;

    // Interval or Date

    contentEl.appendText("Interval: ");
    this.inputInterval = new TextComponent(contentEl).setValue(
      String(this.curRep.priority)
    );
    contentEl.createEl("br");

    //
    // Button

    let inputButton = new ButtonComponent(contentEl)
      .setButtonText("Schedule")
      .onClick(async () => {
        this.close();
      });
  }

  intervalIsValid(ivl: number) {
    return !isNaN(ivl) && ivl >= 1;
  }

  schedule() {
    let ivl = Math.round(Number(this.inputInterval.getValue()));
    if (!this.intervalIsValid(ivl)) {
      LogTo.Debug("Invalid interval!");
      return;
    }
  }
}
