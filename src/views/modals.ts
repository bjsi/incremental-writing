import { normalizePath, TFolder, MarkdownView, TFile, SliderComponent, TextComponent, ButtonComponent } from "obsidian"
import IW from "../main"
import { ModalBase } from "./modal-base"
import { LogTo } from "../logger"
import { FileSuggest } from "./file-suggest"
import { Queue } from "../queue"
import { PriorityUtils } from "../helpers/priority-utils"
import { MarkdownTableRow } from "../markdown"

abstract class ReviewModal extends ModalBase {

    title: string
    inputSlider: SliderComponent
    inputNoteField: TextComponent
    inputFirstRep: TextComponent
    inputQueueField: TextComponent

    constructor(plugin: IW, title: string){
        super(plugin);
        this.title = title;
    }

    onOpen(){
        let { contentEl  } = this;

        contentEl.createEl('h2', {text: this.title});
        
        //
        // Queue

        contentEl.appendText("Queue: ");
        this.inputQueueField = new TextComponent(contentEl)
            .setPlaceholder("Example: queue.md")
            .setValue(this.plugin.settings.queueFilePath)
        let folderFunc = () => this.plugin.app.vault.getAbstractFileByPath(this.plugin.settings.queueFolderPath) as TFolder;
        new FileSuggest(this.plugin, this.inputQueueField.inputEl, folderFunc)
        contentEl.createEl("br");

        //
        // First Rep Date
        
        contentEl.appendText("First Rep Date: ")
        this.inputFirstRep = new TextComponent(contentEl)
            .setPlaceholder("Date")
            .setValue("1970-01-01");
        contentEl.createEl("br");

        this.inputFirstRep.inputEl.focus();
        this.inputFirstRep.inputEl.select();

        //
        // Priority

        let pMin = this.plugin.settings.defaultPriorityMin;
        let pMax = this.plugin.settings.defaultPriorityMax;
        contentEl.appendText("Priority: ");
        this.inputSlider = new SliderComponent(contentEl)
            .setLimits(0, 100, 1)
            .setValue(PriorityUtils.getPriorityBetween(pMin, pMax))
            .setDynamicTooltip();
        contentEl.createEl("br");

        //
        // Notes
        
        contentEl.appendText("Notes: ");
        this.inputNoteField = new TextComponent(contentEl)
            .setPlaceholder("Notes");
        contentEl.createEl("br");

        //
        // Button

        contentEl.createEl("br");
        let inputButton = new ButtonComponent(contentEl)
        .setButtonText("Add to Queue")
        .onClick(async () => {
            await this.addToOutstanding();
            this.close()
        });

        this.subscribeToEvents();
    }

    subscribeToEvents() {
        this.contentEl.addEventListener('keydown', async (ev) => {
            if (ev.key === "PageUp"){
                let curValue = this.inputSlider.getValue();
                if (curValue < 95)
                    this.inputSlider.setValue(curValue + 5);
                else
                    this.inputSlider.setValue(100);
            }
            else if (ev.key === "PageDown"){
                let curValue = this.inputSlider.getValue();
                if (curValue > 5)
                    this.inputSlider.setValue(curValue - 5);
                else
                    this.inputSlider.setValue(0);
            }
            else if (ev.key === 'Enter') {
                await this.addToOutstanding()
                this.close();
            }

        });
    }

    getPriority(): number {
        return this.inputSlider.getValue();
    }

    getNotes() {
        return this.inputNoteField.getValue();
    }

    getQueuePath() {
        let queue = this.inputQueueField.getValue();
        if (!queue.endsWith(".md"))
            queue += ".md"

        return normalizePath([this.plugin.settings.queueFolderPath, queue].join('/'));
    }

    abstract addToOutstanding(): Promise<void>;
}

export class ReviewNoteModal extends ReviewModal {

    constructor(plugin: IW) {
        super(plugin, "Add Note to Outstanding?");
    }

    onOpen() {
        super.onOpen();
    }

    async addToOutstanding() {
        let date = this.parseDate(this.inputFirstRep.getValue());
        if (!date) {
            LogTo.Console("Failed to parse initial repetition date!");
            return;
        }
        
        let queue = new Queue(this.plugin, this.getQueuePath());
        let file = this.plugin.files.getActiveNoteFile();
        let link = this.plugin.files.toLinkText(file);
        let row = new MarkdownTableRow(link, this.getPriority(), this.getNotes(), 1, date)
        await queue.addNotesToQueue(row);
    }
}

export class ReviewFileModal extends ReviewModal {

    filePath: string

    constructor(plugin: IW, filePath: string) {
        super(plugin, "Add File to Outstanding?");
        this.filePath = filePath;
    }

    onOpen() {
        super.onOpen();
    }

    async addToOutstanding() {
        let date = this.parseDate(this.inputFirstRep.getValue());
        if (!date) {
            LogTo.Console("Failed to parse initial repetition date!");
            return;
        }

        let queue = new Queue(this.plugin, this.getQueuePath());
        let file = this.plugin.files.getActiveNoteFile();
        let link = this.plugin.files.toLinkText(file);
        let row = new MarkdownTableRow(link, this.getPriority(), this.getNotes(), 1, date)
        await queue.addNotesToQueue(row);
    }
}

export class ReviewBlockModal extends ReviewModal {

    constructor(plugin: IW){
        super(plugin, "Add Block to Outstanding?");
    }

    onOpen(){
        super.onOpen();
    }

    // TODO: Change to just sending the line no?
    getCurrentLineText(): string {
        let editor = (this.app.workspace.activeLeaf.view as MarkdownView).editor;
        let cursor = editor.getCursor();
        let lineNo = cursor.line;
        return editor.getLine(lineNo);
    }

    async addToOutstanding() {
        let date = this.parseDate(this.inputFirstRep.getValue());
        if (!date) {
            LogTo.Console("Failed to parse initial repetition date!");
            return;
        }
        
        let queue = new Queue(this.plugin, this.getQueuePath());
        let file = this.plugin.files.getActiveNoteFile();
        await queue.addBlockToQueue(this.getPriority(), this.getNotes(), date, this.getCurrentLineText(), file);
    }
}
