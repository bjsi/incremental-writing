import { App } from "obsidian";

export abstract class ObsidianUtilsBase {
  protected app: App;

  constructor(app: App) {
    this.app = app;
  }
}
