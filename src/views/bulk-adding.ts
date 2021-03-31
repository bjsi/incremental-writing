import { normalizePath, TFolder, TFile, SliderComponent, Notice, TextComponent, ButtonComponent } from "obsidian"
import { ModalBase } from "./modal-base"
import IW from "../main"
import { Queue } from "../queue"
import { HashSet } from "../hashset"
import { FileSuggest } from "./file-suggest"
import { DateUtils } from "../helpers/date-utils"
import { throttle } from "../helpers/functools"

export class BulkAdderModal extends ModalBase {

    queuePath: string

    inputFolderField: TextComponent
    noteCountDiv: HTMLDivElement

    //
    // Queue
    inputQueueField: TextComponent

    // 
    // Priorities

	inputPriorityMin: SliderComponent
    inputPriorityMax: SliderComponent

    // 
    // First Rep

    inputFirstRepMin: TextComponent
    inputFirstRepMax: TextComponent

    linkPaths: string[]
    outstanding: HashSet = new HashSet()
    toAdd: string[] = []

    constructor(plugin: IW, queuePath: string, linkPaths: string[]){
        super(plugin);
        this.linkPaths = linkPaths;
        this.queuePath = queuePath;
    }

    async updateOutstanding() {
        let queuePath = normalizePath(this.getQueuePath());
        let outstanding = new HashSet();
        if (await this.plugin.app.vault.adapter.exists(queuePath)) {
            let queue = new Queue(this.plugin, queuePath);
            let table = await queue.loadTable();
            let alreadyAdded = table.getReps().map(r => this.plugin.links.removeBrackets(r.link) + ".md");
            for (let added of alreadyAdded) {
                outstanding.add(added);
            }
        }
        this.outstanding = outstanding;
    }

    async updateToAdd() {
        await this.updateOutstanding();
        this.toAdd = this.linkPaths.filter(link => !this.outstanding.has(link));
        this.noteCountDiv.innerText = "Notes (excluding duplicates): " + this.toAdd.length;
    }

    getQueuePath() {
        let queue = this.inputQueueField.getValue();
        if (!queue.endsWith(".md"))
            queue += ".md"

        return normalizePath([this.plugin.settings.queueFolderPath, queue].join('/'));
    }

    async onOpen(){
        let { contentEl  } = this;
        
        contentEl.createEl("h3", {"text": "Bulk Add Notes to Queue"});

        //
        // Queue

        contentEl.appendText("Queue: ");
        this.inputQueueField = new TextComponent(contentEl)
            .setPlaceholder("Example: queue.md")
            .setValue(this.plugin.settings.queueFilePath)
            .onChange(throttle((value: string) => {
                this.updateToAdd();
            }, 500))
        let folderFunc = () => this.plugin.app.vault.getAbstractFileByPath(this.plugin.settings.queueFolderPath) as TFolder;
        new FileSuggest(this.plugin, this.inputQueueField.inputEl, folderFunc)
        contentEl.createEl("br");

        //
        // Note Count
    
        this.noteCountDiv = contentEl.createDiv();
        await this.updateToAdd();

        //
        // Priorities

        // Min

        this.contentEl.appendText("Min Priority: ");
        this.inputPriorityMin = new SliderComponent(contentEl)
            .setLimits(0, 100, 1)
            .setDynamicTooltip()
            .onChange((value) => {
                if (this.inputPriorityMax) {
                    let max = this.inputPriorityMax.getValue();
                    if (value > max)
                        this.inputPriorityMax.setValue(value);
                }
            })
            .setValue(0);
        this.contentEl.createEl("br");

        // Max

        this.contentEl.appendText("Max Priority: ");
        this.inputPriorityMax = new SliderComponent(contentEl)
            .setLimits(0, 100, 1)
            .setDynamicTooltip()
            .onChange((value) => {
                if (this.inputPriorityMin) {
                    let min = this.inputPriorityMin.getValue();
                    if (value < min)
                        this.inputPriorityMin.setValue(value);
                }
            })
            .setValue(100);
        this.contentEl.createEl("br");

        //
        // First Reps 

        this.contentEl.appendText("Earliest Rep Date: ");
        this.inputFirstRepMin = new TextComponent(contentEl)
            .setValue("1970-01-01");
        this.contentEl.createEl("br");

        this.contentEl.appendText("Latest Rep Date: ");
        this.inputFirstRepMax = new TextComponent(contentEl)
            .setValue("1970-01-01");
        this.contentEl.createEl("br");

        //
        // Button
        
        let inputButton = new ButtonComponent(contentEl)
        .setButtonText("Add to IW Queue")
        .onClick(async () => {
            
            let priMin = Number(this.inputPriorityMin.getValue());
            let priMax = Number(this.inputPriorityMax.getValue());

            let dateMin = this.parseDate(this.inputFirstRepMin.getValue());
            let dateMax = this.parseDate(this.inputFirstRepMax.getValue());
            
            if (this.prioritiesAreValid(priMin, priMax) && this.datesAreValid(dateMin, dateMax)) {
                await this.addNotes(priMin, priMax, dateMin, dateMax);
                this.close();
                return;
            }
            else {
                new Notice("Failed: invalid data!");
            }
        });
    }

    datesAreValid(d1: string, d2: string){
        let d1AsDate = new Date(d1);
        let d2AsDate = new Date(d2);
        return (d1AsDate && d2AsDate && (d1AsDate <= d2AsDate))
    }

    isValidPriority(pri: number): boolean {
        return (!isNaN(pri) && (pri >= 0 && pri <= 100));
    }

    prioritiesAreValid(p1: number, p2: number) {
        return this.isValidPriority(p1) && this.isValidPriority(p2) && (p1 < p2)
    }

    roundOff(num: number, places: number) {
        const x = Math.pow(10,places);
        return Math.round(num * x) / x;
    }

    async addNotes(priMin: number, priMax: number, dateMin: string, dateMax: string) {
        let priStep = (priMax - priMin) / this.toAdd.length;
        let curPriority = priMin;
        let curDate = new Date(dateMin);
        let dateDiff = DateUtils.dateDifference(new Date(dateMin), new Date(dateMax));
        let numToAdd = this.toAdd.length > 0 ? this.toAdd.length : 1;
        let dateStep = dateDiff / numToAdd;
        let curStep = dateStep;
        
        for (let note of this.toAdd) {
            let file = this.plugin.app.vault.getAbstractFileByPath(note) as TFile;
            let queue = new Queue(this.plugin, this.getQueuePath());
            await queue.addToQueue(curPriority.toString(), "", DateUtils.formatDate(curDate), file)

            curPriority = this.roundOff(curPriority + priStep, 2);
            curDate = DateUtils.addDays(new Date(dateMin), curStep);
            curStep += dateStep;
        }
    }
}
