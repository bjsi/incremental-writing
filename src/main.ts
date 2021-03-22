import { OpenViewState, Setting, PluginSettingTab, App, Plugin, Modal, ButtonComponent, Notice, TextComponent, SliderComponent,  MarkdownView, TFile  } from "obsidian";
import { IW_QUEUE_FILE, IW_QUEUE_FOLDER } from './constants';


export default class IW extends Plugin {
 
  settings: MyPluginSettings;
  queuePath: string = IW_QUEUE_FOLDER + "/" + IW_QUEUE_FILE;
  defaultHeader: MarkdownTableRow[] = 
      [
      new MarkdownTableRow("Link", "Priority", "Notes"),
      new MarkdownTableRow("-----", "-----", "-----")
  ]

  async onload() {
    console.log("Loading the incremental writing plugin.");

    // This snippet of code is used to load pluging settings from disk (if any)
    // and then add the setting tab in the Obsidian Settings panel.
    // If your plugin does not use settings, you can delete these two lines.
    this.settings = (await this.loadData()) || {
      vimMode: false,
      defaultPriority: 30,
    };

    this.addSettingTab(new MyPluginSettingsTab(this.app, this));

    this.addCommand({
        id: 'open-queue-current-pane',
        name: 'Open queue in current pane (IW)',

        checkCallback: (checking: boolean) => {
            let leaf = this.app.workspace.activeLeaf;
            if (leaf) {
                if (!checking) {
                    this.openQueue(false);
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
                    this.openQueue(true);
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
                    this.learn();
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
                    this.nextRepetition();
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

  async openQueue(newLeaf: boolean) {
      let queue = this.getQueueFile();
      if (!queue){
          console.debug("Failed to open queue because it does not exist");
          return;
      }
      let linkText = this.app.metadataCache.fileToLinktext(queue, "");
      await this.app.workspace.openLinkText(linkText, "", newLeaf);
  }

  async createIWQueueIfNotExists(rows: MarkdownTableRow[]){
      let queueFile = this.getQueueFile();
      if (!queueFile){
          console.debug("Creating IW queue file with path " + this.queuePath);
          await this.app.vault.createFolder(IW_QUEUE_FOLDER);
          let table = new MarkdownTable();
          table.header = this.defaultHeader;
          console.debug("header: " + table.header);
          table.rows = rows;
          console.debug("rows: " + table.rows);
          await this.app.vault.create(this.queuePath, table.sortByPriority().toString());
      }
  }

  getQueueFile(): TFile {
    return this.app.vault.getFiles().filter(e => e.path === this.queuePath)[0];
  }

  nextRepetition() {
      let queueFile = this.getQueueFile();
      if (!queueFile)
      {
          console.debug("Queue File does not exist");
          return;
      }
        
      console.debug("Opening " + queueFile.path + " to find next repetition");
      this.app.vault.read(queueFile).then(async (result) => {
          console.log("Previous Queue text:\n" + result);
          if (result === ""){
              console.debug("No incremental writing repetitions outstanding.");
              return;
          }
          else {
              let table = new MarkdownTable(result);
              let next = table.rows[1];
              if (!next){
                  console.debug("No incremental writing repetitions outstanding.");
                  return;
              }
              table.rows = table.rows.slice(1);
              console.debug("Updated incremental writing queue");
              await this.app.vault.modify(queueFile, table.sortByPriority().toString());
              let linkPath = next.link.substr(2, next.link.length - 4);
              console.debug("Loading next repetition: " + linkPath);
              await this.app.workspace.openLinkText(linkPath, '', false, { active: true  });
          }
      });
  }

  // Loads the current rep like SM
  learn(){
      let queueFile = this.getQueueFile();
      if (!queueFile)
      {
          console.debug("Queue File does not exist");
          return;
      }
        
      console.debug("Opening " + queueFile.path + " to find current repetition");
      this.app.vault.read(queueFile).then(async (result) => {
          console.log("Previous Queue text:\n" + result);
          if (result === ""){
              console.debug("No incremental writing repetitions outstanding.");
              return;
          }
          else {
              let table = new MarkdownTable(result);
              let curRep = table.rows[0];
              console.debug(curRep);
              let linkPath = curRep.link.substr(2, curRep.link.length - 4);
              console.debug("Loading next repetition: " + linkPath);
              await this.app.workspace.openLinkText(linkPath, '', false, { active: true  });
          }
      });
  }

  onunload() {
    console.log("The incremental writing plugin has been disabled and unloaded");
  }

  createBlockHash(inputText: string): string { // Credit to https://stackoverflow.com/a/1349426
      let result = '';
      var characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
      var charactersLength = characters.length;
      for ( var i = 0; i < 7; i++ ) {
          result += characters.charAt(Math.floor(Math.random() * charactersLength));
      }
      return result;
  }

  getBlock(inputLine: string, noteFile: TFile): string { //Returns the string of a block ID if block is found, or "" if not.
      let obsidianApp = this.app;
      let noteBlocks = obsidianApp.metadataCache.getFileCache(noteFile).blocks;
      console.log("Checking if line '" + inputLine + "' is a block.");
      let blockString = "";
      if (noteBlocks) { // the file does contain blocks. If not, return ""
          for (let eachBlock in noteBlocks) { // iterate through the blocks. 
              console.log("Checking block ^" + eachBlock);
              let blockRegExp = new RegExp("(" + eachBlock + ")$", "gim");
              if (inputLine.match(blockRegExp)) { // if end of inputLine matches block, return it
                  blockString = eachBlock;
                  console.log("Found block ^" + blockString);
                  return blockString;
              } 
          }
          return blockString;
      } 
      return blockString;
  }

  addToOutstanding = async (priority: string, notes: string, block?: string) => {

	  let noteName = this.app.workspace.activeLeaf.getDisplayText();
	  let noteFile = (this.app.workspace.activeLeaf.view as MarkdownView).file;
	  let noteLink = this.app.metadataCache.fileToLinktext(noteFile, noteFile.path, true);
        
      notes = notes.trim();

	  if (block != undefined) {
		  console.log("Checking for block:");
		  let lineBlockID = this.getBlock(block, noteFile);
		  console.debug(lineBlockID);

          // TODO: Rewrite this...

		  if (this.getBlock(block, noteFile) === "") { // The line is not already a block
			  console.debug("This line is not currently a block. Adding a block ID.");
			  lineBlockID = this.createBlockHash(block).toString();
			  let lineWithBlock = block + " ^" + lineBlockID;
			  this.app.vault.read(noteFile).then( async (result) => {
				  let previousNoteText = result;
				  let newNoteText = previousNoteText.replace(block, lineWithBlock);
				  await this.app.vault.modify(noteFile, newNoteText);
			  })
		  }
		  noteLink = noteLink + "#^" + lineBlockID;
      }

      let queueFile = this.getQueueFile();
	  if (!queueFile){
		  console.debug("The incremental writing queue file does not exist. Creating now.");
		  let noteText = "[[" + noteLink + "]]";
          let rowArr: MarkdownTableRow[] = [];
          rowArr.push(new MarkdownTableRow(noteText, priority, notes));
          await this.createIWQueueIfNotExists(rowArr);
		  new Notice("Added note \"" + noteName + "\" to a new incremental writing queue");
	  }
	  else {
		  console.debug("The IW queue file already exists.")
		  this.app.vault.read(queueFile).then( async (result) => {
              console.log("Previous queue text:\n" + result);

              let newNoteText = result;
              if (result === ""){
                  let table = new MarkdownTable();
                  table.header = this.defaultHeader;
                  table.rows.push(new MarkdownTableRow("[[" + noteLink + "]]", priority, notes));
                  newNoteText = table.sortByPriority().toString();
              }
              else {
                  let table = new MarkdownTable(result);
                  table.rows.push(new MarkdownTableRow("[[" + noteLink + "]]", priority, notes));
                  newNoteText = table.sortByPriority().toString();
              }
              console.log("New queue text:\n" + newNoteText);

              // TODO:
              await this.app.vault.modify(queueFile, newNoteText);
              new Notice("Added note \"" + noteName + "\" to the incremental writing queue");
		  });
	  }		
    }
}

class MarkdownTableUtils {

    static parseRows(arr: string[]): MarkdownTableRow[] {
        return arr.map((v, i, a) => this.parseRow(v))
    }

    static parseRow(text: string): MarkdownTableRow {
        // remove leading and trailing |
        let arr = text.substr(1, text.length - 1).split("|").map(r => r.trim())
        return new MarkdownTableRow(arr[0], arr[1], arr[2]);
    }
}

class MarkdownTable {
    
    header: MarkdownTableRow[] = [];
    rows: MarkdownTableRow[] = [];

    constructor(text?: string) {
        if (text) {
            let split = text.split("\n");
            this.header = MarkdownTableUtils.parseRows(split.slice(0, 2));
            this.rows = MarkdownTableUtils.parseRows(split.slice(2));
        }
    }


    sort(compareFn: (a: MarkdownTableRow, b: MarkdownTableRow) => number){
        this.rows = this.rows.sort(compareFn);
    }

    sortByPriority(){
        this.sort((a, b) => {
            let fst = +(a.priority);
            let snd = +(b.priority);
            if (fst > snd)
                return 1;
            else if (fst == snd)
                return 0;
            else if (fst < snd)
                return -1;
        });

        return this;
    }

    toString() {
        let table = this.header.join("\n") + "\n";
        table += this.rows.join("\n");
        return table;
    }
}

class MarkdownTableRow {

    link: string
    priority: string
    notes: string

    constructor(link: string, priority: string, notes: string){
        this.link = link;
        this.priority = priority;
        this.notes = notes;
    }

    toString() {
        return `| ${this.link} | ${this.priority} | ${this.notes} |`
    }
}

abstract class ReviewModal extends Modal {

    plugin: IW;
    title: string
    inputSlider: SliderComponent
    inputNoteField: TextComponent

    constructor(app: App, plugin: IW, title: string){
        super(app);
        this.plugin = plugin;
        this.title = title;
    }


    onOpen(){
        let { contentEl  } = this;

        contentEl.appendText(this.title);

        contentEl.createEl("br");
        contentEl.createEl("br");

        contentEl.appendText("Priority:");
        this.inputSlider = new SliderComponent(contentEl)
            .setLimits(0, 100, 1)
            .setValue(this.plugin.settings.defaultPriority);
        contentEl.createEl("br");

        this.inputNoteField = new TextComponent(contentEl).setPlaceholder("Notes");
        contentEl.createEl("br");

        let inputButton = new ButtonComponent(contentEl)
            .setButtonText("Add to IW Queue")
            .onClick(async () => {
                await this.addToOutstanding();
                this.close()
            });

        this.inputNoteField.inputEl.focus();
        this.inputNoteField.inputEl.addEventListener('keypress', async (keypressed) => {
            if (keypressed.key === 'Enter') {
                await this.addToOutstanding()
                this.close();
            }
            else if (keypressed.key === "Pagedown"){
                let curValue = this.inputSlider.getValue();
                if (curValue < 95)
                    this.inputSlider.setValue(curValue + 5);
                else
                    this.inputSlider.setValue(100);
            }
            else if (keypressed.key === "Pageup"){
                let curValue = this.inputSlider.getValue();
                if (curValue > 5)
                    this.inputSlider.setValue(curValue - 5);
                else
                    this.inputSlider.setValue(0);
            }
        });
    }

    abstract addToOutstanding(): Promise<void>;

    onClose() {
        let { contentEl  } = this;
        contentEl.empty();
    }
}

class ReviewNoteModal extends ReviewModal {

    constructor(app: App, plugin: IW){
        super(app, plugin, "Add Note to Outstanding IW Queue?");
    }

    onOpen() {
        super.onOpen();
    }

    async addToOutstanding(){
        await this.plugin.addToOutstanding(this.inputSlider.getValue().toString(), this.inputNoteField.getValue());
    }
}

class ReviewBlockModal extends ReviewModal {

    constructor(app: App, plugin: IW){
        super(app, plugin, "Add Block to Outstanding IW Queue?");
    }

    onOpen(){
        super.onOpen();
    }

    async addToOutstanding() {
        let editor = (this.app.workspace.activeLeaf.view as MarkdownView).editor;
        let cursor = editor.getCursor();
        let lineNo = cursor.line;

        if (this.plugin.settings.vimMode)
            lineNo += 1; // TODO: Bug where ctrl + p moves the cursor up one line?
        let lineText = editor.getLine(lineNo);
        await this.plugin.addToOutstanding(this.inputSlider.getValue().toString(), this.inputNoteField.getValue(), lineText);
    }

    onClose() {
        let { contentEl  } = this;
        contentEl.empty();
    }
}

/**
 * This is a data class that contains your plugin configurations. You can edit it
 * as you wish by adding fields and all the data you need.
 */
interface MyPluginSettings {
    vimMode: boolean
	defaultPriority: number
}

class MyPluginSettingsTab extends PluginSettingTab {
  plugin: IW;

  constructor(app: App, plugin: IW) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    const settings = this.plugin.settings;
    containerEl.createEl('h2', {text: 'Settings for Incremental Writing'});
    new Setting(containerEl)
      .setName("Using Vim Mode?")
      .setDesc("Toggle on if using vim mode.")
      .addToggle((tc) => {
          tc.setValue(settings.vimMode).onChange((value) => {
              settings.vimMode = value;
              this.plugin.saveData(settings);
          });
      });

      new Setting(containerEl)
      .setName("Default Priority")
      .setDesc("Default priority for new new repetitions.")
      .addText((text) => {
          text.setValue(String(settings.defaultPriority)).onChange((value) => {
              let num = Number(value);
              if (!isNaN(num)) {
                  if (num < 0 || num > 100){
                      return;
                  }
                  settings.defaultPriority = Number(value);
                  this.plugin.saveData(settings);
              }
          });
      });
  }
}
