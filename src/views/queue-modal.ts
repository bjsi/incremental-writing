import { normalizePath, FuzzySuggestModal, TFolder } from "obsidian"
import IW from "../main"
import { Queue } from "../queue"
import  { LogTo } from "../logger"

export class QueueLoadModal extends FuzzySuggestModal<string> {

    plugin: IW;

    constructor(plugin: IW) {
        super(plugin.app);
        this.plugin = plugin;
    }

    onChooseItem(item: string, evt: MouseEvent | KeyboardEvent) {
        let path = [this.plugin.settings.queueFolderPath, item].join('/');
        this.plugin.queue = new Queue(this.plugin, path);
        LogTo.Console("Loaded Queue: " + path, true);
    }

    getItems(): string[] {
        let folder = this.plugin.app.vault.getAbstractFileByPath(normalizePath(this.plugin.settings.queueFolderPath)) as TFolder;
        if (folder) {
            let files = this.plugin.app.vault.getMarkdownFiles()
                .filter(file => this.plugin.files.isDescendantOf(file, folder))
                .map(file => file.name)

            if (!files.some(f => f === this.plugin.settings.queueFilePath))
                files.push(this.plugin.settings.queueFilePath);
            return files;
        }

        return [this.plugin.settings.queueFilePath];
    }

    getItemText(item: string) {
        return item;
    }
}
