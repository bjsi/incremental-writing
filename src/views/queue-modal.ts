import { normalizePath, FuzzySuggestModal, TFolder } from "obsidian";
import IW from "../main";

export class QueueLoadModal extends FuzzySuggestModal<string> {
  plugin: IW;

  constructor(plugin: IW) {
    super(plugin.app);
    this.plugin = plugin;
  }

  onChooseItem(item: string, evt: MouseEvent | KeyboardEvent) {
    let path = [this.plugin.settings.queueFolderPath, item].join("/");
    this.plugin.loadQueue(path);
  }

  getItems(): string[] {
    let folder = this.plugin.files.getTFolder(
      normalizePath(this.plugin.settings.queueFolderPath)
    );
    if (folder) {
      let files = this.plugin.app.vault
        .getMarkdownFiles()
        .filter((file) => this.plugin.files.isDescendantOf(file, folder))
        .map((file) => file.name);

      if (!files.some((f) => f === this.plugin.settings.queueFileName))
        files.push(this.plugin.settings.queueFileName);
      return files;
    }

    return [this.plugin.settings.queueFileName];
  }

  getItemText(item: string) {
    return item;
  }
}
