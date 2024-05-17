// import { Socket } from "socket.io";
import { authenticateSocketToken } from "./lib/authenticateToken";
import { getUnreadNotificationsCount, registerMessage } from "./lib/util";

import { Socket } from "socket.io";

// Extend the interface
declare module "socket.io" {
  interface Socket {
    userid: number;
  }
}

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import http from "http";
import { Server } from "socket.io";
import { isInt, isLength, escape } from "validator";
import userRoute from "./routes/user";
import postRoute from "./routes/post";
import messageRoute from "./routes/message";
import notificationRoute from "./routes/notification";

const PORT = process.env.PORT || 8000;
const app = express();

app.use(cors()); //CORSエラー回避
app.use(express.json());

app.use(express.static("public"));

app.use(helmet());
app.use(morgan("common"));
app.use("/api/user", userRoute);
app.use("/api/post", postRoute);
app.use("/api/message", messageRoute);
app.use("/api/notification", notificationRoute);

// 既存のHTTPサーバーをラップ
const server = http.createServer(app); //TODO 本番環境でhttps接続にすること

// Socket.IOサーバーの初期化
const io = new Server(server, {
  cors: {
    origin: "*", // 本番環境では具体的なドメインを指定することが重要です
    methods: ["GET", "POST"],
  },
});

// Socket.IOサーバーに認証ミドルウェアを適用
io.use(authenticateSocketToken);

// Socket.IOの接続イベント
io.on("connection", (socket: Socket) => {
  console.log("A user connected");

  // ユーザーIDを受信
  socket.on("userConnected", async (userid) => {
    console.log(`User connected with ID: ${userid}`);
    socket.userid = userid; // ソケットインスタンスにユーザーIDを保存

    // 定期的に未読通知数を送信
    socket.on("requestUnreadNotifications", async () => {
      const count = await getUnreadNotificationsCount(userid);
      socket.emit("unreadNotificationsCount", count);
    });
  });

  // ルームへの参加
  socket.on("joinConversation", (conversationId) => {
    console.log("joinConversation");

    socket.join(conversationId);
  });

  // メッセージ受信時の処理
  socket.on("sendMessage", async (message, conversationId, senderId) => {
    // データベースにメッセージを保存
    console.log("sendMessage");

    // バリデーション
    if (!isLength(message, { min: 1, max: 200 })) {
      throw new Error("Message length must be between 1 and 200 characters.");
    }
    if (!isInt(conversationId.toString(), { min: 1 })) {
      throw new Error("Invalid conversation ID.");
    }
    if (!isInt(senderId.toString(), { min: 1 })) {
      throw new Error("Invalid sender ID.");
    }

    // メッセージの内容をサニタイズ
    const sanitizedMessage = escape(message);

    // データベースにメッセージを保存
    const savedMessage = await registerMessage(
      sanitizedMessage,
      conversationId,
      senderId
    );

    console.log("savedMessage", savedMessage);
    io.to(conversationId).emit("receiveMessage", savedMessage);
  });

  // ここにSocket.IOのイベントハンドラを設置
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// サーバーのリスンをSocket.IOに変更
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export the Express app
module.exports = app;

// app.listen(PORT, () => console.log("server running"));
