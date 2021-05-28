import { App, TFile } from "obsidian";
import { ObsidianUtilsBase } from "./obsidian-utils-base";
import { getLinkpath, normalizePath } from "obsidian";

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

  exists(link: string, source: string): boolean {
    let path = getLinkpath(link);
    let file = this.app.metadataCache.getFirstLinkpathDest(path, source);
    return file instanceof TFile;
  }

  getLinksIn(file: TFile): string[] {
    let links = this.app.metadataCache.getFileCache(file).links;
    if (links)
      return links
        .map((l) => getLinkpath(l.link))
        .map((l) => this.app.metadataCache.getFirstLinkpathDest(l, file.path))
        .map((f) => f.path);
    return [];
  }
}
