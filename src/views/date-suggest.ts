import IW from "src/main";
import { TextInputSuggest } from "./suggest";

export class NaturalDateSuggest extends TextInputSuggest<string> {
  private plugin: IW;
  constructor(plugin: IW, inputEl: HTMLInputElement) {
    super(plugin.app, inputEl);
    this.plugin = plugin;
  }

  getSuggestions(inputStr: string): string[] {
    return Object.keys(
      this.plugin.settings.dropdownNaturalDates
    ).filter((date) => date.contains(inputStr));
  }

  renderSuggestion(date: string, el: HTMLElement): void {
    el.setText(date);
  }

  selectSuggestion(date: string): void {
    this.inputEl.value = date;
    this.inputEl.trigger("input");
    this.close();
  }
}
