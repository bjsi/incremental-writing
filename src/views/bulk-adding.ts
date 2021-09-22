import {
  normalizePath,
  TFolder,
  SliderComponent,
  TextComponent,
  ButtonComponent,
  debounce,
} from "obsidian";
import { ModalBase } from "./modal-base";
import IW from "../main";
import { Queue } from "../queue";
import { FileSuggest } from "./file-suggest";
import { MarkdownTableRow } from "../markdown";
import { LogTo } from "../logger";
import "../helpers/number-utils.ts";
import "../helpers/date-utils.ts";
import "../helpers/str-utils.ts";

export class BulkAdderModal extends ModalBase {
  private queuePath: string;
  private queueComponent: TextComponent;
  private minPriorityComponent: SliderComponent;
  private maxPriorityComponent: SliderComponent;
  private inputFirstRepMin: TextComponent;
  private inputFirstRepMax: TextComponent;
  private toAddCountDiv: HTMLDivElement;
  private outstanding: Set<string>;
  private toAdd: string[] = [];
  private linkPaths: string[];
  private title: string;

  constructor(
    plugin: IW,
    queuePath: string,
    title: string,
    linkPaths: string[]
  ) {
    super(plugin);
    this.queuePath = queuePath;
    this.title = title;
    this.linkPaths = linkPaths;
  }

  async updateToAdd() {
    await this.updateOutstanding();
    this.toAdd = this.linkPaths.filter((pair) => !this.outstanding.has(pair));
    this.toAddCountDiv.innerText =
      "To Add (excluding duplicates): " + this.toAdd.length;
  }

  async updateOutstanding() {
    const queuePath = this.getQueuePath();
    if (await this.plugin.app.vault.adapter.exists(queuePath)) {
      const queue = new Queue(this.plugin, queuePath);
      const table = await queue.loadTable();
      const alreadyAdded = table
        .getReps()
        .map((rep) =>
          this.plugin.links.createAbsoluteLink(rep.link, queuePath)
        );
      this.outstanding = new Set<string>(alreadyAdded);
    } else {
      this.outstanding = new Set<string>();
    }
  }

  protected getQueuePath() {
    let queue = this.queueComponent.getValue().withExtension(".md");
    return normalizePath(
      [this.plugin.settings.queueFolderPath, queue].join("/")
    );
  }

  async onOpen() {
    let { contentEl } = this;

    contentEl.createEl("h3", { text: this.title });

    //
    // Queue

    contentEl.appendText("Queue: ");
    this.queueComponent = new TextComponent(contentEl)
      .setPlaceholder("Example: queue.md")
      .setValue(this.plugin.files.getTFile(this.queuePath).name)
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
    new FileSuggest(this.plugin, this.queueComponent.inputEl, folderFunc);
    contentEl.createEl("br");

    //
    // Note Count

    this.toAddCountDiv = contentEl.createDiv();
    await this.updateToAdd();

    //
    // Priorities

    // Min

    this.contentEl.appendText("Min Priority: ");
    this.minPriorityComponent = new SliderComponent(contentEl)
      .setLimits(0, 100, 1)
      .setDynamicTooltip()
      .onChange((value) => {
        if (this.maxPriorityComponent) {
          let max = this.maxPriorityComponent.getValue();
          if (value > max) this.maxPriorityComponent.setValue(value);
        }
      })
      .setValue(0);
    this.contentEl.createEl("br");

    // Max

    this.contentEl.appendText("Max Priority: ");
    this.maxPriorityComponent = new SliderComponent(contentEl)
      .setLimits(0, 100, 1)
      .setDynamicTooltip()
      .onChange((value) => {
        if (this.minPriorityComponent) {
          let min = this.minPriorityComponent.getValue();
          if (value < min) this.minPriorityComponent.setValue(value);
        }
      })
      .setValue(100);
    this.contentEl.createEl("br");

    //
    // Rep Dates

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
        this.add();
      }
    });

    //
    // Button

    new ButtonComponent(contentEl)
      .setButtonText("Add to IW Queue")
      .onClick(async () => {
        await this.add();
        this.close();
        return;
      });
  }

  async add() {
    if (this.toAdd.length === 0) {
      LogTo.Debug("Nothing to add (excluding duplicates).", true);
      return;
    }

    const priMin = Number(this.minPriorityComponent.getValue());
    const priMax = Number(this.maxPriorityComponent.getValue());
    const dateMin = this.parseDate(this.inputFirstRepMin.getValue());
    const dateMax = this.parseDate(this.inputFirstRepMax.getValue());

    if (
      !(
        priMin.isValidPriority() &&
        priMax.isValidPriority() &&
        priMin <= priMax
      )
    ) {
      LogTo.Debug("Min: " + priMin.toString());
      LogTo.Debug("Max: " + priMax.toString());
      LogTo.Debug("Failed to add: priority data is invalid.", true);
      this.close();
      return;
    }

    if (!(dateMin.isValid() && dateMax.isValid() && dateMin <= dateMax)) {
      LogTo.Debug("Failed to add: date data is invalid!", true);
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

    const queuePath = this.getQueuePath();
    const queue = new Queue(this.plugin, queuePath);
    const rows: MarkdownTableRow[] = [];
    LogTo.Console("To add: " + this.toAdd);
    for (let link of this.toAdd) {
      rows.push(new MarkdownTableRow(link, curPriority, "", 1, curDate));
      curPriority = (curPriority + priStep).round(2);
      curDate = new Date(dateMin).addDays(curStep);
      curStep += dateStep;
    }
    await queue.add(...rows);
  }
}
