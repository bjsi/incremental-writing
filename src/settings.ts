import { IW_QUEUE_FILE, IW_QUEUE_FOLDER } from "./constants"

export interface IWSettings {
    vimMode: boolean
	defaultPriority: number
    queueFilePath: string
    queueFolderPath: string
}

export class DefaultSettings implements IWSettings {
      vimMode = false;
      defaultPriority = 30;
      queueFilePath = IW_QUEUE_FILE;
      queueFolderPath = IW_QUEUE_FOLDER;
}
