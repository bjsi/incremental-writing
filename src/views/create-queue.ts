import "../helpers/number-utils";
import {
  TextComponent,
  ButtonComponent,
  DropdownComponent,
  normalizePath,
} from "obsidian";
import IW from "../main";
import { ModalBase } from "./modal-base";
import { LogTo } from "../logger";
import "../helpers/date-utils";
import "../helpers/str-utils";
import { AFactorScheduler, Scheduler, SimpleScheduler } from "src/scheduler";

export class CreateQueueModal extends ModalBase {
  private queueNameText: TextComponent;
  private intervalText: TextComponent;
  private afactorText: TextComponent;
  private schedulerDropdown: DropdownComponent;

  constructor(plugin: IW) {
    super(plugin);
  }

  onOpen() {
    let { contentEl } = this;

    contentEl.createEl("h2", { text: "Create and Load a New Queue" });

    //
    // Queue Name
    contentEl.appendText("Queue Name: ");
    this.queueNameText = new TextComponent(contentEl).setPlaceholder(
      "Examples: queue, folder/queue"
    );
    contentEl.createEl("br");
    this.queueNameText.inputEl.focus();
    this.queueNameText.inputEl.select();

    //
    // Queue Type
    contentEl.appendText("Scheduler: ");
    this.schedulerDropdown = new DropdownComponent(contentEl)
      .addOption("afactor", "A-Factor Scheduler")
      .addOption("simple", "Simple Scheduler")
      .setValue(this.plugin.settings.defaultQueueType)
      .onChange((value: "afactor" | "simple") =>
        this.showHideSchedulerSettings(value)
      );
    contentEl.createEl("br");

    //
    // Interval
    contentEl.appendText("Default Interval: ");
    this.intervalText = new TextComponent(contentEl).setValue("1");
    contentEl.createEl("br");

    //
    // Afactor
    contentEl.appendText("Default A-Factor: ");
    this.afactorText = new TextComponent(contentEl).setValue("2");
    contentEl.createEl("br");

    //
    // Button

    contentEl.createEl("br");
    new ButtonComponent(contentEl)
      .setButtonText("Create Queue")
      .onClick(async () => {
        await this.create();
        this.close();
      });

    this.subscribeToEvents();
  }

  subscribeToEvents() {
    this.contentEl.addEventListener("keydown", async (ev) => {
      if (ev.key === "Enter") {
        await this.create();
        this.close();
      }
    });
  }

  createScheduler(): Scheduler {
    if (this.schedulerDropdown.getValue() === "afactor") {
      const interval = Number(this.intervalText.getValue());
      if (!interval.isValidInterval()) {
        LogTo.Debug("Invalid interval data.", true);
        return;
      }

      const afactor = Number(this.afactorText.getValue());
      if (!afactor.isValidAFactor()) {
        LogTo.Debug("Invalid afactor data.", true);
        return;
      }

      return new AFactorScheduler(afactor, interval);
    } else {
      return new SimpleScheduler();
    }
  }

  async create() {
    const queueName = this.queueNameText.getValue();
    if (!queueName || queueName.length === 0) {
      LogTo.Debug("Invalid queue name.", true);
      return;
    }

    const queueNameWithExt = queueName.withExtension(".md");
    const queueFile = normalizePath(
      [this.plugin.settings.queueFolderPath, queueNameWithExt].join("/")
    );
    if (await this.plugin.files.exists(queueFile)) {
      LogTo.Debug("Queue already exists!", true);
      return;
    }

    const schedulerData = this.createScheduler()?.toString();
    if (!schedulerData || schedulerData.length === 0) return;

    LogTo.Debug("Creating queue: " + queueName, true);
    await this.plugin.files.createIfNotExists(queueFile, schedulerData);
    await this.plugin.loadQueue(queueFile);
  }

  showHideSchedulerSettings(value: "simple" | "afactor") {
    switch (value) {
      case "simple":
        this.intervalText.setDisabled(true);
        this.afactorText.setDisabled(true);
        this.intervalText.setValue("---");
        this.afactorText.setValue("---");
        return;
      case "afactor":
        this.intervalText.setDisabled(false);
        this.afactorText.setDisabled(false);
        this.intervalText.setValue("1");
        this.afactorText.setValue("2");
        return;
      default:
        throw new Error("Expected simple or afactor, got: " + value);
    }
  }
}
