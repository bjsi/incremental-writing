import { Plugin } from "obsidian";
import { Queue } from "./queue"
import { LogTo } from "./logger"
import { ReviewNoteModal, ReviewBlockModal } from "./views/modals"
import { IWSettings, DefaultSettings } from "./settings"
import { IWSettingsTab } from "./views/settings-tab"
import { StatusBar } from "./views/status-bar"


export default class IW extends Plugin {
 
  settings: IWSettings;
  statusBar: StatusBar
  queue: Queue;

  async loadConfig(){
    this.settings = (await this.loadData()) || new DefaultSettings();
    this.addSettingTab(new IWSettingsTab(this.app, this));
  }

  registerCommands() {

    this.addCommand({
        id: 'open-queue-current-pane',
        name: 'Open queue in current pane (IW)',

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
        id: 'dismiss-current-repetition',
        name: 'Dismiss current repetition (IW)',

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
        id: 'open-queue-new-pane',
        name: 'Open queue in new pane (IW)',

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

    this.addCommand({
        id: 'current-iw-repetition',
        name: 'Current repetition (IW)',

		checkCallback: (checking: boolean) => {
            let leaf = this.app.workspace.activeLeaf;
            if (leaf) {
                if (!checking) {
                    this.queue.goToRep(true);
                }
                return true;
            }
            return false;
        }
    });

	this.addCommand({
		id: 'next-iw-repetition',
		name: 'Next repetition (IW)',

		checkCallback: (checking: boolean) => {
            let leaf = this.app.workspace.activeLeaf;
            if (leaf) {
                if (!checking) {
                    this.queue.goToRep(false);
                }
                return true;
            }
            return false;
        }
	});

	this.addCommand({
		id: 'note-add-iw-queue',
		name: 'Add note to queue (IW)',

		checkCallback: (checking: boolean) => {
			let leaf = this.app.workspace.activeLeaf;
			if (leaf) {
				if (!checking) {
					new ReviewNoteModal(this.app, this).open();
				}
				return true;
			}
			return false;
		}
	});

	this.addCommand({
		id: 'block-add-iw-queue',
		name: 'Add block to queue (IW)',

		checkCallback: (checking: boolean) => {
			let leaf = this.app.workspace.activeLeaf;
			if (leaf) {
				if (!checking) {
					new ReviewBlockModal(this.app, this).open();
				}
				return true;
			}
			return false;
		}
	});
  }

  async onload() {
    LogTo.Console("Loading...");
    await this.loadConfig();
    this.registerCommands();
    // this.statusBar = new StatusBar(this.addStatusBarItem());
    // this.statusBar.initStatusBar();
    this.queue = new Queue(this.app, this.settings, this.statusBar);
  }

  onunload() {
    LogTo.Console("Disabled and unloaded.");
  }
}
