import { FuzzySuggestModal } from "obsidian";
import IW from "../main";
import { ReviewFileModal } from "./modals";

export class FuzzyNoteAdder extends FuzzySuggestModal<string> {
  plugin: IW;

  constructor(plugin: IW) {
    super(plugin.app);
    this.plugin = plugin;
  }

  onChooseItem(item: string, evt: MouseEvent | KeyboardEvent) {
    new ReviewFileModal(this.plugin, item).open();
  }

  getItems(): string[] {
    return this.plugin.app.vault.getMarkdownFiles().map((file) => file.path);
  }

  getItemText(item: string) {
    return item;
  }
}
