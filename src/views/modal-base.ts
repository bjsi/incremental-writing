import { Modal } from "obsidian"
import { DateUtils } from "../helpers/date-utils"
import IW from "../main"

export abstract class ModalBase extends Modal {
    
    protected plugin: IW
    
    constructor(plugin: IW){
        super(plugin.app);
        this.plugin = plugin;
    }

    onClose() {
        let { contentEl } = this;
        contentEl.empty();
    }

    private parseDateAsDate(dateString: string): Date {
        return new Date(dateString);
    }

    private parseDateAsNatural(dateString: string): Date {
		let naturalLanguageDates = (<any>this.plugin.app).plugins.getPlugin('nldates-obsidian'); // Get the Natural Language Dates plugin.
		if (!naturalLanguageDates) {
			return;
		}

        let nlDateResult = naturalLanguageDates.parseDate(dateString);
        if (nlDateResult && nlDateResult.date)
            return nlDateResult.date;

        return;
    }

    parseDate(dateString: string): Date {
        let d1 = this.parseDateAsDate(dateString);
        if (DateUtils.isValid(d1))
            return d1;

        let d2 = this.parseDateAsNatural(dateString);
        if (DateUtils.isValid(d2))
            return d2;

        return new Date("1970-01-01");
    }
}
