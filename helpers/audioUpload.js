import { exec } from "child_process";
import fs from "fs";
import fetch from "node-fetch";
const CLOUDFLARE_WORKER_URL = "https://inworkers.dharjindersingh4.workers.dev";



function getAudioDuration(audioFile) {
    return new Promise((resolve, reject) => {
        exec(`ffmpeg -i "${audioFile}" -f null -`, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            const durationMatch = stderr.match(/Duration: (\d+:\d+:\d+\.\d+)/);
            if (durationMatch) {
                const durationString = durationMatch[1];
                const [hours, minutes, seconds] = durationString.split(':').map(Number);
                const totalSeconds = hours * 3600 + minutes * 60 + seconds;
                resolve(totalSeconds);
            } else {
                reject('Could not extract duration');
            }
        });
    });
}


function splitAudio(audioFile, startTime, duration, outputFile) {
    return new Promise((resolve, reject) => {
        exec(`ffmpeg -ss ${startTime} -t ${duration} -i ${audioFile} -acodec mp3 -y ${outputFile}`, (error, stdout, stderr) => {
            if (error) {
                reject(`Error splitting audio: ${stderr}`);
                return;
            }
            resolve(outputFile); 
        });
    });
}

async function uploadChunk(chunkFile,totalChunks,curr) {
    console.log(`Uploading chunk: ${chunkFile}`);
    
    if (!fs.existsSync(chunkFile)) {
        console.error(`Error: Chunk file ${chunkFile} does not exist!`);
        return;
    }
    
    const audioBuffer = fs.readFileSync(chunkFile);
    
    const response = await fetch(CLOUDFLARE_WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "audio/mpeg" },
        headers: {
          'Content-Type': 'audio/mpeg',
          'X-Total-Chunks': totalChunks.toString(), 
          'X-Current-Chunk': curr.toString()    
      },
        body: audioBuffer
    });
    
    
    const rawText = await response.text();
    console.log("Raw response from Cloudflare Worker:", rawText);
    
    try {
        const result = JSON.parse(rawText);
        console.log("Transcribed Text:", result.response);
        if (result.success) {
            try {
            fs.unlinkSync(AUDIO_FILE);
            console.log(`Original audio file ${AUDIO_FILE} deleted successfully`);
            } catch (error) {
            console.error(`Error deleting original audio file: ${error}`);
            }
        }
    } catch (error) {
        console.error("JSON Parsing Error:", error);
    }
    
   
    fs.unlinkSync(chunkFile);
}



export async function uploadAudio(AUDIO_FILE) {
    console.log(`Uploading: ${AUDIO_FILE}`);
    
    if (!fs.existsSync(AUDIO_FILE)) {
        console.error("Error: Audio file does not exist!");
        return;
    }
    

    const chunkDuration = 20; 
    const totalDuration = await getAudioDuration(AUDIO_FILE); 
    let chunks = [];
    
    for (let startTime = 0; startTime < totalDuration; startTime += chunkDuration) {
        const chunkFileName = `chunk_${startTime}.mp3`;
        const chunk = await splitAudio(AUDIO_FILE, startTime, chunkDuration, chunkFileName);
        chunks.push(chunk);
    }
    
    // Step 2: Upload each chunk to Cloudflare Worker and print the result
    let cnt=1;
    for (const chunk of chunks) {
        await uploadChunk(chunk,chunks.length,cnt);
        cnt++;
    }
}