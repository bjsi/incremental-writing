import {
  TFolder,
  SliderComponent,
  normalizePath,
  PluginSettingTab,
  App,
  Setting,
} from "obsidian";
import IW from "../main";
import { FileSuggest, FolderSuggest } from "./file-suggest";
import { PriorityUtils } from "../helpers/priority-utils";

export class IWSettingsTab extends PluginSettingTab {
  plugin: IW;
  inputPriorityMin: SliderComponent;
  inputPriorityMax: SliderComponent;

  constructor(app: App, plugin: IW) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    const settings = this.plugin.settings;
    containerEl.empty();

    containerEl.createEl("h3", { text: "Incremental Writing Settings" });

    //
    // Queue Folder

    new Setting(containerEl)
      .setName("Queue Folder")
      .setDesc(
        "The path to the folder where new incremental writing queues should be created. Relative to the vault root."
      )
      .addText((text) => {
        text.setPlaceholder("Example: folder1/folder2");
        new FolderSuggest(this.app, text.inputEl);
        text.setValue(String(settings.queueFolderPath)).onChange((value) => {
          settings.queueFolderPath = normalizePath(String(value));
          this.plugin.saveData(settings);
        });
      });

    //
    // Default Queue

    new Setting(containerEl)
      .setName("Default Queue")
      .setDesc(
        "The name of the default incremental writing queue file. Relative to the queue folder."
      )
      .addText((text) => {
        new FileSuggest(
          this.plugin,
          text.inputEl,
          () =>
            this.app.vault.getAbstractFileByPath(
              settings.queueFolderPath
            ) as TFolder
        );
        text.setPlaceholder("Example: queue.md");
        text.setValue(String(settings.queueFileName)).onChange((value) => {
          let str = String(value);
          if (!str) return;
          let file = normalizePath(String(value));
          if (!file.endsWith(".md")) file += ".md";
          settings.queueFileName = file;
          this.plugin.saveData(settings);
        });
      });

    //
    // Default Queue Type

    new Setting(containerEl)
      .setName("Default Scheduler")
      .setDesc("The default scheduler to use for newly created queues.")
      .addDropdown((comp) => {
        comp.addOption("afactor", "A-Factor Scheduler");
        comp.addOption("simple", "Simple Scheduler");
        comp.setValue(String(settings.defaultQueueType)).onChange((value) => {
          settings.defaultQueueType = String(value);
          this.plugin.saveData(settings);
        });
      });

    //
    // Skip New Note Dialog

    // new Setting(containerEl)
    //   .setName("Skip Add Note Dialog?")
    //   .setDesc("Skip the add note dialog and use the defaults?")
    //   .addToggle((comp) => {
    //       comp.setValue(Boolean(settings.skipAddNoteWindow)).onChange((value) => {
    //           settings.skipAddNoteWindow = Boolean(value);
    //           this.plugin.saveData(settings);
    //       })
    //   })

    //
    // Priority

    // Min

    new Setting(containerEl)
      .setName("Default Minimum Priority")
      .setDesc("Default minimum priority for new repetitions.")
      .addSlider((comp) => {
        this.inputPriorityMin = comp;
        comp.setDynamicTooltip();
        comp.setValue(Number(settings.defaultPriorityMin)).onChange((value) => {
          if (this.inputPriorityMax) {
            let num = Number(value);
            if (!PriorityUtils.isValid(num)) {
              return;
            }

            if (num > this.inputPriorityMax.getValue()) {
              this.inputPriorityMax.setValue(num);
            }

            settings.defaultPriorityMin = num;
            this.plugin.saveData(settings);
          }
        });
      });

    // Max

    new Setting(containerEl)
      .setName("Default Maximum Priority")
      .setDesc("Default maximum priority for new repetitions.")
      .addSlider((comp) => {
        this.inputPriorityMax = comp;
        comp.setDynamicTooltip();
        comp.setValue(Number(settings.defaultPriorityMax)).onChange((value) => {
          if (this.inputPriorityMin) {
            let num = Number(value);
            if (!PriorityUtils.isValid(num)) {
              return;
            }

            if (num < this.inputPriorityMin.getValue()) {
              this.inputPriorityMin.setValue(num);
            }

            settings.defaultPriorityMax = num;
            this.plugin.saveData(settings);
          }
        });
      });

    // Auto add

    new Setting(containerEl)
      .setName("Auto Add New Notes?")
      .setDesc("Automatically add new notes to the default queue?")
      .addToggle((comp) => {
        comp.setValue(settings.autoAddNewNotes).onChange((value) => {
          settings.autoAddNewNotes = value;
          this.plugin.saveData(settings);
          this.plugin.autoAddNewNotesOnCreate();
        });
      });
  }
}
