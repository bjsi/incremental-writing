export interface IWSettings {
	defaultPriority: number
    queueFilePath: string
    queueFolderPath: string
    defaultAFactor: number
    defaultInterval: number
    skipAddNoteWindow: boolean
}

export class DefaultSettings implements IWSettings {
      defaultPriority = 30;
      queueFolderPath = "IW-Queues"
      queueFilePath = "IW-Queue";
      defaultAFactor = 2;
      defaultInterval = 1;
      skipAddNoteWindow = false;
}
