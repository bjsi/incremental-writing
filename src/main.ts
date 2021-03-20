import { App, Plugin, PluginSettingTab, Setting } from "obsidian";

export default class MyPlugin extends Plugin {
  // This field stores your plugin settings.
  setting: MyPluginSettings;

  onInit() {}

  async onload() {
    console.log("Plugin is Loading...");

    // This snippet of code is used to load pluging settings from disk (if any)
    // and then add the setting tab in the Obsidian Settings panel.
    // If your plugin does not use settings, you can delete these two lines.
    this.setting = (await this.loadData()) || {
      someConfigData: 1,
      anotherConfigData: "defaultValue",
    };
    this.addSettingTab(new MyPluginSettingsTab(this.app, this));
  }

  onunload() {
    console.log("Plugin is Unloading...");
  }
}

/**
 * This is a data class that contains your plugin configurations. You can edit it
 * as you wish by adding fields and all the data you need.
 */
interface MyPluginSettings {
  someConfigData: number;
  anotherConfigData: string;
}

class MyPluginSettingsTab extends PluginSettingTab {
  plugin: MyPlugin;

  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    const settings = this.plugin.setting;
    // This is just an example of a setting controll.
    new Setting(containerEl)
      .setName("Setting Name")
      .setDesc("Setting description")
      .addText((text) =>
        text.setValue(String(settings.someConfigData)).onChange((value) => {
          if (!isNaN(Number(value))) {
            settings.someConfigData = Number(value);
            this.plugin.saveData(settings);
          }
        })
      );
  }
}
