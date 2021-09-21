export interface IWSettings {
  defaultPriorityMin: number;
  queueTagMap: Record<string, string[]>;
  defaultPriorityMax: number;
  queueFileName: string;
  queueFolderPath: string;
  defaultQueueType: string;
  skipAddNoteWindow: boolean;
  autoAddNewNotes: boolean;
  defaultFirstRepDate: string;
  askForNextRepDate: boolean;
}

export const DefaultSettings: IWSettings = {
  queueTagMap: { "IW-Queue": ["iw-queue"] },
  defaultPriorityMin: 10,
  defaultPriorityMax: 50,
  queueFolderPath: "IW-Queues",
  queueFileName: "IW-Queue.md",
  defaultQueueType: "afactor",
  skipAddNoteWindow: false,
  autoAddNewNotes: false,
  defaultFirstRepDate: "1970-01-01",
  askForNextRepDate: false,
};
