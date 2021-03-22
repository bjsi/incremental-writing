import { MarkdownTable, MarkdownTableRow } from "./markdown"
import { TFile,  App, MarkdownView } from "obsidian"
import { LogTo } from "./logger"
import { SimpleScheduler } from "./scheduler"
import { MyPluginSettings } from "./settings"


abstract class QueueBase {

    protected defaultHeader: MarkdownTableRow[] = 
        [
        new MarkdownTableRow("Link", "Priority", "Notes"),
        new MarkdownTableRow("-----", "-----", "-----"),
    ];

    defaultHeaderText(): string {
        return this.defaultHeader.join("\n");
    }

    protected defaultTable: MarkdownTable

    constructor() {
        this.defaultTable = new MarkdownTable();
        this.defaultTable.header = this.defaultHeader;
    }
}

export class Queue extends QueueBase {
    
    app: App
    scheduler: SimpleScheduler
    settings: MyPluginSettings
    
    constructor(app: App, settings: MyPluginSettings) {
        super();
        this.app = app;
        this.settings = settings;
        this.scheduler = new SimpleScheduler();
    }

    async goToQueue(newLeaf: boolean) {
        let queue: TFile = this.getQueue() ?? await this.createDefaultQueue();
        if (!queue){
            LogTo.Console("Failed to go to queue. Failed to create queue.", true);
            return;
        }

        let linkText = this.app.metadataCache.fileToLinktext(queue, "");
        LogTo.Debug("Going to queue " + linkText);
        await this.app.workspace.openLinkText(linkText, "", newLeaf);
    }

    getLinkWithoutBrackets(noteLink: string) {
        return noteLink.substr(2, noteLink.link.length - 4);
    }

    async goToRep(current: boolean) {
        let text: string = await this.readQueue();
        if (!text || text === this.defaultHeaderText()) {
            LogTo.Debug("Failed to load repetition.", true);
            return;
        }

        // TODO: check parse
        let table = new MarkdownTable(text);
        if (current)
            this.goToCurrentRep(table);
        else
            this.nextRepetition(table);
        
    }

    async goToCurrentRep(table: MarkdownTable) {
        let currentRep = table.rows[0];
        if (!currentRep){
            LogTo.Debug("Failed to go to the current repetition.", true);
            return;
        }

        let linkPath = this.getLinkWithoutBrackets(currentRep.link)
        LogTo.Console("Loading repetition: " + linkPath)
        await this.app.workspace.openLinkText(linkPath, '', false, { active: true  });
    }

    async nextRepetition(table: MarkdownTable) {
        let currentRep = table.rows[0];
        if (table.rows.length == 1){
            table.rows.pop();
            this.scheduler.schedule(table, currentRep);
            LogTo.Console("No more repetitions.", true);
            return;
        }

        table.rows = table.rows.slice(1);
        let nextRep = table.rows[0];
        let linkPath = this.getLinkWithoutBrackets(nextRep.link);
        LogTo.Console("Loading repetition: " + linkPath)
        await this.app.workspace.openLinkText(linkPath, '', false, { active: true  });
    }

    getActiveNoteFile() {
	  return (this.app.workspace.activeLeaf.view as MarkdownView).file;
    }

    async addToQueue(priority: string, notes: string, block?: string) {

        // TODO: Create if not exists

        let text = await this.readQueue() ?? await this.createAndReadQueue();
        if (!text){
            LogTo.Console("Failed to add to queue. Failed to read queue. Failed to create queue.", true);
            return;
        }

        let file: TFile = this.getActiveNoteFile();
        notes = notes.replace(/(\r\n|\n|\r)/gm, "");

        // TODO Check table 
        let table = new MarkdownTable(text);

        if (block)
            this.addBlockToQueue(priority, notes, block, file, table);
        else
            this.addNoteToQueue(priority, notes, file, table);
    }

    formatLink(noteLink: string) {
        return "[[" + noteLink + "]]";
    }

    async addNoteToQueue(priority: string, notes: string, activeNoteFile: TFile, table: MarkdownTable) {
        let noteLink = this.app.metadataCache.fileToLinktext(activeNoteFile, activeNoteFile.path, true);
        table.addRow(new MarkdownTableRow(this.formatLink(noteLink), priority, notes));
        this.writeQueueTable(table);
    }

    async addBlockToQueue(priority: string, notes: string, block: string, activeNoteFile: TFile, table: MarkdownTable) {
        let noteLink = this.app.metadataCache.fileToLinktext(activeNoteFile, activeNoteFile.path, true);
        let lineBlockId = this.getBlock(block, activeNoteFile);

        if (lineBlockId === "") { // The line is not already a block
            console.debug("This line is not currently a block. Adding a block ID.");
            lineBlockId = this.createBlockHash();
            let lineWithBlock = block + " ^" + lineBlockId;

            // TODO: Switch to using line numbers?
            let oldText = await this.app.vault.read(activeNoteFile)
            let newNoteText = oldText.replace(block, lineWithBlock);
            await this.app.vault.modify(activeNoteFile, newNoteText);
        }

        noteLink = noteLink + "#^" + lineBlockId;
        table.addRow(new MarkdownTableRow(this.formatLink(noteLink), priority, notes));
        this.writeQueueTable(table);
    }

  // TODO: Rewrite
  getBlock(inputLine: string, noteFile: TFile): string { //Returns the string of a block ID if block is found, or "" if not.
      let noteBlocks = this.app.metadataCache.getFileCache(noteFile).blocks;
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

  createBlockHash(): string { 
      // Credit to https://stackoverflow.com/a/1349426
      let result = '';
      var characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
      var charactersLength = characters.length;
      for ( var i = 0; i < 7; i++ ) {
          result += characters.charAt(Math.floor(Math.random() * charactersLength));
      }
      return result;
  }

  async writeQueueTable(table: MarkdownTable): Promise<void> {
    let queue = this.getQueue();
    await this.app.vault.modify(queue, table.sortByPriority().toString()); // TODO: Remember to sort
  }

  async readQueue(): Promise<string> {
      let queue = this.getQueue();
      if (!queue)
          return;

      LogTo.Debug("Reading queue" + queue.path);
      return await this.app.vault.read(queue);
  }

  async createAndReadQueue(): Promise<string> {
      await this.createDefaultQueue();
      return await this.readQueue();
  }

    trimChar(s: string, charToRemove: string) {
      while(s.charAt(0)==charToRemove) {
          s = s.substring(1);

      }

      while(s.charAt(s.length-1)==charToRemove) {
          s = s.substring(0,s.length-1);
      }

      return s;
  }

  queueFullPath() {
      let folder = this.settings.queueFolderPath;
      let file = this.settings.queueFilePath;
      return [folder, file].join("/");
  }

  async createDefaultQueue(): Promise<TFile> {
      LogTo.Debug("Creating default queue " + this.queueFullPath());
      let folder = this.settings.queueFolderPath;
      await this.app.vault.createFolder(folder);
      let defaultQueue = this.defaultTable.toString();
      return await this.app.vault.create(this.queueFullPath(), defaultQueue);
  }

  getQueue(): TFile {
      return this.app.vault.getFiles().filter(f => f.path === this.queueFullPath())[0];
  }
}
