import { MarkdownTableRow } from "../markdown"

export class StatusBar {
    statusBar: HTMLElement
    statusBarAdded: boolean;
    statusBarText: HTMLSpanElement;
    repText: HTMLSpanElement;

    constructor(statusBar:HTMLElement) {
        this.statusBar = statusBar;
    }

    initStatusBar() {
        if(this.statusBarAdded) {
            return;
        }

        let status = this.statusBar.createEl('div', { cls: 'day-planner', title: 'View the Day Planner', prepend: true });
        this.statusBarText = status.createEl('span', { cls: ['status-bar-item-segment', 'day-planner-status-bar-text'] });
        this.repText = status.createEl('span', { cls: ['status-bar-item-segment', 'day-planner-status-bar-text'] });
        this.statusBarAdded = true;

        this.updateReps(0);

    }

    updateReps(remainingReps: number) {
        if(remainingReps == 0){
            this.statusBarText.innerText = 'Reps: ALL DONE!';
            return;
        }

        this.statusBarText.innerText = "Reps: " + remainingReps.toString();
    }

    updateCurrentRep(row: MarkdownTableRow) {
        if (row)
            this.repText.innerText = "Current Rep: " + row.link;
        else
            this.repText.innerText = "Current Rep: None"
    }

    private ellipsis(input: string, limit: number){
        if(input.length <= limit) {
            return input;

        }
        return input.substring(0, limit) + '...';

    }
}
