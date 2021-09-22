import { ObsidianUtilsBase } from "./obsidian-utils-base";
import { App, TFile } from "obsidian";
import { LogTo } from "src/logger";
import { EOL } from "os";

export class BlockUtils extends ObsidianUtilsBase {
  constructor(app: App) {
    super(app);
  }

  async getBlockRefHash(lineNumber: number, noteFile: TFile): Promise<string> {
    const noteLines = (await this.app.vault.read(noteFile))?.split(/\r?\n/);
    if (!noteLines || noteLines.length === 0) {
      LogTo.Debug("Failed to read lines from note.");
      return null;
    }
    const match = noteLines[lineNumber].match(/(.+)( \^[=a-zA-Z0-9]+)$/);
    LogTo.Debug(JSON.stringify(match));
    return match ? match[3] : "";
  }

  async createBlockRefIfNotExists(
    lineNumber: number,
    noteFile: TFile,
    customBlockRef: string = null
  ): Promise<string> {
    const blockRef = await this.getBlockRefHash(lineNumber, noteFile);
    if (blockRef === null) {
      return null;
    } else if (blockRef !== "") {
      return (
        this.app.metadataCache.fileToLinktext(noteFile, "", true) +
        "#^" +
        blockRef
      );
    } else {
      return await this.addBlockRef(lineNumber, noteFile, customBlockRef);
    }
  }

  async addBlockRef(
    lineNumber: number,
    noteFile: TFile,
    customBlockRef: string = null
  ): Promise<string> {
    const oldNoteLines =
      (await this.app.vault.read(noteFile))?.split(/\r?\n/) || [];

    const blockRef =
      customBlockRef && customBlockRef.length !== 0
        ? customBlockRef
        : this.createBlockHash();

    if (!blockRef.match(/^[=a-zA-Z0-9]+$/)) {
      LogTo.Debug("Invalid block ref name.", true);
      return null;
    }

    const refs = this.app.metadataCache.getFileCache(noteFile).blocks;
    if (refs && Object.keys(refs).some((ref) => ref === blockRef)) {
      LogTo.Debug("This block ref is already used in this file.", true);
      return null;
    }

    oldNoteLines[lineNumber] = oldNoteLines[lineNumber] + " ^" + blockRef;
    await this.app.vault.modify(noteFile, oldNoteLines.join(EOL));
    return (
      this.app.metadataCache.fileToLinktext(noteFile, "", true) +
      "#^" +
      blockRef
    );
  }

  createBlockHash(): string {
    // Credit to https://stackoverflow.com/a/1349426
    let result = "";
    var characters = "abcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;
    for (var i = 0; i < 7; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
}
