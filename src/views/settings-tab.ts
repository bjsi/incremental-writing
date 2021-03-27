import { PluginSettingTab, App, Setting } from "obsidian"
import IW from "../main"

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

      new Setting(containerEl)
      .setName("Using Vim Mode?")
      .setDesc("Toggle on if using vim mode.")
      .addToggle((tc) => {
          tc.setValue(settings.vimMode).onChange((value) => {
              settings.vimMode = value;
              this.plugin.saveData(settings);
          });
      });

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

      new Setting(containerEl)
      .setName("Queue File")
      .setDesc("The path to the queue file relative to the vault root.")
      .addText((text) => { 
          text.setValue(String(settings.queueFilePath)).onChange((value) => {
              settings.queueFilePath = String(value);
              this.plugin.saveData(settings);
          })
      });

      new Setting(containerEl)
      .setName("Queue Folder")
      .setDesc("The path to the queue folder relative to the vault root")
      .addText((text) => {
          text.setValue(String(settings.queueFolderPath)).onChange((value) => {
              settings.queueFolderPath = String(value);
              this.plugin.saveData(settings);
          });
      });
  }
}
