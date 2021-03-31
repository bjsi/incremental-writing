import { App } from "obsidian"

export abstract class ObsidianUtilsBase {
    
    app: App

    constructor(app: App) {
        this.app = app;
    }
}

