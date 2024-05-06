const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv").config();
const helmet = require("helmet");
const morgan = require("morgan");
const userRoute = require("./routes/user");
const postRoute = require("./routes/post");
const messageRoute = require("./routes/message");

const PORT = process.env.PORT || 8000;

app.use(cors()); //CORSエラー回避
app.use(express.json());
app.use(helmet());
app.use(morgan("common"));
app.use("/api/user", userRoute);
app.use("/api/post", postRoute);
app.use("/api/message", messageRoute);

// Export the Express app
module.exports = app;

app.listen(PORT, () => console.log("server running"));
