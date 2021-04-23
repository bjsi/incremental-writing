export interface IWSettings {
	defaultPriorityMin: number
	defaultPriorityMax: number
    queueFilePath: string
    queueFolderPath: string
    defaultQueueType: string
    skipAddNoteWindow: boolean
}

export class DefaultSettings implements IWSettings {
      defaultPriorityMin = 10;
      defaultPriorityMax = 50;
      queueFolderPath = "IW-Queues"
      queueFilePath = "IW-Queue.md";
      defaultQueueType = "afactor";
      skipAddNoteWindow = false;
}
