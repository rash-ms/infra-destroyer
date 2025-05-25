const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Add these lines before routes
app.use(express.json({ strict: false })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.text());

// Import routes
const scheduleRoute = require("./routes/schedule");
const triggerRoute = require("./routes/trigger");

app.post("/schedule", scheduleRoute);
app.get("/trigger", triggerRoute);
app.post("/trigger", triggerRoute); 

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});