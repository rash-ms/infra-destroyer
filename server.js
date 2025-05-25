// const express = require("express");
// const app = express();
// const PORT = process.env.PORT || 3000;

// app.use(express.json());

// // Import routes
// const scheduleRoute = require("./routes/schedule");
// const triggerRoute = require("./routes/trigger");

// // Use them
// app.post("/schedule", scheduleRoute);
// app.get("/trigger", triggerRoute);

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });



const express = require("express");
const bodyParser = require("body-parser"); // ✅ Add this

const app = express();
const PORT = process.env.PORT || 3000;

// Use body-parser for JSON
app.use(bodyParser.json());

// Optional debug
app.use((req, res, next) => {
  console.log("Incoming headers:", req.headers);
  next();
});

const scheduleRoute = require("./routes/schedule");
const triggerRoute = require("./routes/trigger");

app.post("/schedule", scheduleRoute);
app.get("/trigger", triggerRoute); // ✅ Make sure it's POST here

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

