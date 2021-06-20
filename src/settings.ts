export interface IWSettings {
  defaultPriorityMin: number;
  defaultPriorityMax: number;
  queueFileName: string;
  queueFolderPath: string;
  defaultQueueType: string;
  skipAddNoteWindow: boolean;
  autoAddNewNotes: boolean;
}

export const DefaultSettings: IWSettings = {
  defaultPriorityMin: 10,
  defaultPriorityMax: 50,
  queueFolderPath: "IW-Queues",
  queueFileName: "IW-Queue.md",
  defaultQueueType: "afactor",
  skipAddNoteWindow: false,
  autoAddNewNotes: false,
};
