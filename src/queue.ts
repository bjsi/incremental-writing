import { MarkdownTable, MarkdownTableRow } from "./markdown"
import { TFile } from "obsidian"
import { LogTo } from "./logger"
import { AFactorScheduler } from "./scheduler"
import IW from "./main"


abstract class QueueBase {
    
    scheduler: AFactorScheduler
    filePath: string
    plugin: IW
    defaultHeader = 
`| Link | Priority | Notes | A-Factor | Interval | Last Rep |
|------|----------|-------|----------|----------|----------|`

    constructor(plugin: IW, filePath: string){
        this.plugin = plugin
        this.filePath = filePath;
        this.scheduler = new AFactorScheduler();
    }
}

export class Queue extends QueueBase {
    
    constructor(plugin: IW, filePath: string) {
        super(plugin, filePath);
    }

    async goToQueue(newLeaf: boolean) {
        await this.plugin.files.createIfNotExists(this.filePath, this.defaultHeader);
        await this.plugin.files.goTo(this.filePath, newLeaf);
    }

    async dismissCurrent() {
        let table = await this.loadTable();
        if (!table.hasReps()){
            LogTo.Debug("No repetitions!", true);
            return;
        }
        
        let curRep = table.currentRep();
        if (!curRep.isDue()) {
            LogTo.Debug("No due repetition to dismiss.", true);
            return
        }

        table.removeCurrentRep();
        let link = this.plugin.links.removeBrackets(curRep.link)
        LogTo.Console("Dismissed repetition: " + link, true);
        await this.writeQueueTable(table);
    }

    async loadTable(): Promise<MarkdownTable> {
        let text: string = await this.readQueue();
        if (!text) {
            LogTo.Debug("Failed to load queue table.", true);
            return;
        }

        let table = new MarkdownTable(text);
        table.sortReps();
        return table;
    }

    async goToCurrentRep() {
        let table = await this.loadTable();
        if (!table.hasReps()) {
            LogTo.Console("No more repetitions!", true);
            return;
        }

        let currentRep = table.currentRep()
        await this.loadRep(currentRep);
        // this.updateStatusBar;
    }

    async nextRepetition() {
        let table = await this.loadTable();
        if (!table.hasReps()) {
            LogTo.Console("No more repetitions!", true);
            return;
        }

        let currentRep = table.currentRep();
        let nextRep = table.nextRep();

        let repToLoad;

        if (currentRep && nextRep) {
            table.removeCurrentRep();
            repToLoad = nextRep
        }
        else {
            table.removeCurrentRep();
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
        // this.plugin.statusBar.updateReps(table.rows.length);
        // this.plugin.statusBar.updateCurrentRep(table.rows[0]);
    }

    private async loadRep(repToLoad: MarkdownTableRow){
        if (!repToLoad){
            LogTo.Console("Failed to load repetition.", true);
            return;
        }

        let linkPath = this.plugin.links.removeBrackets(repToLoad.link);
        LogTo.Console("Loading repetition: " + linkPath, true);
        await this.plugin.app.workspace.openLinkText(linkPath, '', false, { active: true  });
    }

    isDuplicate(table: MarkdownTable, link: string): boolean {
        let formattedLink = this.plugin.links.addBrackets(link);
        return (table.getReps().some(r => r.link === formattedLink));
    }

    async addToQueue(priority: string, notes: string, date: string, file: TFile, block?: string) {

        notes = notes.replace(/(\r\n|\n|\r|\|)/gm, "");
        await this.plugin.files.createIfNotExists(this.filePath, this.defaultHeader);
        let table = await this.loadTable();

        if (block)
            this.addBlockToQueue(priority, notes, date, block, file, table);
        else
            this.addNoteToQueue(priority, notes, date,  file, table);
    }

    async addNoteToQueue(priority: string, notes: string, date: string, file: TFile, table: MarkdownTable) {

        let noteLink = this.plugin.app.metadataCache.fileToLinktext(file, file.path, true);
        if (this.isDuplicate(table, noteLink)){
            LogTo.Console("Already in your queue!", true);
            return;
        }

        let link = this.plugin.links.addBrackets(noteLink)
        let row = new MarkdownTableRow(link, priority, notes, this.plugin.settings.defaultAFactor.toString(), this.plugin.settings.defaultInterval.toString(), date);
        table.addRow(row);
        LogTo.Console("Added note to queue: " + noteLink, true);
        await this.writeQueueTable(table);
    }

    async addBlockToQueue(priority: string, notes: string, date: string, block: string, activeNoteFile: TFile, table: MarkdownTable) {
        LogTo.Debug("Add block to queue")
        let noteLink = this.plugin.app.metadataCache.fileToLinktext(activeNoteFile, activeNoteFile.path, true);
        let lineBlockId = this.plugin.blocks.getBlock(block, activeNoteFile);

        if (lineBlockId === "") { // The line is not already a block
            console.debug("This line is not currently a block. Adding a block ID.");
            lineBlockId = this.plugin.blocks.createBlockHash();
            let lineWithBlock = block + " ^" + lineBlockId;
            let oldText = await this.plugin.app.vault.read(activeNoteFile)
            let newNoteText = oldText.replace(block, lineWithBlock);
            await this.plugin.app.vault.modify(activeNoteFile, newNoteText);
        }

        noteLink = noteLink + "#^" + lineBlockId;

        if (this.isDuplicate(table, noteLink)){
            LogTo.Console("Already in your queue!", true);
            return;
        }

        let link = this.plugin.links.addBrackets(noteLink)
        table.addRow(new MarkdownTableRow(link, priority, notes, this.plugin.settings.defaultAFactor.toString(), this.plugin.settings.defaultInterval.toString(), date));
        LogTo.Console("Added block to queue: " + noteLink, true);
        await this.writeQueueTable(table);
    }

  async writeQueueTable(table: MarkdownTable): Promise<void> {
    let queue = this.plugin.app.vault.getAbstractFileByPath(this.filePath) as TFile;
    await this.plugin.app.vault.modify(queue, table.toString());
  }

  async readQueue(): Promise<string> {
      let queue = this.plugin.app.vault.getAbstractFileByPath(this.filePath) as TFile;
      try {
          return await this.plugin.app.vault.read(queue);
      }
      catch (Exception) {
          return;
      }
  }
}
