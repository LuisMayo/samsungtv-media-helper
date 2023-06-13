import Ffmpeg, { FfprobeData } from "fluent-ffmpeg";
import { acceptedAudioCodecs, acceptedVideoCodecs } from "./constants";

import fileDialog from "popups-file-dialog";
import { findSubtitles } from "./find-subtitles";
import si from "systeminformation";
import util from "util";

const ffprobe: (url: string) => Promise<FfprobeData> = util.promisify(
  Ffmpeg.ffprobe
);

// async function fixVideoCodec(filePath: string) {

// }

/**
 * Determines the best h264 codec based on current Graphic card
 * @returns FFMPEG's codec name
 */
async function determineValidCodec(): Promise<string> {
  const graphicArray = await si.graphics();
  const vendor = graphicArray?.controllers?.[0]?.vendor?.toLowerCase() ?? "";
  if (vendor.includes("nvidia")) {
    return "h264_nvenc";
  } else if (vendor.includes("amd")) {
    return "h264_amf";
  } else if (vendor.includes("intel")) {
    return "h264_qsv";
  } else {
    return "libx264";
  }
}

async function runFile(filePath: string) {
  const info = await ffprobe(filePath);
  const hasSubtitles = info.streams.some(
    (val) => val.codec_type === "subtitle"
  );
  const properVideoCodec = info.streams
    .filter((stream) => stream.codec_type === "video")
    .some((stream) =>
      acceptedVideoCodecs.has(stream.codec_name?.toLowerCase() ?? "")
    );

  const properAudioCodec = info.streams
    .filter((stream) => stream.codec_type === "audio")
    .some((stream) =>
      acceptedAudioCodecs.has(stream.codec_name?.toLowerCase() ?? "")
    );

  if (!properAudioCodec || !properVideoCodec || !hasSubtitles) {
    const desiredVideoCodec = properVideoCodec
      ? "copy"
      : await determineValidCodec();
    const desiredAudioCodec = properAudioCodec ? "copy" : "ac3";
    const desiredSubfile = hasSubtitles ? null : await findSubtitles(filePath);
    console.log(
      `Something is missing\n` +
        `  Selected video codec: ${desiredVideoCodec}\n` +
        `  Selected audio codec: ${desiredAudioCodec}\n` +
        `  Selected subs file: ${desiredSubfile ?? "none"}`
    );
    let ffmpeg = Ffmpeg({ logger: console, stdoutLines: 20 })
      .addInput(filePath)
      .addInputOption("-hwaccel auto")
      .addInputOption("-fflags +genpts")
      .videoCodec(desiredVideoCodec)
      .audioCodec(desiredAudioCodec)
      .outputOption("-map 0");
    if (desiredSubfile) {
      ffmpeg = ffmpeg.addInput(desiredSubfile).outputOptions(["-scodec srt", "-map 1"]);
    }
    // If you don't assign here again the program instantly closes?
    ffmpeg = ffmpeg.save(filePath.substring(0, filePath.lastIndexOf(".")) + ".mkv");
  } else {
    console.log("Input file was already perfect as it was :)");
  }
}

async function main() {
  const files: string[] = process.argv[2]
    ? [process.argv[2]]
    : await fileDialog.openFile({
        allowMultipleSelects: true,
        filterPatterns: ["*.avi", "*.mkv", "*.mp4", "*.webm", "*.wmv", "*.flv"],
        filterPatternsDescription: "Video files",
        startPath: ".",
        title: "Select one/several files",
      });
  files.forEach(runFile);
}
// runFile(process.argv[2])
//   .then(() => {})
//   .catch(console.error);

main().then().catch(console.error);
