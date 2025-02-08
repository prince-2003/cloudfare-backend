
import { exec } from "child_process";
import fs from "fs";
import fetch from "node-fetch";
import path from "path"
import { zoomBot } from "../helpers/zoomBot.js";
import { fileURLToPath } from 'url';
import { MeetBot } from "../helpers/meetBot.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUDIO_FILE="audio_file\\bca.mp3";
const CLOUDFLARE_WORKER_URL = "https://inworkers.dharjindersingh4.workers.dev";

export async function joinZoomMeeting(req, res){

const {meetingId, passcode, type} = req.body;
res.sendStatus(200);
console.log(meetingId, passcode, type);
try{
  if(type==="zoom"){
    await zoomBot(meetingId,passcode);
  }else{
    await MeetBot(meetingId);
  }

    

  

  }catch(error){
console.log("Error", error)
  }
  
//   // audio starts here
//   console.log("Starting audio recording...");
//   const ffmpegProcess = exec(
//     `ffmpeg -f dshow -i audio="Stereo Mix (Realtek(R) Audio)" -ac 1 -b:a 32k -ar 16000 -acodec libmp3lame ${AUDIO_FILE}`,
//     (error) => {
//       if (error) console.error("FFmpeg error:", error);
//     }
//   );
  
//   // Let the bot stay in the meeting for 60 seconds
//   await page.waitForTimeout(60000);
  
//   // Stop recording
//   console.log("Stopping audio recording...");
//   ffmpegProcess.stdin.write("q"); // Gracefully stop FFmpeg
  
//   setTimeout(() => {
//     ffmpegProcess.kill("SIGKILL"); // Force kill if not exited
//     console.log(`Audio saved at: ${AUDIO_FILE}`);
//   }, 3000);
  
  
//   // Close browser
//   await browser.close();
//   uploadAudio();
};




// // Define meeting details
// const meetingId = '87681662669';  // Remove spaces if needed
// const passcode = 'd4KHL8';
// const displayName = 'clarifi';

// // Call the function
// //joinZoomMeeting(meetingId, passcode, displayName)
// //  .then(() => console.log('Test completed successfully.'))
// //  .catch((error) => console.error('Test failed:', error));

// async function uploadAudio() {
//     console.log(`Uploading: ${AUDIO_FILE}`);
    
//     if (!fs.existsSync(AUDIO_FILE)) {
//         console.error("Error: Audio file does not exist!");
//         return;
//     }
    
//     // Step 1: Split the audio into small chunks using ffmpeg
//     const chunkDuration = 20; // in seconds, adjust based on your needs
//     const totalDuration = await getAudioDuration(AUDIO_FILE); // Get the total duration of the audio file
//     let chunks = [];
    
//     for (let startTime = 0; startTime < totalDuration; startTime += chunkDuration) {
//         const chunkFileName = `chunk_${startTime}.mp3`;
//         const chunk = await splitAudio(AUDIO_FILE, startTime, chunkDuration, chunkFileName);
//         chunks.push(chunk);
//     }
    
//     // Step 2: Upload each chunk to Cloudflare Worker and print the result
//     let cnt=1;
//     for (const chunk of chunks) {
//         await uploadChunk(chunk,chunks.length,cnt);
//         cnt++;
//     }
// }

// // Function to get the total duration of the audio in seconds using ffmpeg
// function getAudioDuration(audioFile) {
//     return new Promise((resolve, reject) => {
//         exec(`ffmpeg -i "${audioFile}" -f null -`, (error, stdout, stderr) => {
//             if (error) {
//                 reject(error);
//                 return;
//             }

//             // Extract the duration from the stderr output
//             const durationMatch = stderr.match(/Duration: (\d+:\d+:\d+\.\d+)/);
//             if (durationMatch) {
//                 const durationString = durationMatch[1];
//                 const [hours, minutes, seconds] = durationString.split(':').map(Number);
//                 const totalSeconds = hours * 3600 + minutes * 60 + seconds;
//                 resolve(totalSeconds);
//             } else {
//                 reject('Could not extract duration');
//             }
//         });
//     });
// }


// // Function to split the audio file into chunks
// function splitAudio(audioFile, startTime, duration, outputFile) {
//     return new Promise((resolve, reject) => {
//         exec(`ffmpeg -ss ${startTime} -t ${duration} -i ${audioFile} -acodec mp3 -y ${outputFile}`, (error, stdout, stderr) => {
//             if (error) {
//                 reject(`Error splitting audio: ${stderr}`);
//                 return;
//             }
//             resolve(outputFile); // Return the path of the chunk file
//         });
//     });
// }

// // Function to upload the chunk to Cloudflare
// async function uploadChunk(chunkFile,totalChunks,curr) {
//     console.log(`Uploading chunk: ${chunkFile}`);
    
//     if (!fs.existsSync(chunkFile)) {
//         console.error(`Error: Chunk file ${chunkFile} does not exist!`);
//         return;
//     }
    
//     const audioBuffer = fs.readFileSync(chunkFile);
    
//     const response = await fetch(CLOUDFLARE_WORKER_URL, {
//         method: "POST",
//         headers: { "Content-Type": "audio/mpeg" },
//         headers: {
//           'Content-Type': 'audio/mpeg',
//           'X-Total-Chunks': totalChunks.toString(), // Send total number of chunks
//           'X-Current-Chunk': curr.toString()     // Send current chunk number
//       },
//         body: audioBuffer
//     });
    
//     // ✅ Log the raw response before parsing
//     const rawText = await response.text();
//     console.log("Raw response from Cloudflare Worker:", rawText);
    
//     try {
//         const result = JSON.parse(rawText);
//         console.log("Transcribed Text:", result.response);
//     } catch (error) {
//         console.error("JSON Parsing Error:", error);
//     }
    
//     // Clean up the chunk file after upload
//     fs.unlinkSync(chunkFile);
// }
// uploadAudio();