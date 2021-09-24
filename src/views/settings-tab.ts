import {
  TFolder,
  SliderComponent,
  normalizePath,
  PluginSettingTab,
  App,
  Setting,
  debounce,
} from "obsidian";
import IW from "../main";
import { FileSuggest, FolderSuggest } from "./file-suggest";
import { LogTo } from "src/logger";

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
    // Default First Rep Date

    new Setting(containerEl)
      .setName("Default First Rep Date")
      .setDesc(
        "Sets the default first repetition date for new repetitions. Example: today, tomorrow, next week. Requires that you have installed the nldates plugin."
      )
      .addText((comp) => {
        comp.setPlaceholder("Example: today, tomorrow, next week.");
        const nldates = (<any>this.plugin.app).plugins.getPlugin(
          "nldates-obsidian"
        );
        comp.disabled = nldates == null;
        comp.setValue(String(settings.defaultFirstRepDate)).onChange(
          debounce(
            (value) => {
              const dateString = String(value);
              const date = nldates.parseDate(dateString);
              if (date && date.date) {
                LogTo.Debug("Setting default first rep date to " + dateString);
                settings.defaultFirstRepDate = dateString;
                this.plugin.saveData(settings);
              } else {
                LogTo.Debug("Invalid natural language date string.");
              }
            },
            500,
            true
          )
        );
      });

    //
    // Ask for next repetition date

    new Setting(containerEl)
      .setName("Ask for Next Repetition Date?")
      .setDesc(
        "Do you want to be asked to give the next repetition date when you execute the next repetition command?"
      )
      .addToggle((comp) => {
        comp.setValue(Boolean(settings.askForNextRepDate)).onChange((value) => {
          settings.askForNextRepDate = Boolean(value);
          this.plugin.saveData(settings);
        });
      });

    //
    // Queue Tags

    new Setting(containerEl)
      .setName("Queue Tags")
      .setDesc(
        "Mapping from queue names to tags. Tagging a note with these tags will add it to the corresponding queue."
      )
      .addTextArea((textArea) => {
        textArea.setPlaceholder(
          "Example: IW-Queue=iw,writing\nTasks=tasks,todo"
        );
        const currentValue = Object.entries(settings.queueTagMap)
          .map(
            ([queue, tags]: [string, string[]]) => `${queue}=${tags.join(",")}`
          )
          .join("\n");

        textArea.setValue(currentValue).onChange((value) => {
          let str = String(value).trim();
          if (!str) return;
          if (!str.split(/\r?\n/).every((line) => line.match(/(.+)=(.+,?)+/))) {
            LogTo.Debug("Invalid queue tag map. Not saving.");
            return;
          }

          const isEmpty = (s: string | any[]) => !s || s.length === 0;
          const split: [string, string[]][] = str
            .split(/\r?\n/)
            .map((line) => line.split("="))
            .map(([queue, tags]: [string, string]) => [
              queue,
              tags
                .split(",")
                .map((s) => s.trim())
                .filter((s) => !isEmpty(s)),
            ]);

          let queueTagMap: Record<string, string[]> = {};
          for (let [queue, tags] of split) {
            if (!isEmpty(queue) && !isEmpty(tags)) queueTagMap[queue] = tags;
          }

          settings.queueTagMap = queueTagMap;
          LogTo.Debug(
            "Updating queue tag map to: " + JSON.stringify(queueTagMap)
          );
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
            if (!num.isValidPriority()) {
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
            if (!num.isValidPriority()) {
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
