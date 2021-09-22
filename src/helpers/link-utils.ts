import { App, TFile } from "obsidian";
import { ObsidianUtilsBase } from "./obsidian-utils-base";
import { getLinkpath, parseLinktext } from "obsidian";
import { LogTo } from "src/logger";

export class LinkEx extends ObsidianUtilsBase {
  constructor(app: App) {
    super(app);
  }

  static addBrackets(link: string) {
    if (!link.startsWith("[[")) link = "[[" + link;

    if (!link.endsWith("]]")) link = link + "]]";

    return link;
  }

  static removeBrackets(link: string) {
    if (link.startsWith("[[")) {
      link = link.substr(2);
    }

    if (link.endsWith("]]")) {
      link = link.substr(0, link.length - 2);
    }

    return link;
  }

  // TODO:
  exists(link: string, source: string): boolean {
    let path = getLinkpath(link);
    let file = this.app.metadataCache.getFirstLinkpathDest(path, source);
    return file instanceof TFile;
  }

  createAbsoluteLink(linktext: string, source: string): string | null { 
	  const {path, subpath} = parseLinktext(linktext);
	  const file = this.app.metadataCache.getFirstLinkpathDest(path, source);
	  // has to be set to lower case
	  // because obsidian link cache
	  // record keys are lower case
	  return file !== null 
		  ? this.app.metadataCache.fileToLinktext(file, "", true) + (subpath.toLowerCase() ?? "")
		  : null;
  }

  getLinksIn(file: TFile): string[] {
    const links = this.app.metadataCache.getFileCache(file).links ?? [];
    const linkPaths = links
    	.map(link => this.createAbsoluteLink(link.link, file.path))
	.filter(x => x !== null && x.length > 0);
    LogTo.Debug("Links: " + linkPaths.toString());
    return linkPaths;
  }
}
