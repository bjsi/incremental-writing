import { MarkdownTableRow } from "../markdown";
import IW from "../main";
import { TFile } from "obsidian";

export class StatusBar {
  statusBarAdded: boolean;
  statusBar: HTMLElement;
  statusBarText: HTMLSpanElement;

  repText: HTMLSpanElement;
  queueText: HTMLSpanElement;

  plugin: IW;

  constructor(statusBar: HTMLElement, plugin: IW) {
    this.statusBar = statusBar;
    this.plugin = plugin;
  }

  initStatusBar() {
    if (this.statusBarAdded) {
      return;
    }

    let status = this.statusBar.createEl("div", { prepend: true });
    this.statusBarText = status.createEl("span", {
      cls: ["status-bar-item-segment"],
    });
    this.repText = status.createEl("span", {
      cls: ["status-bar-item-segment"],
    });
    this.queueText = status.createEl("span", {
      cls: ["status-bar-item-segment"],
    });
    this.statusBarAdded = true;
  }

  updateCurrentQueue(queue: string) {
    if (queue) {
      let name = queue.split("/")[1];
      if (name.endsWith(".md")) name = name.substr(0, name.length - 3);
      this.queueText.innerText = "IW Queue: " + name;
    }
  }

  updateCurrentRep(row: MarkdownTableRow) {
    if (row) {
      let link = row.link;
      let file = this.plugin.files.getTFile(link + ".md");
      if (file) {
        this.repText.innerText = "IW Rep: " + file.basename;
        return;
      }
    }

    this.repText.innerText = "Current Rep: None.";
  }
}
