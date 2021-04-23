import { MarkdownTableRow } from "../markdown"

export class StatusBar {

    statusBarAdded: boolean;
    statusBar: HTMLElement
    statusBarText: HTMLSpanElement;

    repText: HTMLSpanElement;
    queueText: HTMLSpanElement;

    constructor(statusBar:HTMLElement) {
        this.statusBar = statusBar;
    }

    initStatusBar() {
        if(this.statusBarAdded) {
            return;
        }

        let status = this.statusBar.createEl('div', { prepend: true });
        this.statusBarText = status.createEl('span', { cls: ['status-bar-item-segment'] });
        this.repText = status.createEl('span', { cls: ['status-bar-item-segment'] });
        this.queueText = status.createEl('span', { cls: ['status-bar-item-segment'] });
        this.statusBarAdded = true;
    }

    updateCurrentQueue(queue: string) {
        if (queue)
            this.queueText.innerText = "IW Queue: " + queue;
    }

    updateCurrentRep(row: MarkdownTableRow) {
        if (row)
            this.repText.innerText = "IW Rep: " + row.link;
        else
            this.repText.innerText = "Current Rep: None."
    }
}
