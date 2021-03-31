import { normalizePath, MarkdownView, App, TFile, TFolder } from "obsidian"
import { ObsidianUtilsBase } from "./obsidian-utils-base"



// TODO: read: https://github.com/lynchjames/obsidian-day-planner/blob/d1eb7ce187e7757b7a3880358a6ee184b3b025da/src/file.ts#L48

export class FileUtils extends ObsidianUtilsBase {
    
    constructor(app: App) {
        super(app);
    }

    async createIfNotExists(file: string, data: string) {
        const normalizedPath = normalizePath(file);
        if (!await this.app.vault.adapter.exists(normalizedPath)) {
            let folderPath = this.getParentOfNormalized(normalizedPath);
            await this.createFolders(folderPath);
            await this.app.vault.create(normalizedPath, data);
        }
    }

    getParentOfNormalized(normalizedPath: string) {
        let pathSplit = normalizedPath.split('/');
        return pathSplit.slice(0, pathSplit.length - 1).join('/');
    }

    async createFolders(normalizedPath: string) {
        let current = normalizedPath;
        while (current && !await this.app.vault.adapter.exists(current)) {
            await this.app.vault.createFolder(current);
            current = this.getParentOfNormalized(current);
        }
    }

    isDescendantOf(file: TFile, folder: TFolder): boolean {
        let ancestor = file.parent;
        while (ancestor && !ancestor.isRoot()) {
            if (ancestor === folder) {
                return true;
            }
            ancestor = ancestor.parent;
        }
        return false;
    }

    async goTo(filePath: string, newLeaf: boolean) {
        let file = this.app.vault.getAbstractFileByPath(filePath) as TFile;
        let link = this.app.metadataCache.fileToLinktext(file, "");
        await this.app.workspace.openLinkText(link, "", newLeaf);
    }

    getActiveNoteFile() {
	  return (this.app.workspace.activeLeaf.view as MarkdownView).file;
    }
}
