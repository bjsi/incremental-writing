import { TFolder, Plugin, TFile, ButtonComponent } from "obsidian";
import { Queue } from "./queue";
import { LogTo } from "./logger";
import {
  ReviewFileModal,
  ReviewNoteModal,
  ReviewBlockModal,
} from "./views/modals";
import { IWSettings, DefaultSettings } from "./settings";
import { IWSettingsTab } from "./views/settings-tab";
import { StatusBar } from "./views/status-bar";
import { QueueLoadModal } from "./views/queue-modal";
import { LinkEx } from "./helpers/link-utils";
import { FileUtils } from "./helpers/file-utils";
import { BulkAdderModal } from "./views/bulk-adding";
import { BlockUtils } from "./helpers/block-utils";
import { FuzzyNoteAdder } from "./views/fuzzy-note-adder";

export default class IW extends Plugin {
  settings: IWSettings;
  statusBar: StatusBar;
  queue: Queue;

  //
  // Utils

  links: LinkEx = new LinkEx(this.app);
  files: FileUtils = new FileUtils(this.app);
  blocks: BlockUtils = new BlockUtils(this.app);

  async loadConfig() {
    this.settings = this.settings = Object.assign(
      {},
      DefaultSettings,
      await this.loadData()
    );
  }

  getDefaultQueuePath() {
    return [this.settings.queueFolderPath, this.settings.queueFileName].join(
      "/"
    );
  }

  async onload() {
    LogTo.Console("Loading...");
    await this.loadConfig();
    this.addSettingTab(new IWSettingsTab(this.app, this));
    this.registerCommands();
    this.subscribeToEvents();
    this.createStatusBar();
    let queuePath = this.getDefaultQueuePath();
    this.queue = new Queue(this, queuePath);
    this.statusBar.updateCurrentQueue(queuePath);
  }

  async getSearchLeafView() {
    return this.app.workspace.getLeavesOfType("search")[0]?.view;
  }

  async getFound() {
    const view = await this.getSearchLeafView();
    if (!view) {
      LogTo.Console("Failed to get search leaf view.");
      return [];
    }
    // @ts-ignore
    return Array.from(view.dom.resultDomLookup.keys());
  }

  async addSearchButton() {
    const view = await this.getSearchLeafView();
    if (!view) {
      LogTo.Console("Failed to add button to the search pane.");
      return;
    }
    (<any>view).addToQueueButton = new ButtonComponent(
      view.containerEl.children[0].firstChild as HTMLElement
    )
      .setClass("nav-action-button")
      .setIcon("sheets-in-box")
      .setTooltip("Add to IW Queue")
      .onClick(async () => await this.addSearchResultsToQueue());
  }

  async getSearchResults(): Promise<TFile[]> {
    return (await this.getFound()) as TFile[];
  }

  async addSearchResultsToQueue() {
    let files = await this.getSearchResults();
    let links = files.map((file) => file.path);
    if (links) {
      new BulkAdderModal(this, this.queue.queuePath, links).open();
    } else {
      LogTo.Console("No files to add.", true);
    }
  }

  loadQueue(filePath: string) {
    if (filePath) {
      this.statusBar.updateCurrentQueue(filePath);
      this.queue = new Queue(this, filePath);
      LogTo.Console("Loaded Queue: " + filePath, true);
    } else {
      LogTo.Console("Failed to load queue: " + filePath, true);
    }
  }

  registerCommands() {
    //
    // Queue Browsing

    this.addCommand({
      id: "open-queue-current-pane",
      name: "Open queue in current pane.",
      callback: () => this.queue.goToQueue(false),
      hotkeys: [],
    });

    this.addCommand({
      id: "open-queue-new-pane",
      name: "Open queue in new pane.",
      callback: () => this.queue.goToQueue(true),
      hotkeys: [],
    });

    //
    // Repetitions

    this.addCommand({
      id: "current-iw-repetition",
      name: "Current repetition.",
      callback: () => this.queue.goToCurrentRep(),
      hotkeys: [],
    });

    this.addCommand({
      id: "dismiss-current-repetition",
      name: "Dismiss current repetition.",
      callback: () => this.queue.dismissCurrent(),
      hotkeys: [],
    });

    this.addCommand({
      id: "next-iw-repetition",
      name: "Next repetition.",
      callback: () => this.queue.nextRepetition(),
      hotkeys: [],
    });

    //
    // Element Adding.

    this.addCommand({
      id: "note-add-iw-queue",
      name: "Add note to queue.",
      checkCallback: (checking: boolean) => {
        if (this.files.getActiveNoteFile() != null) {
          if (!checking) {
            new ReviewNoteModal(this).open();
          }
          return true;
        }
        return false;
      },
    });

    this.addCommand({
      id: "fuzzy-note-add-iw-queue",
      name: "Add note to queue through a fuzzy finder",
      callback: () => new FuzzyNoteAdder(this).open(),
      hotkeys: [],
    });

    this.addCommand({
      id: "block-add-iw-queue",
      name: "Add block to queue.",
      checkCallback: (checking: boolean) => {
        if (this.files.getActiveNoteFile() != null) {
          if (!checking) {
            new ReviewBlockModal(this).open();
          }
          return true;
        }
        return false;
      },
      hotkeys: [],
    });

    this.addCommand({
      id: "add-links-within-note",
      name: "Add links within note to queue.",
      checkCallback: (checking: boolean) => {
        if (this.files.getActiveNoteFile() != null) {
          if (!checking) {
            let file = this.files.getActiveNoteFile();
            if (file) {
              let links = this.links.getLinksIn(file);
              if (links && links.length)
                new BulkAdderModal(this, this.queue.queuePath, links).open();
              else {
                LogTo.Console("No links in the current file.", true);
              }
            } else {
              LogTo.Console("Failed to get the active note.", true);
            }
          }
          return true;
        }
        return false;
      },
      hotkeys: [],
    });

    //
    // Queue Loading

    this.addCommand({
      id: "load-iw-queue",
      name: "Load a queue.",
      callback: () => {
        new QueueLoadModal(this).open();
      },
      hotkeys: [],
    });
  }

  createStatusBar() {
    this.statusBar = new StatusBar(this.addStatusBarItem(), this);
    this.statusBar.initStatusBar();
  }

  subscribeToEvents() {
    this.app.workspace.onLayoutReady(() => {
      this.addSearchButton();
    });

    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file, source: string) => {
        if (file === null) {
          return;
        }

        if (file instanceof TFile && file.extension === "md") {
          menu.addItem((item) => {
            item
              .setTitle(`Add File to IW Queue`)
              .setIcon("sheets-in-box")
              .onClick((evt) => {
                new ReviewFileModal(this, file.path).open();
              });
          });
        } else if (file instanceof TFolder) {
          menu.addItem((item) => {
            item
              .setTitle(`Add Folder to IW Queue`)
              .setIcon("sheets-in-box")
              .onClick((evt) => {
                let files = this.app.vault
                  .getMarkdownFiles()
                  .filter((f) => this.files.isDescendantOf(f, file))
                  .map((f) => f.path);

                if (files) {
                  new BulkAdderModal(this, this.queue.queuePath, files).open();
                } else LogTo.Console("Folder contains no files!", true);
              });
          });
        }
      })
    );
  }

  async removeSearchButton() {
    let searchView = await this.getSearchLeafView();
    let btn = (<any>searchView)?.addToQueueButton;
    if (btn) {
      btn.buttonEl?.remove();
      btn = null;
    }
  }

  async onunload() {
    LogTo.Console("Disabled and unloaded.");
    await this.removeSearchButton();
  }
}
