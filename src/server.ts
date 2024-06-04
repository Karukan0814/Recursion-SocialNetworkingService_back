import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import http from "http";
import { isInt, isLength, escape } from "validator";
import userRoute from "./routes/user";
import postRoute from "./routes/post";
import messageRoute from "./routes/message";
import notificationRoute from "./routes/notification";
import { authenticateSocketToken } from "./lib/authenticateToken";
import { getUnreadNotificationsCount, registerMessage } from "./lib/util";
import { Server, Socket } from "socket.io";
declare module "socket.io/dist" {
  interface Socket {
    userid: number;
  }
}

const PORT = process.env.PORT || 8000;
const app = express();

const corsOptions = {
  origin: "https://karukan-practice.site", // 許可するオリジン
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  allowedHeaders: "Content-Type,Authorization",
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static("public"));
app.use(helmet());
app.use(morgan("common"));
app.use("/api/user", userRoute);
app.use("/api/post", postRoute);
app.use("/api/message", messageRoute);
app.use("/api/notification", notificationRoute);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.use(authenticateSocketToken);

io.on("connection", (socket: Socket) => {
  socket.on("userConnected", async (userid) => {
    console.log(`User connected with ID: ${userid}`);
    socket.userid = userid;

    socket.on("requestUnreadNotifications", async () => {
      const count = await getUnreadNotificationsCount(userid);
      socket.emit("unreadNotificationsCount", count);
    });
  });

  socket.on("joinConversation", (conversationId) => {
    console.log("joinConversation");
    socket.join(conversationId);
  });

  socket.on("sendMessage", async (message, conversationId, senderId) => {
    if (!isLength(message, { min: 1, max: 200 })) {
      throw new Error("Message length must be between 1 and 200 characters.");
    }
    if (!isInt(conversationId.toString(), { min: 1 })) {
      throw new Error("Invalid conversation ID.");
    }
    if (!isInt(senderId.toString(), { min: 1 })) {
      throw new Error("Invalid sender ID.");
    }

    const sanitizedMessage = escape(message);
    const savedMessage = await registerMessage(
      sanitizedMessage,
      conversationId,
      senderId
    );

    io.to(conversationId).emit("receiveMessage", savedMessage);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
