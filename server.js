const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const sgMail = require("@sendgrid/mail");

const app = express();
const PORT = process.env.PORT || 3000;

// Set SendGrid API key
require("dotenv").config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public"), { maxAge: "1d" }));

// API endpoint to handle attendance submission
app.post("/attendance", (req, res) => {
    const { name, image } = req.body;
    console.log("Received attendance data:", { name, image });

    const base64Data = image.replace(/^data:image\/png;base64,/, "");
    const imagePath = path.join(__dirname, "uploads", `${name}.png`);

    fs.writeFile(imagePath, base64Data, "base64", (err) => {
        if (err) {
            return res.status(500).json({ message: "Image saving failed" });
        }

        const msg = {
            to: "cyberzypher@gmail.com",
            from: "mailtosidharth.me@gmail.com",
            subject: "Attendance Record",
            text: `Attendance recorded for ${name}`,
            attachments: [
                {
                    content: base64Data,
                    filename: `${name}.png`,
                    type: "image/png",
                    disposition: "attachment",
                },
            ],
        };

        sgMail
            .send(msg)
            .then(() => {
                res.status(200).json({ message: `Attendance for ${name} has been recorded.` });
                fs.unlink(imagePath, (err) => {
                    if (err) console.error("Image deletion failed:", err);
                });
            })
            .catch((error) => {
                console.error("Email sending failed:", error);
                res.status(500).json({ message: "Email sending failed" });
            });
    });
});

// API endpoint to mark as absent
app.post("/absent", (req, res) => {
    const { name } = req.body;
    console.log("Marking absent for:", name);

    if (!name) {
        return res.status(400).json({ message: "Name is required." });
    }

    const msg = {
        to: "cyberzypher@gmail.com",
        from: "mailtosidharth.me@gmail.com",
        subject: "Attendance Absence Record",
        text: `Attendance marked as absent for ${name}`,
    };

    sgMail
        .send(msg)
        .then(() => {
            res.status(200).json({ message: `Absence for ${name} has been recorded.` });
        })
        .catch((error) => {
            console.error("Email sending failed:", error);
            res.status(500).json({ message: "Email sending failed" });
        });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
