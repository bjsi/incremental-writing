import { MarkdownView, Modal, SliderComponent, TextComponent, App, ButtonComponent } from "obsidian"
import IW from "../main"

abstract class ReviewModal extends Modal {

    plugin: IW;
    title: string
    inputSlider: SliderComponent
    inputNoteField: TextComponent

    constructor(app: App, plugin: IW, title: string){
        super(app);
        this.plugin = plugin;
        this.title = title;
    }


    onOpen(){
        let { contentEl  } = this;

        contentEl.appendText(this.title);

        contentEl.createEl("br");
        contentEl.createEl("br");

        contentEl.appendText("Priority:");
        this.inputSlider = new SliderComponent(contentEl)
        .setLimits(0, 100, 1)
        .setValue(this.plugin.settings.defaultPriority);
        contentEl.createEl("br");

        this.inputNoteField = new TextComponent(contentEl).setPlaceholder("Notes");
        contentEl.createEl("br");

        let inputButton = new ButtonComponent(contentEl)
        .setButtonText("Add to IW Queue")
        .onClick(async () => {
            await this.addToOutstanding();
            this.close()
        });

        // this.inputNoteField.inputEl.focus();
        this.inputNoteField.inputEl.addEventListener('keypress', async (keypressed) => {
            if (keypressed.key === 'Enter') {
                await this.addToOutstanding()
                this.close();

            }
            else if (keypressed.key === "Pagedown"){
                let curValue = this.inputSlider.getValue();
                if (curValue < 95)
                    this.inputSlider.setValue(curValue + 5);
                else
                    this.inputSlider.setValue(100);

            }
            else if (keypressed.key === "Pageup"){
                let curValue = this.inputSlider.getValue();
                if (curValue > 5)
                    this.inputSlider.setValue(curValue - 5);
                else
                    this.inputSlider.setValue(0);

            }

        });
    }

    abstract addToOutstanding(): Promise<void>;

    onClose() {
        let { contentEl   } = this;
        contentEl.empty();

    }
}

export class ReviewNoteModal extends ReviewModal {

    constructor(app: App, plugin: IW){
        super(app, plugin, "Add Note to Outstanding IW plugin?");

    }

    onOpen() {
        super.onOpen();

    }

    async addToOutstanding(){
        await this.plugin.queue.addToQueue(this.inputSlider.getValue().toString(), this.inputNoteField.getValue());

    }

}

export class ReviewBlockModal extends ReviewModal {

    constructor(app: App, plugin: IW){
        super(app, plugin, "Add Block to Outstanding IW plugin?");
    }

    onOpen(){
        super.onOpen();

    }

    async addToOutstanding() {
        let editor = (this.app.workspace.activeLeaf.view as MarkdownView).editor;
        let cursor = editor.getCursor();
        let lineNo = cursor.line;

        if (this.plugin.settings.vimMode)
            lineNo += 1; // TODO: Bug where ctrl + p moves the cursor up one line?
        let lineText = editor.getLine(lineNo);
        await this.plugin.queue.addToQueue(this.inputSlider.getValue().toString(), this.inputNoteField.getValue(), lineText);

    }

    onClose() {
        let { contentEl   } = this;
        contentEl.empty();

    }

}
