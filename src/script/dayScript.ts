import prisma from "../lib/db";
import postSeeder from "../seeders/postSeeder";
import replySeeder from "../seeders/replySeeder";

// 一日に一度回すべきバッチ
async function dayBatch() {
  // 【要件】各ユーザーは毎日ランダムなテキストジェネレーターを使用した内容の異なる 3 つの投稿を行う
  await postSeeder(true);

  // 【要件】1つのランダムに選ばれたメインの投稿に対して返信をします。=毎日 1 つのランダムなメイン投稿に返信する
  await replySeeder();
}

dayBatch()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
