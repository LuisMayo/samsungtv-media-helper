import Ffmpeg, { FfprobeData } from "fluent-ffmpeg";
import {
  acceptedAudioCodecs,
  acceptedVideoCodecs,
  desiredVideoCodecs,
} from "./constants";

import util from "util";

const ffprobe: (url: string) => Promise<FfprobeData> = util.promisify(
  Ffmpeg.ffprobe
);

// async function fixVideoCodec(filePath: string) {

// }

function determineValidCodec(): Promise<string> {
  return new Promise((resolve, reject) => {
    Ffmpeg().getAvailableEncoders((err, encoders) => {
      const codec = desiredVideoCodecs.find(
        (encoder) => encoders[encoder] != null
      );
      if (codec) {
        resolve(codec);
      } else {
        reject("No codec found");
      }
    });
  });
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

  if (!properAudioCodec || !properVideoCodec) {
    const desiredVideoCodec = properVideoCodec
      ? "copy"
      : await determineValidCodec();
    console.log(`Something is missing, fixing it, selected video codec ${desiredVideoCodec}`);
    const ffmpeg = Ffmpeg()
	.addInputOption("-hwaccel auto")
	.addInput(filePath)
	.videoCodec(desiredVideoCodec)
	.save('test.mp4');
  } else {
    console.log("Input file was already perfect as it was :)");
  }
}

runFile(process.argv[2]).then(() => {}).catch(console.error);