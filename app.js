import express from "express";
import { joinZoomMeeting } from "./meet/zoom.js";
import cors from "cors";


    const app = express();
    app.use(cors(
        {origin: "*"}
    ));
    app.use(express.json());
    app.get("/", (_req, res) => {
        res.send("Hello World!");
        }
    );

    app.post("/join-meet", joinZoomMeeting)

    app.listen(3000, () => {
        console.log("Server is running on port 3000");
        }
    );
    
