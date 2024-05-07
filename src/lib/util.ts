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
    const newMessage = await prisma.message.create({
      data: {
        text,
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
