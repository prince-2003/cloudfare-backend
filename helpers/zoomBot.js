import puppeteer from "puppeteer";
import fs from "fs";
import { fileURLToPath } from 'url';
import path from "path"
import { exec } from "child_process";
import { uploadAudio } from "./audioUpload.js";
import { startFFmpegProcess } from "./audioRecording.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function zoomBot(meetingId, passcode) {
    const outputDir = path.join(__dirname, "audio_file"); 
    const AUDIO_FILE = path.join(outputDir, "bca.mp3");
  const displayName = "Zoom";
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true }); // Ensures nested directories can be created
  }
  try {
    const browser = await puppeteer.launch({
      headless: false,
      executablePath:
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", // Adjust path for your OS
      args: [
        "--start-maximized",
        "--use-fake-ui-for-media-stream", // ✅ Auto-allow camera & microphone
        "--use-fake-device-for-media-stream", // ✅ Use a fake media device for testing
        "--allow-file-access-from-files",
        "--enable-usermedia-screen-capturing",
        "--disable-blink-features=AutomationControlled",
        "--disable-features=IsolateOrigins,site-per-process",
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });

    await page.goto("https://app.zoom.us/wc/", {
      waitUntil: "networkidle0",
      timeout: 60000,
    });
    

    await page.waitForSelector(".btn-index-join", {
      visible: true,
      timeout: 60000,
    });
    await page.click(".btn-index-join");
    console.log("clicked the join meeting");

    // Handle any alert popups
    page.on("dialog", async (dialog) => {
      console.log(`Dialog detected: ${dialog.message()}`);
      await dialog.accept(); // Automatically accept popups
    });
    console.log("cleared");
    const context = browser.defaultBrowserContext();
    await context.overridePermissions("https://app.zoom.us", [
      "clipboard-read",
      "clipboard-write",
      "geolocation",
      
    ]);

   
    await page.waitForSelector(".join-meetingId", { visible: true });
    await page.type(".join-meetingId", meetingId);
    await page.click(".btn-join");

    
    await context.overridePermissions("https://app.zoom.us", [
      "clipboard-read",
      "clipboard-write",
      "geolocation",
    ]);

    console.log("✅ Permissions overridden to block camera & microphone.");

    page.on("dialog", async (dialog) => {
      console.log(`Dialog detected: ${dialog.message()}`);
      await dialog.accept(); // Clicks "Continue"
    });

    try {
      console.log(
        '⏳ Waiting for the "Continue without Audio and Video" prompt...'
      );
      await page.waitForSelector(
        'button[aria-label="Continue without audio and video"]',
        { visible: true, timeout: 10000 }
      );

      console.log('✅ Clicking "Continue without Audio and Video"...');
      await page.click('button[aria-label="Continue without audio and video"]');

      console.log("🎉 Successfully bypassed audio/video prompt.");
    } catch (error) {
      console.log('⚠️ No "Continue without Audio and Video" prompt appeared.');
    }

   
    const pageContent = await page.content();
    console.log("Page content:", pageContent); // This will show the HTML content of the page

    // Check if the passcode input is inside an iframe
    const iframe = await page.$("iframe");
    if (iframe) {
      console.log(
        "Passcode input field is inside an iframe. Switching context..."
      );
      const iframeContent = await iframe.contentFrame();
      // Now interact with elements inside the iframe
      await iframeContent.waitForSelector('input[type="password"]', {
        visible: true,
        timeout: 15000,
      });
      console.log(
        "Passcode input field found inside iframe. Entering passcode..."
      );
      await iframeContent.type('input[type="password"]', passcode);
      console.log("Passcode entered successfully.");
    } else {
      
      console.log("No iframe detected, continuing normal flow...");
      try {
        
        await page.waitForSelector('input[type="password"]', {
          visible: true,
          timeout: 15000,
        });
        console.log("Passcode input field found. Entering passcode...");
        await page.type('input[type="password"]', passcode);
        console.log("Passcode entered successfully.");
      } catch (error) {
        console.log("Passcode input field not found within the given time.");
      }
    }

   
    console.log("Waiting for the display name input field...");
    try {
      // Check if display name input is inside an iframe
      const iframeForName = await page.$("iframe");
      if (iframeForName) {
        console.log(
          "Display name input field is inside an iframe. Switching context..."
        );
        const iframeContent = await iframeForName.contentFrame();
        // Now interact with elements inside the iframe
        await iframeContent.waitForSelector("#input-for-name", {
          visible: true,
          timeout: 15000,
        });
        console.log(
          "Display name input field found inside iframe. Entering display name..."
        );
        await iframeContent.type("#input-for-name", displayName);
        await iframeContent.waitForSelector("button.preview-join-button", {
          visible: true,
          timeout: 15000,
        });
        await iframeContent.click("button.preview-join-button");

        console.log("Display name entered and submitted.");
      } else {
        console.log(
          "No iframe detected for display name, continuing normal flow..."
        );
        await page.waitForSelector("#input-for-name", {
          visible: true,
          timeout: 15000,
        });
        await page.type("#input-for-name", displayName);
        await page.click("#btnSubmit");
        console.log("Display name entered and submitted.");
      }
    } catch (error) {
      console.log("Display name input field not found within the given time.");
    }

    console.log("Joined the Zoom meeting successfully.");
    console.log("Starting audio recording...");
  
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
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}
