import { TFolder, normalizePath, Plugin, TFile, ButtonComponent } from "obsidian";
import { Queue } from "./queue"
import { LogTo } from "./logger"
import { ReviewFileModal, ReviewNoteModal, ReviewBlockModal } from "./views/modals"
import { IWSettings, DefaultSettings } from "./settings"
import { IWSettingsTab } from "./views/settings-tab"
import { StatusBar } from "./views/status-bar"
import { QueueLoadModal } from "./views/queue-modal"
import { LinkUtils } from "./helpers/link-utils"
import { FileUtils } from "./helpers/file-utils"
import { BulkAdderModal } from "./views/bulk-adding"
import { BlockUtils } from "./helpers/block-utils"
import { FuzzyNoteAdder } from "./views/fuzzy-note-adder"


export default class IW extends Plugin {
 
  settings: IWSettings;
  statusBar: StatusBar
  queue: Queue;

  //
  // Utils

  links: LinkUtils = new LinkUtils(this.app);
  files: FileUtils = new FileUtils(this.app);
  blocks: BlockUtils = new BlockUtils(this.app);

  async loadConfig() {
    this.settings = (await this.loadData()) || new DefaultSettings();
    this.addSettingTab(new IWSettingsTab(this.app, this));
  }

  getDefaultQueuePath() {
    return [this.settings.queueFolderPath, this.settings.queueFilePath].join("/")
  }

  async onload() {
    LogTo.Console("Loading...");
    await this.loadConfig();
    this.registerCommands();
    this.subscribeToEvents();
    this.createStatusBar();
    this.queue = new Queue(this, this.getDefaultQueuePath());
  }

  async getFound() {
    const searchLeaf = this.app.workspace.getLeavesOfType('search')[0];
    const view = await searchLeaf.open(searchLeaf.view);
	// @ts-ignore
	return Array.from(view.dom.resultDomLookup.keys());
  }

  async addSearchButton() {
    const searchLeaf = this.app.workspace.getLeavesOfType('search')[0];
    const view = await searchLeaf.open(searchLeaf.view);
    let btn = (<any>view).addToQueueButton;

    if (!btn){
        (<any>view).addToQueueButton = new ButtonComponent(view.containerEl.children[0].firstChild as HTMLElement)
            .setClass("nav-action-button")
            .setIcon("sheets-in-box")
            .setTooltip("Add to IW Queue")
            .setDisabled(false)
            .onClick(async () => await this.addSearchResultsToQueue())
    }
  }

  async getSearchResults(): Promise<TFile[]> {
    return await this.getFound() as TFile[];
  }

  async addSearchResultsToQueue() {
      let files = await this.getSearchResults();
      let links = files.map(file => file.path);
      if (files) {
          new BulkAdderModal(this, this.queue.filePath, links).open();
      }
      else {
          LogTo.Console("No files to add.", true);
      }
  }

  registerCommands() {

    //
    // Queue Browsing

    this.addCommand({
        id: 'open-queue-current-pane',
        name: 'Open queue in current pane.',
        checkCallback: (checking: boolean) => {
            let leaf = this.app.workspace.activeLeaf;
            if (leaf) {
                if (!checking) {
                    this.queue.goToQueue(false);
                }
                return true;
            }
            return false;
        }
    });

    this.addCommand({
        id: 'open-queue-new-pane',
        name: 'Open queue in new pane.',
        checkCallback: (checking: boolean) => {
            let leaf = this.app.workspace.activeLeaf;
            if (leaf) {
                if (!checking) {
                    this.queue.goToQueue(true);
                }
                return true;
            }
            return false;
        }
    });

    //
    // Repetitions

    this.addCommand({
        id: 'current-iw-repetition',
        name: 'Current repetition.',
		checkCallback: (checking: boolean) => {
            let leaf = this.app.workspace.activeLeaf;
            if (leaf) {
                if (!checking) {
                    this.queue.goToCurrentRep();
                }
                return true;
            }
            return false;
        }
    });

    this.addCommand({
        id: 'dismiss-current-repetition',
        name: 'Dismiss current repetition.',
        checkCallback: (checking: boolean) => {
            let leaf = this.app.workspace.activeLeaf;
            if (leaf) {
                if (!checking) {
                    this.queue.dismissCurrent();
                }
                return true;
            }
            return false;
        }
    });


	this.addCommand({
		id: 'next-iw-repetition',
		name: 'Next repetition.',
		checkCallback: (checking: boolean) => {
            let leaf = this.app.workspace.activeLeaf;
            if (leaf) {
                if (!checking) {
                    this.queue.nextRepetition();
                }
                return true;
            }
            return false;
        }
	});
    
    // 
    // Element Adding.

	this.addCommand({
		id: 'note-add-iw-queue',
		name: 'Add note to queue.',
		checkCallback: (checking: boolean) => {
			let leaf = this.app.workspace.activeLeaf;
			if (leaf) {
				if (!checking) {
                        new ReviewNoteModal(this).open();
				}
				return true;
			}
			return false;
		}
	});

    this.addCommand({
        id: 'fuzzy-note-add-iw-queue',
        name: 'Add note to queue through a fuzzy finder',
		checkCallback: (checking: boolean) => {
			let leaf = this.app.workspace.activeLeaf;
			if (leaf) {
				if (!checking) {
					new FuzzyNoteAdder(this).open();
				}
				return true;
			}
			return false;
		}
    })

	this.addCommand({
		id: 'block-add-iw-queue',
		name: 'Add block to queue.',
		checkCallback: (checking: boolean) => {
			let leaf = this.app.workspace.activeLeaf;
			if (leaf) {
				if (!checking) {
					new ReviewBlockModal(this).open();
				}
				return true;
			}
			return false;
		}
	});

    this.addCommand({
        id: 'add-links-within-note',
        name: 'Add links within note to queue.',
        checkCallback: (checking: boolean) => {
            let leaf = this.app.workspace.activeLeaf;
            if (leaf) {
                if (!checking) {
                    let file = this.files.getActiveNoteFile();
                    if (file) {
                        let links = this.links.getLinksIn(file);
                        new BulkAdderModal(this, this.queue.filePath, links).open();
                    }
                }
                return true;
            }
            return false;
        }
    })
    
    //
    // Queue Loading

    this.addCommand({
        id: 'load-iw-queue',
        name: 'Load a queue.',
        checkCallback: (checking: boolean) => {
            let leaf = this.app.workspace.activeLeaf;
            if (leaf) {
                if (!checking) {
                    new QueueLoadModal(this).open();
                }
                return true;
            }
            return false;
        }
    });
  }

  createStatusBar() {
    this.statusBar = new StatusBar(this.addStatusBarItem());
    this.statusBar.initStatusBar();
  }

  subscribeToEvents() {
      this.app.workspace.onLayoutReady(() => {
          this.addSearchButton();
      });

      this.registerEvent(
          this.app.workspace.on('file-menu', (menu, file, source: string) => {
              if (file === null) {
                  return;
              }

              if (file instanceof TFile && file.extension === "md") {
                  menu.addItem((item) => {
                      item.setTitle(`Add File to IW Queue`).setIcon('sheets-in-box')
                          .onClick((evt) => {
                              new ReviewFileModal(this, file.path).open();
                          });
                  });
              }
              else if (file instanceof TFolder) {
                  menu.addItem((item) => {
                      item.setTitle(`Add Folder to IW Queue`).setIcon('sheets-in-box')
                          .onClick((evt) => {
                              let files = this.app.vault.getMarkdownFiles()
                                .filter(f => this.files.isDescendantOf(f, file))
                                .map(f => f.path);

                                if (files){
                                    new BulkAdderModal(this, this.queue.filePath, files).open();
                                }
                              else 
                                  LogTo.Console("Folder contains no files!", true);
                          });
                  });
              }
          }));
  }

  onunload() {
    LogTo.Console("Disabled and unloaded.");
  }
}
