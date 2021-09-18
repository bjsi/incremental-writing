import { ObsidianUtilsBase } from "./obsidian-utils-base";
import { App, TFile } from "obsidian";
import { LogTo } from "src/logger";

export class BlockUtils extends ObsidianUtilsBase {
  constructor(app: App) {
    super(app);
  }

  async getBlockRefHash(lineNumber: number, noteFile: TFile): Promise<string> {
    const noteLines = (await this.app.vault.read(noteFile))
    	?.split(/\r?\n/);
    if (!noteLines || noteLines.length == 0)
    {
      LogTo.Debug("Failed to read lines from note.")
      return null;
    }
    const blockRefRegex = new RegExp("(.+)( \^[=a-zA-Z0-9]+)$", "gm");
    const match = noteLines[lineNumber].match(blockRefRegex);
    return match
    	? match[1]
	: "";
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
