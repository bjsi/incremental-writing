import {
  normalizePath,
  TFolder,
  MarkdownView,
  SliderComponent,
  TextComponent,
  ButtonComponent,
} from "obsidian";
import IW from "../main";
import { ModalBase } from "./modal-base";
import { LogTo } from "../logger";
import { FileSuggest } from "./file-suggest";
import { Queue } from "../queue";
import { PriorityUtils } from "../helpers/priority-utils";
import { MarkdownTableRow } from "../markdown";
import "../helpers/date-utils";
import "../helpers/number-utils";
import { NaturalDateSuggest } from "./date-suggest";

abstract class ReviewModal extends ModalBase {
  protected title: string;
  protected inputSlider: SliderComponent;
  protected inputNoteField: TextComponent;
  protected inputFirstRep: TextComponent;
  protected inputQueueField: TextComponent;
  protected titleNode: HTMLElement;

  constructor(plugin: IW, title: string) {
    super(plugin);
    this.title = title;
  }

  onOpen() {
    let { contentEl } = this;

    this.titleNode = contentEl.createEl("h2", { text: this.title });

    //
    // Queue

    contentEl.appendText("Queue: ");
    this.inputQueueField = new TextComponent(contentEl)
      .setPlaceholder("Example: queue.md")
      .setValue(this.plugin.files.getTFile(this.plugin.queue.queuePath).name);
    let folderFunc = () =>
      this.plugin.app.vault.getAbstractFileByPath(
        this.plugin.settings.queueFolderPath
      ) as TFolder;
    new FileSuggest(this.plugin, this.inputQueueField.inputEl, folderFunc);
    contentEl.createEl("br");

    //
    // First Rep Date

    const firstRepDate = this.plugin.settings.defaultFirstRepDate;
    contentEl.appendText("First Rep Date: ");
    this.inputFirstRep = new TextComponent(contentEl).setPlaceholder(
      firstRepDate
    );
    new NaturalDateSuggest(this.plugin, this.inputFirstRep.inputEl);
    contentEl.createEl("br");

    this.inputFirstRep.inputEl.focus();
    this.inputFirstRep.inputEl.select();

    //
    // Priority

    let pMin = this.plugin.settings.defaultPriorityMin;
    let pMax = this.plugin.settings.defaultPriorityMax;
    contentEl.appendText("Priority: ");
    this.inputSlider = new SliderComponent(contentEl)
      .setLimits(0, 100, 1)
      .setValue(PriorityUtils.getPriorityBetween(pMin, pMax))
      .setDynamicTooltip();
    contentEl.createEl("br");

    //
    // Notes

    contentEl.appendText("Notes: ");
    this.inputNoteField = new TextComponent(contentEl).setPlaceholder("Notes");
    contentEl.createEl("br");

    //
    // Button

    contentEl.createEl("br");
    new ButtonComponent(contentEl)
      .setButtonText("Add to Queue")
      .onClick(async () => {
        await this.addToOutstanding();
        this.close();
      });

    this.subscribeToEvents();
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
        await this.addToOutstanding();
        this.close();
      }
    });
  }

  getQueuePath() {
    let queue = this.inputQueueField.getValue();
    if (!queue.endsWith(".md")) queue += ".md";

    return normalizePath(
      [this.plugin.settings.queueFolderPath, queue].join("/")
    );
  }

  abstract addToOutstanding(): Promise<void>;
}

export class ReviewNoteModal extends ReviewModal {
  constructor(plugin: IW) {
    super(plugin, "Add Note to Outstanding?");
  }

  onOpen() {
    super.onOpen();
  }

  async addToOutstanding() {
    const dateStr = this.inputFirstRep.getValue();
    const date = this.plugin.dates.parseDate(
      dateStr === "" ? this.plugin.settings.defaultFirstRepDate : dateStr
    );
    if (!date) {
      LogTo.Console("Failed to parse initial repetition date!");
      return;
    }

    const queue = new Queue(this.plugin, this.getQueuePath());
    const file = this.plugin.files.getActiveNoteFile();
    if (!file) {
      LogTo.Console("Failed to add to outstanding.", true);
      return;
    }
    const link = this.plugin.files.toLinkText(file);
    const row = new MarkdownTableRow(
      link,
      this.inputSlider.getValue(),
      this.inputNoteField.getValue(),
      1,
      date
    );
    await queue.add(row);
  }
}

export class ReviewFileModal extends ReviewModal {
  filePath: string;

  constructor(plugin: IW, filePath: string) {
    super(plugin, "Add File to Outstanding?");
    this.filePath = filePath;
  }

  onOpen() {
    super.onOpen();
  }

  async addToOutstanding() {
    const dateStr = this.inputFirstRep.getValue();
    const date = this.plugin.dates.parseDate(
      dateStr === "" ? this.plugin.settings.defaultFirstRepDate : dateStr
    );
    if (!date) {
      LogTo.Console("Failed to parse initial repetition date!");
      return;
    }

    const queue = new Queue(this.plugin, this.getQueuePath());
    const file = this.plugin.files.getTFile(this.filePath);
    if (!file) {
      LogTo.Console("Failed to add to outstanding because file was null", true);
      return;
    }
    const link = this.plugin.files.toLinkText(file);
    const row = new MarkdownTableRow(
      link,
      this.inputSlider.getValue(),
      this.inputNoteField.getValue(),
      1,
      date
    );
    await queue.add(row);
  }
}

export class ReviewBlockModal extends ReviewModal {
  private customBlockRefInput: TextComponent;

  constructor(plugin: IW) {
    super(plugin, "Add Block to Outstanding?");
  }

  onOpen() {
    super.onOpen();
    let { contentEl } = this;
    this.customBlockRefInput = new TextComponent(contentEl);
    const br = contentEl.createEl("br");
    this.titleNode.after(
      "Block Ref Name: ",
      this.customBlockRefInput.inputEl,
      br
    );
    this.customBlockRefInput.inputEl.focus();
    this.customBlockRefInput.inputEl.select();
  }

  getCurrentLineNumber(): number | null {
    return (this.app.workspace.activeLeaf
      .view as MarkdownView).editor?.getCursor()?.line;
  }

  async addToOutstanding() {
    const dateStr = this.inputFirstRep.getValue();
    const date = this.plugin.dates.parseDate(
      dateStr === "" ? this.plugin.settings.defaultFirstRepDate : dateStr
    );
    if (!date) {
      LogTo.Console("Failed to parse initial repetition date!");
      return;
    }

    const queue = new Queue(this.plugin, this.getQueuePath());
    const file = this.plugin.files.getActiveNoteFile();
    if (!file) {
      LogTo.Console("Failed to add to outstanding.", true);
      return;
    }

    const lineNumber = this.getCurrentLineNumber();
    if (lineNumber == null) {
      LogTo.Console("Failed to get the current line number.", true);
      return;
    }

    const customRefName = this.customBlockRefInput.getValue();
    const blockLink = await this.plugin.blocks.createBlockRefIfNotExists(
      lineNumber,
      file,
      customRefName
    );
    if (!blockLink || blockLink.length === 0) {
      LogTo.Debug("Failed to add block to queue: block link was invalid.");
      return;
    }

    await queue.add(
      new MarkdownTableRow(
        blockLink,
        this.inputSlider.getValue(),
        this.inputNoteField.getValue(),
        1,
        date
      )
    );
  }
}
