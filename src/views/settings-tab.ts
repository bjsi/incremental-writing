import { TFolder, normalizePath, PluginSettingTab, App, Setting } from "obsidian"
import IW from "../main"
import { FileSuggest, FolderSuggest } from "./file-suggest"

export class IWSettingsTab extends PluginSettingTab {

  plugin: IW;

  constructor(app: App, plugin: IW) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
      const { containerEl } = this;
      const settings = this.plugin.settings;
      containerEl.empty();

      containerEl.createEl('h2', {text: 'Incremental Writing Settings'});

      //
      // Queue Folder
      
      new Setting(containerEl)
      .setName("Queue Folder")
      .setDesc("The path to the folder where new queues should be created relative to the vault root.")
      .addText((text) => {
          text.setPlaceholder("Example: folder1/folder2")
          new FolderSuggest(this.app, text.inputEl);
          text.setValue(String(settings.queueFolderPath)).onChange((value) => {
              settings.queueFolderPath = normalizePath(String(value));
              this.plugin.saveData(settings);
          });
       })

      //
      // Default Queue

      new Setting(containerEl)
      .setName("Default Queue")
      .setDesc("The name of the default queue file relative to the queue folder.")
      .addText((text) => {

          new FileSuggest(this.plugin, text.inputEl, () => this.app.vault.getAbstractFileByPath(settings.queueFolderPath) as TFolder);
          text.setPlaceholder("Example: queue.md")
          text.setValue(String(settings.queueFilePath)).onChange((value) => {
              let file = normalizePath(String(value));
              if (!file.endsWith(".md"))
                  file += ".md";
              settings.queueFilePath = file;
              this.plugin.saveData(settings);
          })

      })

      //
      // Priority

      new Setting(containerEl)
      .setName("Default Priority")
      .setDesc("Default priority for new repetitions.")
      .addText((text) => {
          text.setValue(String(settings.defaultPriority)).onChange((value) => {
              let num = Number(value);
              if (!isNaN(num)) {
                  if (num < 0 || num > 100){
                      return;
                  }
                  settings.defaultPriority = num;
                  this.plugin.saveData(settings);
              }
          });
      });

      new Setting(containerEl)
      .setName("Default A-Factor")
      .setDesc("Default A-Factor for new repetitions. The A-Factor is multiplied by the interval to find the next repetition interval.")
      .addText((text) => {
          text.setValue(String(settings.defaultAFactor)).onChange((value) => {
              let num = Number(value);
              if (!isNaN(num) && num > 0){
                  settings.defaultAFactor = num;
                  this.plugin.saveData(settings);
              }
          });
      });
    
      new Setting(containerEl)
      .setName("Default starting interval")
      .setDesc("Default starting interval between repetitions.")
      .addText((text) => {
          text.setValue(String(settings.defaultInterval)).onChange((value) => {
              let num = Number(value);
              if (!isNaN(num) && num >= 0) {
                  settings.defaultInterval = Math.round(num);
                  this.plugin.saveData(settings);
              }
          });
      });
  }
}
