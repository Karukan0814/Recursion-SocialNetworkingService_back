import { NotificationType, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Content-Typeヘッダーからエンコーディングを取得するユーティリティ関数
export function getEncodingFromContentType(
  contentType: string | undefined
): string {
  const match = contentType ? /charset=([^;]+)/.exec(contentType) : null;
  return match ? match[1] : "utf-8";
}

// 管理者かどうかを判定する関数
export async function userIsAdmin(userId: number): Promise<boolean> {
  try {
    // Prismaを使用してユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    // ユーザーが存在し、かつ isAdmin が true の場合を管理者とみなす
    if (user && user.id) {
      return user.isAdmin;
    }
    return false;
  } catch (error) {
    console.error("Error checking user admin status:", error);
    return false;
  }
}

export async function registerMessage(
  text: string,
  conversationId: number,
  senderId: number
) {
  try {
    const encryptedText = encrypt(text);
    console.log("encryptedText", encryptedText);
    const newMessage = await prisma.message.create({
      data: {
        text: encryptedText,
        conversationId,
        senderId,
      },
      include: {
        conversation: {
          include: {
            participants: true,
          },
        },
      },
    });

    //メッセージが送信されたことを相手側のユーザーに通知する
    const sendedUser = newMessage.conversation.participants.find(
      (user) => user.userId !== senderId
    );

    if (sendedUser && sendedUser.userId) {
      const newNotification = await registerNotification(
        NotificationType.MESSAGE,
        sendedUser.userId,
        senderId
      );
    }

    // 複合化されたテキストでメッセージオブジェクトを更新
    const decryptedText = decrypt(newMessage.text); // 暗号化されたテキストを複合化
    console.log("decryptedText", decryptedText);
    newMessage.text = decryptedText;
    console.log("newMessage", newMessage);

    return newMessage;
  } catch (error) {
    console.error("Error registering a message:", error);
    return null;
  }
}

export async function registerNotification(
  type: NotificationType,
  userId: number,
  triggeredById: number,
  postId?: number
) {
  try {
    const data: any = {};

    data.type = type;
    data.userId = userId;
    data.triggeredById = triggeredById;

    if (userId === triggeredById) {
      // 自分で自分のポストにリプしたりいいねしている場合は、通知の必要はない
      return null;
    }

    //通知のタイプがmessageかfollowだった場合、postIdは必要ない
    if (type === NotificationType.Like || type === NotificationType.REPLY) {
      //通知のタイプがlikeかreplyだった場合、postIdが必要

      if (!postId) {
        throw new Error("postId is required for registering notification");
      }
      data.postId = postId;
    }
    const newNotification = await prisma.notification.create({
      data,
    });
    return newNotification;
  } catch (error) {
    console.error("Error registering a notification:", error);
    return null;
  }
}

const crypto = require("crypto");

// データを暗号化する関数
export function encrypt(text: string) {
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(process.env.ENCRYPT_KEY!, "hex"),
    Buffer.from(process.env.IV_KEY!, "hex")
  );
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted.toString("hex");
}

type EncryptedData = {
  iv: string;
  encryptedData: string;
};
// データを複合化する関数
export function decrypt(text: string) {
  let encryptedText = Buffer.from(text, "hex");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(process.env.ENCRYPT_KEY!, "hex"),
    Buffer.from(process.env.IV_KEY!, "hex")
  );
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// ファイル名をハッシュ化する関数
export function hashFilename(filename: string) {
  // SHA-256ハッシュ関数を使用
  const hash = crypto.createHash("sha256");
  // ファイル名をハッシュ化
  hash.update(filename);
  // ハッシュ化されたデータを16進数の文字列として取得
  return hash.digest("hex");
}
import fs from "fs";
import { exec } from "child_process";
import os from "os";
import path from "path";
import util from "util";

const execAsync = util.promisify(exec);

export async function compressVideo(video: Express.Multer.File) {
  const extension = video.originalname.split(".").pop();
  const tempDir = os.tmpdir(); // OSの一時ディレクトリを取得
  const tempInPath = path.join(tempDir, `input_${Date.now()}.${extension}`);
  const tempOutPath = path.join(tempDir, `output_${Date.now()}.${extension}`);

  console.log(tempInPath, tempOutPath);
  // ファイルシステムに動画を一時保存
  fs.writeFileSync(tempInPath, video.buffer);
  console.log(tempInPath);
  // ファイルシステムに動画を一時保存
  fs.writeFileSync(tempInPath, video.buffer);

  // FFmpegを使用して動画を圧縮
  await execAsync(
    `ffmpeg -i ${tempInPath} -vf "scale='trunc(iw/2)*2':'trunc(ih/2)*2'" -b:v 500k -c:a copy ${tempOutPath}`
  );
  // 圧縮された動画ファイルを読み込む
  const compressedVideo = fs.readFileSync(tempOutPath);

  // 一時ファイルを削除
  fs.unlinkSync(tempInPath);
  fs.unlinkSync(tempOutPath);

  return compressedVideo;
}
