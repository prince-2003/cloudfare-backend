import express from "express";
import { joinZoomMeeting } from "./meet/zoom.js";
import cors from "cors";
import schedule from "node-schedule";
import { MeetBot } from "./helpers/meetBot.js";
import { zoomBot } from "./helpers/zoomBot.js";




    const app = express();
    app.use(cors(
        {origin: "*"}
    ));

    app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
        console.log('Headers:', req.headers);
        next();
    });


    app.use((req, res, next) => {
        console.log(`Incoming request: ${req.method} ${req.path}`);
        console.log('Headers:', req.headers);
        next();
    });
    
    // Handle CORS preflight requests
    app.options("/extension", (req, res) => {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        res.sendStatus(204); // No Content
    });

    
    app.use(express.json());
    app.get("/", (_req, res) => {
        res.send("Hello World!");
        }
    );

   

    app.post("/join-meet", joinZoomMeeting)
    app.post("/schedule-meet", async (req, res) => {
        try {
            const { meetingId, scheduleTime, type , passcode } = req.body;
    
            if (!meetingId || !scheduleTime) {
                return res.status(400).json({ message: "Meeting link and time are required." });
            }
    
            const scheduledDate = new Date(scheduleTime);
            const now = new Date();
    
            
            console.log('Current time:', now.toISOString());
            console.log('Scheduled time:', scheduledDate.toISOString());
    
            if (scheduledDate < now) {
                return res.status(400).json({ message: "Scheduled time must be in the future." });
            }
    
            
            const jobName = `meeting-${meetingId}-${Date.now()}`;
    
            const job = schedule.scheduleJob(jobName, scheduledDate, async () => {
                try {
                    console.log(`Executing scheduled meeting: ${meetingId}`);
                    console.log(`Time now: ${new Date().toISOString()}`);
                    
                   
                    if (type.toLowerCase() === 'zoom') {
                        await zoomBot(meetingId,passcode);
                    } else {
                        await MeetBot(meetingId);
                        console.log(`Joining Google Meet: ${meetingId}`);
                    }
                    
                    
                    console.log(`Meeting ${meetingId} execution completed`);
                } catch (error) {
                    console.error(`Error executing meeting ${meetingId}:`, error);
                }
            });
    
            if (job) {
                
                console.log(`Meeting scheduled successfully: ${jobName}`);
                console.log(`Next invocation: ${job.nextInvocation()}`);
                
                res.json({ 
                    message: "Meeting scheduled successfully",
                    meetingId,
                    scheduledTime: scheduledDate,
                    nextInvocation: job.nextInvocation()
                });
            } else {
                throw new Error('Failed to schedule job');
            }
    
        } catch (error) {
            console.error('Scheduling error:', error);
            res.status(500).json({ 
                message: "Failed to schedule meeting", 
                error: error.message 
            });
        }
    });
    
 
    app.post("/scheduled-meetings", (req, res) => {
        const scheduledJobs = schedule.scheduledJobs;
        const jobs = Object.keys(scheduledJobs).map(jobName => ({
            jobName,
            nextInvocation: scheduledJobs[jobName].nextInvocation()
        }));
        
        res.status(200).json(jobs);
    });
    
    app.post("/extension", async (req, res) => {
        const {  type, url}= req.body;
        if (type === "google_meet") {
            await MeetBot(url);
    }});

    app.listen(3000, () => {
        console.log("Server is running on port 3000");
        }
    );
    
