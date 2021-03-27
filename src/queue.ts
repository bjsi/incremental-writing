import { MarkdownTable, MarkdownTableRow } from "./markdown"
import { TFile,  App, MarkdownView } from "obsidian"
import { LogTo } from "./logger"
import { AFactorScheduler } from "./scheduler"
import { IWSettings } from "./settings"
import { StatusBar } from "./views/status-bar"


abstract class QueueBase {

    defaultHeader = 
`| Link | Priority | Notes | A-Factor | Interval | Last Rep |
|------|----------|-------|----------|----------|----------|`

}

export class Queue extends QueueBase {
    
    app: App
    scheduler: AFactorScheduler
    settings: IWSettings
    statusBar: StatusBar
    
    constructor(app: App, settings: IWSettings, statusBar: StatusBar) {
        super();
        this.app = app;
        // this.statusBar = statusBar;
        this.settings = settings;
        this.scheduler = new AFactorScheduler();
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

    async dismissCurrent() {

        // Gets sorted in here
        let table = await this.loadTable();

        if (!table.rows){
            LogTo.Debug("No repetitions!", true);
            return;
        }
        
        let curRep = table.rows[0];
        if (!curRep.isDue()) {
            LogTo.Debug("No due repetition to dismiss.", true);
            return
        }

        table.rows = table.rows.slice(1);
        LogTo.Console("Dismissed repetition: " + this.getLinkWithoutBrackets(curRep.link), true);
        await this.writeQueueTable(table);
    }

    getLinkWithoutBrackets(noteLink: string) {
        return noteLink.substr(2, noteLink.length - 4);
    }

    async loadTable(): Promise<MarkdownTable> {
        let text: string = await this.readQueue();
        if (!text) {
            LogTo.Debug("Failed to load queue table.", true);
            return;
        }

        let table = new MarkdownTable(text);
        table.sortByPriority();
        table.sortByDue();

        return table;
    }

    async goToRep(current: boolean) {
        let table = await this.loadTable();
        if (current)
            this.goToCurrentRep(table);
        else
            this.nextRepetition(table);
    }

    async goToCurrentRep(table: MarkdownTable) {
        let currentRep = table.rows[0];
        await this.loadRep(currentRep);
        // this.updateStatusBar;
    }

    async nextRepetition(table: MarkdownTable) {
        let currentRep = table.rows[0];
        let nextRep = table.rows[1];

        let repToLoad;

        if (currentRep && nextRep ) {
            table.rows = table.rows.slice(1)
            repToLoad = nextRep
            
        }
        else {
            table.rows.pop();
            repToLoad = currentRep;
        }
        
        this.scheduler.schedule(table, currentRep);

        if (repToLoad.isDue()){
            await this.loadRep(repToLoad);
            // this.updateStatusBar(table);
        }
        else{
            LogTo.Debug("No more repetitions!", true);
        }

        await this.writeQueueTable(table);
    }

    // TODO: Don't use table, it will already have been updated
    updateStatusBar(table: MarkdownTable){
        this.statusBar.updateReps(table.rows.length);
        this.statusBar.updateCurrentRep(table.rows[0]);
    }

    private async loadRep(repToLoad: MarkdownTableRow){
        if (!repToLoad){
            LogTo.Console("Failed to load repetition.", true);
            return;
        }

        let linkPath = this.getLinkWithoutBrackets(repToLoad.link);
        LogTo.Console("Loading repetition: " + linkPath, true);
        await this.app.workspace.openLinkText(linkPath, '', false, { active: true  });
    }

    getActiveNoteFile() {
	  return (this.app.workspace.activeLeaf.view as MarkdownView).file;
    }

    isDuplicate(table: MarkdownTable, link: string): boolean {
        let formattedLink = this.formatLink(link);
        return (table.rows.some(r => r.link === formattedLink));
    }

    async addToQueue(priority: string, notes: string, block?: string) {

        let text = await this.readQueue() ?? await this.createAndReadQueue();
        if (!text){
            LogTo.Console("Failed to add to queue. Failed to read queue. Failed to create queue.", true);
            return;
        }

        notes = notes.replace(/(\r\n|\n|\r)/gm, "");

        let file: TFile = this.getActiveNoteFile();
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

        if (this.isDuplicate(table, noteLink)){
            LogTo.Console("Already in your queue!", true);
            return;
        }

        let row = new MarkdownTableRow(this.formatLink(noteLink), priority, notes, this.settings.defaultAFactor.toString(), this.settings.defaultInterval.toString());
        table.addRow(row);
        LogTo.Console("Added note to queue: " + noteLink, true);
        await this.writeQueueTable(table);
    }

    async addBlockToQueue(priority: string, notes: string, block: string, activeNoteFile: TFile, table: MarkdownTable) {
        LogTo.Debug("Add block to queue")
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

        if (this.isDuplicate(table, noteLink)){
            LogTo.Console("Already in your queue!", true);
            return;
        }

        table.addRow(new MarkdownTableRow(this.formatLink(noteLink), priority, notes, this.settings.defaultAFactor.toString(), this.settings.defaultInterval.toString()));
        LogTo.Console("Added block to queue: " + noteLink, true);
        await this.writeQueueTable(table);
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
    await this.app.vault.modify(queue, table.toString()); // TODO: Remember to sort
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

  queueFullPath() {
      let folder = this.settings.queueFolderPath;
      let file = this.settings.queueFilePath;
      return [folder, file].join("/");
  }

  async createDefaultQueue(): Promise<TFile> {
      LogTo.Debug("Creating default queue " + this.queueFullPath());
      let folder = this.settings.queueFolderPath;
      await this.app.vault.createFolder(folder);
      return await this.app.vault.create(this.queueFullPath(), this.defaultHeader);
  }

  getQueue(): TFile {
      return this.app.vault.getFiles().filter(f => f.path === this.queueFullPath())[0];
  }
}
