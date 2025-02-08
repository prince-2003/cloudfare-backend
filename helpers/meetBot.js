import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs";
import {spawn} from "child_process";
import { fileURLToPath } from 'url';
import path from "path"
import { exec } from "child_process";
import { uploadAudio } from "./audioUpload.js";
import dotenv from "dotenv";
import { startFFmpegProcess } from "./audioRecording.js";

dotenv.config();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
   const outputDir = path.join(__dirname, "audio_file"); 
    const AUDIO_FILE = path.join(outputDir, "bca.mp3");

const stealth = StealthPlugin();

stealth.enabledEvasions.delete("iframe.contentWindow");
stealth.enabledEvasions.delete("media.codecs");

puppeteer.use(stealth);

export async function MeetBot(meetingId) {
 
const MEET_URL = meetingId;
const EMAIL = process.env.GOOGLE_EMAIL;
const PASSWORD = process.env.GOOGLE_PASSWORD;

const browser = await puppeteer.launch({
    headless: false,
    executablePath:
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
        "--disable-features=MediaStream",
        "--disable-blink-features=MediaStream",
        "--deny-permission-prompts"
    ]
});
const page = await browser.newPage();
    
   
    const context = browser.defaultBrowserContext();
    await context.overridePermissions(MEET_URL, []); 
    await context.overridePermissions(MEET_URL, ["notifications"]);
    
   
    await page.goto("https://accounts.google.com/signin");
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', EMAIL);
    await page.keyboard.press("Enter");
    
    await page.waitForSelector('input[type="password"]', { visible: true });
    await page.type('input[type="password"]', PASSWORD);
    await page.keyboard.press("Enter");
    await page.waitForNavigation();

    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false,
        });
      });
    await page.goto(MEET_URL);
    await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
      );

      
      
    await page.waitForSelector('button', { visible: true, timeout: 30000 });
     


  console.log("✅ Permissions overridden to block camera & microphone.");

  console.log('clicked the continue');
  page.on('dialog', async (dialog) => {
    console.log(`⚠️ Dialog detected: ${dialog.message()}`);
    await dialog.accept();  
  });
  


  try {
    console.log('⏳ Waiting for the "Continue without Audio and Video" prompt...');
    await page.waitForSelector('button[aria-label="Continue without audio and video"]', { visible: true, timeout: 10000 });

    console.log('✅ Clicking "Continue without Audio and Video"...');
    await page.click('button[aria-label="Continue without audio and video"]');

    console.log('🎉 Successfully bypassed audio/video prompt.');
  } catch (error) {
    console.log('⚠️ No "Continue without Audio and Video" prompt appeared.');
  }


try {
    console.log("Waiting for the 'Ask to Join' button...");

    const joinButton = await page.waitForFunction(
        () => {
            const buttons = Array.from(document.querySelectorAll("button"));
            return buttons.find(button => 
                button.innerText.trim().toLowerCase().includes("ask to join") || 
                button.innerText.trim().toLowerCase().includes("join now")
            );
        }, 
        { timeout: 300000 } 
    );

    try {
        console.log("⏳ Waiting for the 'Continue without microphone and camera' button...");
        
        await page.waitForSelector('button', { visible: true, timeout: 10000 });
    
        const buttons = await page.$$("button");
    
        for (const button of buttons) {
            const text = await page.evaluate(el => el.innerText.trim().toLowerCase(), button);
            
            if (text.includes("continue without microphone and camera")) {
                console.log("✅ Found the button, clicking it...");
                await button.click();
                break;
            }
        }
    
        console.log("🎉 Successfully bypassed the audio/video prompt.");
    } catch (error) {
        console.log("⚠️ No 'Continue without microphone and camera' button appeared.");
    }
    

        if (joinButton) {
            console.log("Button found, scrolling into view...");
            await page.evaluate(el => el.scrollIntoView(), joinButton);
    
            
            await new Promise(resolve => setTimeout(resolve, 1000)); 
    
            console.log("Attempting to click the button...");
            await page.evaluate(el => el.click(), joinButton);
    
            console.log("Joined Google Meet!");

            const ffmpegProcess = startFFmpegProcess(AUDIO_FILE);
              
              await page.waitForTimeout(60000);
              
              //
              console.log("Stopping audio recording...");
              ffmpegProcess.stdin.write("q"); // Gracefully stop FFmpeg
              
              setTimeout(() => {
                ffmpegProcess.kill("SIGKILL"); // Force kill if not exited
                console.log(`Audio saved at: ${AUDIO_FILE}`);
              }, 3000);
              await browser.close();
              await uploadAudio(AUDIO_FILE);
            
                return true;
        }
    } catch (error) {
        console.error("Error joining the meeting:", error);
    }
    }
