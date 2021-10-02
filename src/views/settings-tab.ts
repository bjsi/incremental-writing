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
import { NaturalDateSuggest } from "./date-suggest";

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

    const nldates = (<any>this.plugin.app).plugins.getPlugin(
      "nldates-obsidian"
    );
    const hasNlDates = nldates != null;

    //
    // Dropdown Dates
    new Setting(containerEl)
      .setName("Dropdown Date List")
      .setDesc(
        "Sets the default list of dropdown dates that show up in modals so you can quickly set repetition dates."
      )
      .addTextArea((comp) => {
        comp.setPlaceholder("Example:\ntoday\ntomorrow\nnext week");
        const currentValue = Object.keys(
          this.plugin.settings.dropdownNaturalDates
        ).join("\n");
        comp.setValue(currentValue).onChange(
          debounce(
            (value) => {
              if (hasNlDates) {
                const inputDates =
                  String(value)
                    ?.split(/\r?\n/)
                    ?.map((str) => [str, nldates.parseDate(str)]) || [];

                if (!inputDates || inputDates.length === 0) {
                  LogTo.Debug("User inputted dates were null or empty");
                  settings.dropdownNaturalDates = {};
                  this.plugin.saveData(settings);
                  return;
                }

                const validDates: string[] = inputDates
                  .filter(([_, date]: [string, any]) => date != null && date.date)
                  .map(([s, _]: [string, Date]) => s);

                if (inputDates.length !== validDates.length) {
                  LogTo.Debug(
                    `Ignoring ${
                      inputDates.length - validDates.length
                    } invalid natural language date strings.`
                  );
                }

                const dateOptionsRecord: Record<string, string> = validDates
			.reduce((acc, x) => 
				{ 
					acc[x] = x;
					return acc;
				}, {} as Record<string, string>);

                LogTo.Debug(
                  "Setting dropdown date options to " +
                    JSON.stringify(dateOptionsRecord)
                );
                settings.dropdownNaturalDates = dateOptionsRecord;
                this.plugin.saveData(settings);
              }
            },
            500,
            true
          )
        );
      });

    //
    // First Rep Date

    new Setting(containerEl)
      .setName("Default First Rep Date")
      .setDesc(
        "Sets the default first repetition date for new repetitions. Example: today, tomorrow, next week. **Requires that you have installed the Natural Language Dates plugin.**"
      )
      .addText((comp) => {
        new NaturalDateSuggest(this.plugin, comp.inputEl);
        comp
          .setValue(String(settings.defaultFirstRepDate))
          .setPlaceholder("1970-01-01")
          .onChange(
            debounce(
              (value) => {
                if (hasNlDates) {
                  const dateString = String(value);
                  const date = nldates.parseDate(dateString);
                  if (date && date.date) {
                    LogTo.Debug(
                      "Setting default first rep date to " + dateString
                    );
                    settings.defaultFirstRepDate = dateString;
                    this.plugin.saveData(settings);
                  } else {
                    LogTo.Debug("Invalid natural language date string.");
                  }
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
          "Example:\nIW-Queue=iw,writing\nTasks=tasks,todo"
        );
        const currentValue = Object.entries(settings.queueTagMap)
          .map(
            ([queue, tags]: [string, string[]]) => `${queue}=${tags.join(",")}`
          )
          .join("\n");

        textArea.setValue(currentValue).onChange((value) => {
          const str = String(value).trim();
          if (!str) {
            LogTo.Debug("Setting the queue tag map to empty.");
            settings.queueTagMap = {};
            this.plugin.saveData(settings);
            return;
          } else if (
            !str.split(/\r?\n/).every((line) => line.match(/(.+)=(.+,?)+/))
          ) {
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
