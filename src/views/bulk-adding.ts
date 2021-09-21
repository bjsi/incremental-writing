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
import IW from "../main";
import { Queue } from "../queue";
import { FileSuggest } from "./file-suggest";
import "../helpers/date-utils";
import "../helpers/priority-utils";
import './helpers/number-utils';
import { MarkdownTableRow } from "../markdown";
import { LogTo } from "../logger";


export class BulkAdderModal extends ModalBase {
  queuePath: string;

  inputFolderField: TextComponent;
  noteCountDiv: HTMLDivElement;

  //
  // Queue

  inputQueueField: TextComponent;

  //
  // Priorities

  inputPriorityMin: SliderComponent;
  inputPriorityMax: SliderComponent;

  //
  // First Rep

  inputFirstRepMin: TextComponent;
  inputFirstRepMax: TextComponent;

  linkPaths: string[];
  outstanding: Set<string> = new Set<string>();
  toAdd: string[] = [];

  constructor(plugin: IW, queuePath: string, linkPaths: string[]) {
    super(plugin);
    this.linkPaths = linkPaths;
    this.queuePath = queuePath;
  }

  async updateOutstanding() {
    let queuePath = normalizePath(this.getQueuePath());
    let outstanding = new Set<string>();
    if (await this.plugin.app.vault.adapter.exists(queuePath)) {
      let queue = new Queue(this.plugin, queuePath);
      let table = await queue.loadTable();
      let alreadyAdded = table
        .getReps()
        .map((r) => normalizePath(r.link + ".md"));
      for (let added of alreadyAdded) {
        outstanding.add(added);
      }
    }
    this.outstanding = outstanding;
  }

  async updateToAdd() {
    await this.updateOutstanding();
    this.toAdd = this.linkPaths
      .filter((link) => !this.outstanding.has(link))
      .map((link) => normalizePath(link));
    this.noteCountDiv.innerText =
      "Notes (excluding duplicates): " + this.toAdd.length;
  }

  getQueuePath() {
    let queue = this.inputQueueField.getValue();
    if (!queue.endsWith(".md")) queue += ".md";

    return normalizePath(
      [this.plugin.settings.queueFolderPath, queue].join("/")
    );
  }

  async onOpen() {
    let { contentEl } = this;

    contentEl.createEl("h3", { text: "Bulk Add Notes to Queue" });

    //
    // Queue

    contentEl.appendText("Queue: ");
    this.inputQueueField = new TextComponent(contentEl)
      .setPlaceholder("Example: queue.md")
      .setValue(this.plugin.settings.queueFileName)
      .onChange(
        debounce(
          (_: string) => {
            this.updateToAdd();
          },
          500,
          true
        )
      );
    let folderFunc = () =>
      this.plugin.app.vault.getAbstractFileByPath(
        this.plugin.settings.queueFolderPath
      ) as TFolder;
    new FileSuggest(this.plugin, this.inputQueueField.inputEl, folderFunc);
    contentEl.createEl("br");

    //
    // Note Count

    this.noteCountDiv = contentEl.createDiv();
    await this.updateToAdd();

    //
    // Priorities

    // Min

    this.contentEl.appendText("Min Priority: ");
    this.inputPriorityMin = new SliderComponent(contentEl)
      .setLimits(0, 100, 1)
      .setDynamicTooltip()
      .onChange((value) => {
        if (this.inputPriorityMax) {
          let max = this.inputPriorityMax.getValue();
          if (value > max) this.inputPriorityMax.setValue(value);
        }
      })
      .setValue(0);
    this.contentEl.createEl("br");

    // Max

    this.contentEl.appendText("Max Priority: ");
    this.inputPriorityMax = new SliderComponent(contentEl)
      .setLimits(0, 100, 1)
      .setDynamicTooltip()
      .onChange((value) => {
        if (this.inputPriorityMin) {
          let min = this.inputPriorityMin.getValue();
          if (value < min) this.inputPriorityMin.setValue(value);
        }
      })
      .setValue(100);
    this.contentEl.createEl("br");

    //
    // First Reps

    this.contentEl.appendText("Earliest Rep Date: ");
    this.inputFirstRepMin = new TextComponent(contentEl).setValue("1970-01-01");
    this.contentEl.createEl("br");

    this.contentEl.appendText("Latest Rep Date: ");
    this.inputFirstRepMax = new TextComponent(contentEl).setValue("1970-01-01");
    this.contentEl.createEl("br");

    //
    // Events

    contentEl.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        this.addNotes();
      }
    });

    //
    // Button

    new ButtonComponent(contentEl)
      .setButtonText("Add to IW Queue")
      .onClick(async () => {
        await this.addNotes();
        this.close();
        return;
      });
  }

  datesAreValid(d1: Date, d2: Date) {
    return d1.isValid() && d2.isValid() && d1 <= d2;
  }

  prioritiesAreValid(p1: number, p2: number) {
    return p1.isValidPriority() && p2.isValidPriority() && p1 < p2;
  }

  async addNotes() {
    let priMin = Number(this.inputPriorityMin.getValue());
    let priMax = Number(this.inputPriorityMax.getValue());
    let dateMin = this.parseDate(this.inputFirstRepMin.getValue());
    let dateMax = this.parseDate(this.inputFirstRepMax.getValue());

    if (
      !this.prioritiesAreValid(priMin, priMax) ||
      !this.datesAreValid(dateMin, dateMax)
    ) {
      new Notice("Failed: invalid data!");
      this.close();
      return;
    }
    let priStep = (priMax - priMin) / this.toAdd.length;
    let curPriority = priMin;
    let curDate = dateMin;
    let dateDiff = dateMin.daysDifference(dateMax);
    let numToAdd = this.toAdd.length > 0 ? this.toAdd.length : 1;
    let dateStep = dateDiff / numToAdd;
    let curStep = dateStep;

    let queue = new Queue(this.plugin, this.getQueuePath());
    let rows: MarkdownTableRow[] = [];
    LogTo.Console("To add: " + this.toAdd);
    for (let note of this.toAdd) {
      let file = this.plugin.app.vault.getAbstractFileByPath(note) as TFile;
      let link = this.plugin.files.toLinkText(file);
      rows.push(new MarkdownTableRow(link, curPriority, "", 1, curDate));

      curPriority = (curPriority + priStep).round(2);
      curDate = new Date(dateMin).addDays(curStep);
      curStep += dateStep;
    }

    await queue.addNotesToQueue(...rows);
  }
}
