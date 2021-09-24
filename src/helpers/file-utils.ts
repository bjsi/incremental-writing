import { normalizePath, MarkdownView, App, TFile, TFolder } from "obsidian";
import { ObsidianUtilsBase } from "./obsidian-utils-base";

// TODO: read: https://github.com/lynchjames/obsidian-day-planner/blob/d1eb7ce187e7757b7a3880358a6ee184b3b025da/src/file.ts#L48

export class FileUtils extends ObsidianUtilsBase {
  constructor(app: App) {
    super(app);
  }

  async exists(file: string) {
    return await this.app.vault.adapter.exists(normalizePath(file));
  }

  async createIfNotExists(file: string, data: string) {
    const normalizedPath = normalizePath(file);
    if (!(await this.exists(normalizedPath))) {
      let folderPath = this.getParentOfNormalized(normalizedPath);
      await this.createFolders(folderPath);
      await this.app.vault.create(normalizedPath, data);
    }
  }

  getTFile(filePath: string) {
    let file = this.app.vault.getAbstractFileByPath(filePath);
    if (file instanceof TFile) return file;
    return null;
  }

  getTFolder(folderPath: string) {
    let folder = this.app.vault.getAbstractFileByPath(folderPath);
    if (folder instanceof TFolder) return folder;
    return null;
  }

  toLinkText(file: TFile) {
    return this.app.metadataCache.fileToLinktext(file, "", true);
  }

  getParentOfNormalized(normalizedPath: string) {
    let pathSplit = normalizedPath.split("/");
    return pathSplit.slice(0, pathSplit.length - 1).join("/");
  }

  async createFolders(normalizedPath: string) {
    let current = normalizedPath;
    while (current && !(await this.app.vault.adapter.exists(current))) {
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
    let file = this.getTFile(filePath);
    let link = this.app.metadataCache.fileToLinktext(file, "");
    await this.app.workspace.openLinkText(link, "", newLeaf);
  }

  getActiveNoteFile() {
    return this.app.workspace.getActiveViewOfType(MarkdownView)?.file;
  }
}
