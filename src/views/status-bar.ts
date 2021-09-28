import { MarkdownTableRow } from "../markdown";
import "../helpers/str-utils";
import { normalizePath, parseLinktext } from "obsidian";
import IW from "../main";

export class StatusBar {
  private statusBarAdded: boolean;
  private statusBar: HTMLElement;

  private repText: HTMLSpanElement;
  private priorityText: HTMLSpanElement;
  private queueText: HTMLSpanElement;

  private plugin: IW;

  constructor(statusBar: HTMLElement, plugin: IW) {
    this.statusBar = statusBar;
    this.plugin = plugin;
  }

  initStatusBar() {
    if (this.statusBarAdded) {
      return;
    }

    let status = this.statusBar.createEl("div", { prepend: true });
    this.repText = status.createEl("span", {
      cls: ["status-bar-item-segment"],
    });
    this.priorityText = status.createEl("span", {
      cls: ["status-bar-item-segment"],
    });
    this.queueText = status.createEl("span", {
      cls: ["status-bar-item-segment"],
    });
    this.statusBarAdded = true;
  }

  updateCurrentQueue(queuePath: string) {
    const name =
      normalizePath(queuePath)?.split("/")?.last()?.rtrim(".md") || "";
    this.queueText.innerText =
      name && name.length > 0 ? "Queue: " + name : "Queue: None";
  }

  updateCurrentPriority(n: number) {
    this.priorityText.innerText = "Pri: " + n.toString();
  }

  updateCurrentRep(row: MarkdownTableRow) {
    if (row) {
      const { path, subpath } = parseLinktext(row.link);
      const file = this.plugin.app.metadataCache.getFirstLinkpathDest(
        path,
        this.plugin.queue.queuePath
      );
      if (file) {
        this.updateCurrentPriority(row.priority);
        this.repText.innerText =
          "Rep: " + file.name.substr(0, file.name.length - 3) + subpath;
      }
    } else {
      this.repText.innerText = "Rep: None.";
    }
  }
}
