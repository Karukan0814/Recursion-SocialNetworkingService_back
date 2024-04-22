import { PrismaClient } from "@prisma/client";

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
