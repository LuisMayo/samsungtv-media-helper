import fs from 'fs/promises';
import opensubtitles from 'subtitler';

export async function findSubtitles(filePath: string) {
  const proposedSubtitleFile =
    filePath.substring(0, filePath.lastIndexOf(".")) + ".srt";
    let fileExists: boolean;
    try {
        fileExists = await fs.stat(proposedSubtitleFile) != null;
    } catch (e) {
        fileExists = false;
    }
    if (!fileExists) {
        const token = await opensubtitles.api.login();
        const file = await opensubtitles.api.searchForFile();
    }
    return proposedSubtitleFile;
}
