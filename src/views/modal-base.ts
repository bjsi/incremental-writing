import { Modal } from "obsidian";
import "../helpers/date-utils";
import IW from "../main";

export abstract class ModalBase extends Modal {
  protected plugin: IW;

  constructor(plugin: IW) {
    super(plugin.app);
    this.plugin = plugin;
  }

  onClose() {
    let { contentEl } = this;
    contentEl.empty();
  }
}
