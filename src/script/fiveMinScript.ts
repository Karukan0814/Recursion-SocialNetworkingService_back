import prisma from "../lib/db";

// 5分に一度回すべきバッチ
async function fiveMinBatch() {
  // scheduledAtが現在時刻をすぎているPostを探して、sentAtに現在時刻を入れる
  try {
    const now = new Date();
    const updatedCount = await prisma.post.updateMany({
      where: {
        scheduledAt: {
          lte: now,
        },
        sentAt: null,
      },
      data: {
        sentAt: now,
      },
    });

    console.log("Success sending scheduled posts:", updatedCount);
  } catch (error) {
    console.error("Error sending scheduled posts:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fiveMinBatch()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
