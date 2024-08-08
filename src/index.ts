import Ffmpeg, { FfprobeData } from "fluent-ffmpeg";
import { acceptedAudioCodecs, acceptedVideoCodecs } from "./constants";

import { findSubtitles } from "./find-subtitles";
import si from "systeminformation";
import util from "util";
import * as fs from 'fs/promises';

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
  console.log(`Processing ${filePath}`);
  const [_a, path, name, extension] = filePath.match(/(.*[\/\\])?(.+)\.([a-zA-Z]+)/) ?? [filePath, filePath, '.mkv'];
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

  const desiredSubfile = hasSubtitles ? null : await findSubtitles(filePath);
  if (!properAudioCodec || !properVideoCodec || desiredSubfile) {
    const desiredVideoCodec = properVideoCodec
      ? "copy"
      : await determineValidCodec();
    const desiredAudioCodec = properAudioCodec ? "copy" : "ac3";
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
    const desiredFilePath = extension === 'mkv' ? `${path}${name}-fix.mkv` : `${path}${name}.mkv`;
    ffmpeg = ffmpeg.save(desiredFilePath);
    ffmpeg.on('progress', console.log);
    await new Promise((resolve, reject) => {
      ffmpeg.on('end', resolve);
      ffmpeg.on('error', reject);
    });
  } else {
    console.log("Input file was already perfect as it was :)");
  }
}

async function main() {
  const path: string = process.argv[2];
  const pathInfo = await fs.stat(path);
  let files: string[];
  if (!pathInfo.isDirectory()) {
    files = [path];
  } else {
    const directoryOpen = await  fs.opendir(path);
    files = [];
    let child = directoryOpen.readSync();
    while (child) {
      files.push(`${path}/${child.name}`);
      child = directoryOpen.readSync();
    }
  }
  for (const file of files) {
    try {
      await runFile(file);
    } catch (e) {
      console.error(`Error while processing ${file}:\n${e}`);
    }
  }
}
// runFile(process.argv[2])
//   .then(() => {})
//   .catch(console.error);

main().then().catch(console.error);
