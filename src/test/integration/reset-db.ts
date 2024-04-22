import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
//テスト用データをリセットする
export default async () => {
  await prisma.$transaction([
    prisma.articleBookmark.deleteMany(),
    prisma.articleComment.deleteMany(),
    prisma.articleLike.deleteMany(),
    prisma.article.deleteMany(),
    prisma.category.deleteMany(),
    prisma.user.deleteMany(),
  ]);
};
