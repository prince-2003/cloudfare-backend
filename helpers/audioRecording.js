import { exec } from "child_process";

export const startFFmpegProcess = (audioFile) => {
    return exec(
        `ffmpeg -f dshow -i audio="Stereo Mix (Realtek(R) Audio)" -ac 1 -b:a 32k -ar 16000 -acodec libmp3lame ${audioFile}`,
        (error) => {
            if (error) console.error("FFmpeg error:", error);
        }
    );
};