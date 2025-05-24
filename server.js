const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Import routes
const scheduleRoute = require("./routes/schedule");
const triggerRoute = require("./routes/trigger");

// Use them
app.post("/schedule", scheduleRoute);
app.get("/trigger", triggerRoute);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
