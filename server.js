const express = require("express");
const bodyParser = require("body-parser");
const twilio = require("twilio");
const cors = require("cors");

const app = express();

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = ["https://nails-and-spa.vercel.app", "https://tonyinthewild.ca"];
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  },
  methods: ["GET", "POST"], // Specify allowed methods
  allowedHeaders: ["Content-Type"], // Specify allowed headers
  credentials: true, // Allow credentials (cookies, etc.)
};

// Use CORS middleware
app.use(cors(corsOptions));

// Parse incoming JSON requests
app.use(bodyParser.json());

// Twilio credentials from GitHub secrets
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = new twilio(accountSid, authToken);

app.post("/api/sendSmsConfirmation", (req, res) => {
  const { customerName, phone, date, time } = req.body;

  // Check if phone number is provided
  if (!phone) {
    return res.status(400).send({ success: false, error: "Phone number is required" });
  }

  // Make sure the phone number is in the correct format (only digits)
  const cleanedPhone = phone.replace(/[^\d]/g, '');
  if (cleanedPhone.length !== 10) {
    return res.status(400).send({ success: false, error: "Invalid phone number" });
  }

  const message = `Hi ${customerName}, your appointment is confirmed for ${date} at ${time}. Thank you!`;

  client.messages
    .create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER, // Get the Twilio phone number from GitHub secret
      to: `+1${cleanedPhone}`, // Ensure correct international format (with country code)
    })
    .then((message) => {
      console.log("SMS sent successfully:", message.sid);
      res.status(200).send({ success: true, message: "SMS sent successfully!" });
    })
    .catch((error) => {
      console.error("Twilio SMS send error:", error);
      res.status(500).send({ success: false, error: error.message || "Failed to send SMS" });
    });
});

// Server setup using PORT from GitHub secret
const PORT = process.env.PORT || 5001; // Use the GitHub secret for the port
app.listen(PORT, '0.0.0.0', () => {
  console.log('Server is running on port 5001');
});
