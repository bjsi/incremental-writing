import { normalizePath, FuzzySuggestModal } from "obsidian";
import * as path from 'path';
import { LogTo } from "src/logger";
import IW from "../main";

export class QueueLoadModal extends FuzzySuggestModal<string> {
  plugin: IW;

  constructor(plugin: IW) {
    super(plugin.app);
    this.plugin = plugin;
  }

  async onChooseItem(item: string, _: MouseEvent | KeyboardEvent) {
    const path = [this.plugin.settings.queueFolderPath, item].join("/");
    LogTo.Debug("Chose: " + path);
    await this.plugin.loadQueue(path);
  }

  getItems(): string[] {
    const queueFolderPath = normalizePath(this.plugin.settings.queueFolderPath)
    const defaultQueue = path.relative(queueFolderPath, this.plugin.getDefaultQueuePath());
    const folder = this.plugin.files.getTFolder(queueFolderPath);
    if (folder) {
      let files = this.plugin.app.vault
        .getMarkdownFiles()
        .filter((file) => this.plugin.files.isDescendantOf(file, folder))
        .map((file) => path.relative(queueFolderPath, file.path));

      if (!files.some((f) => f === defaultQueue))
        files.push(defaultQueue);
      return files;
    }

    return [defaultQueue];
  }

  getItemText(item: string) {
    return item;
  }
}
