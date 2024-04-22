const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv").config();
const helmet = require("helmet");
const morgan = require("morgan");
const userRoute = require("./routes/user");
const articleRoute = require("./routes/article");
const userActionsRoute = require("./routes/userAction");
const categoryRoute = require("./routes/category");

const PORT = process.env.PORT || 8000;

app.use(cors()); //CORSエラー回避
app.use(express.json());
app.use(helmet());
app.use(morgan("common"));
app.use("/eatfish_back/api/user", userRoute);
app.use("/eatfish_back/api/article", articleRoute);
app.use("/eatfish_back/api/userActions", userActionsRoute);
app.use("/eatfish_back/api/category", categoryRoute);

// Export the Express app
module.exports = app;

app.listen(PORT, () => console.log("server running"));
