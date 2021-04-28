import { ObsidianUtilsBase } from "./obsidian-utils-base";
import { App, TFile } from "obsidian";

export class BlockUtils extends ObsidianUtilsBase {
  constructor(app: App) {
    super(app);
  }

  // TODO: Rewrite
  getBlock(inputLine: string, noteFile: TFile): string {
    //Returns the string of a block ID if block is found, or "" if not.
    let noteBlocks = this.app.metadataCache.getFileCache(noteFile).blocks;
    console.log("Checking if line '" + inputLine + "' is a block.");
    let blockString = "";
    if (noteBlocks) {
      // the file does contain blocks. If not, return ""
      for (let eachBlock in noteBlocks) {
        // iterate through the blocks.
        console.log("Checking block ^" + eachBlock);
        let blockRegExp = new RegExp("(" + eachBlock + ")$", "gim");
        if (inputLine.match(blockRegExp)) {
          // if end of inputLine matches block, return it
          blockString = eachBlock;
          console.log("Found block ^" + blockString);
          return blockString;
        }
      }
      return blockString;
    }
    return blockString;
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
