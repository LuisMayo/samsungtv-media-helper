import fs from "fs/promises";
import opensubtitles from "subtitler";

export async function findSubtitles(filePath: string) {
  let proposedSubtitleFile: string | null =
    filePath.substring(0, filePath.lastIndexOf(".")) + ".srt";
  let fileExists: boolean;
  try {
    fileExists = (await fs.stat(proposedSubtitleFile)) != null;
  } catch (e) {
    fileExists = false;
  }
  if (!fileExists) {
    const token = await opensubtitles.api.login();
    console.log(await opensubtitles.hash.getHash(filePath));
    let file: unknown[] | null;
    try {
      file = await opensubtitles.api.searchForFile(token, "en", filePath);
    } catch (e) {
      try {
        file = await opensubtitles.api.searchForTitle(
          token,
          "en",
          filePath.substring(
            filePath.replaceAll("\\", "/").lastIndexOf("/") + 1,
            filePath.lastIndexOf("")
          )
        );
      } catch (e) {
        file = null;
      }
    }
    if (file == null) {
      proposedSubtitleFile = null;
    } else {
        try {
            await new Promise((resolve, reject) => {
              opensubtitles.downloader.download(file, 1, filePath, resolve);
            });
        } catch (e) {
            proposedSubtitleFile = null;
        }
    }
  }
  return proposedSubtitleFile;
}
