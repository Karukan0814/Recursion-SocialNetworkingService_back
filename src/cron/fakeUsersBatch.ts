import cron from "node-cron";

import prisma from "../lib/db";
import { getRandomObject, registerNotification } from "../lib/util";
import { NotificationType } from "@prisma/client";
import likeSeeder from "../seeders/likeSeeder";
import {
  LIKES_PER_INFLUENCER,
  LIKES_PER_USER,
  NUMBER_OF_INFLUENCERS_FOLLOWERS,
} from "../seeders/seederConatants";
import postSeeder from "../seeders/postSeeder";
import replySeeder from "../seeders/replySeeder";

// 一日に一度回すべきバッチ
export async function dayBatchPost() {
  try {
    // 【要件】各ユーザーは毎日ランダムなテキストジェネレーターを使用した内容の異なる 3 つの投稿を行う
    await postSeeder(true);
  } catch (e: any) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

export async function dayBatchReply() {
  try {
    // 【要件】1つのランダムに選ばれたメインの投稿に対して返信をします。=毎日 1 つのランダムなメイン投稿に返信する
    await replySeeder();
  } catch (e: any) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

export async function fiveMinBatch() {
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
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function likeInfluencerPosts(likeCount = LIKES_PER_USER) {
  try {
    // フェイクユーザーのユーザーリストを取得
    const testUserList = await prisma.user.findMany({
      where: {
        fakeFlag: true,
      },
      include: {
        followings: true,
      },
    });
    console.log("testUserList", testUserList.length);

    // const specificUser = testUserList.find(
    //   (user: { id: number }) => user.id === 1798
    // );
    // console.log("specificUser", specificUser?.followings.length);

    // フェイクユーザーのリストからフォロワーの数が100を超えるユーザーを取得
    const influencerList = testUserList.filter(
      (user: { followings: string | any[] }) => {
        return user.followings.length >= NUMBER_OF_INFLUENCERS_FOLLOWERS;
      }
    );
    console.log("influencerList", influencerList.length);

    // インフルエンサーのIDリストを作成
    const influencerIds = influencerList.map((influencer) => influencer.id);

    // インフルエンサーになっているユーザーの２４時間以内のポストリストを取得
    const now = new Date();
    const postsWithin24hours = await prisma.post.findMany({
      where: {
        userId: {
          in: influencerIds,
        },
        sentAt: {
          gte: new Date(new Date().getTime() - 24 * 60 * 60 * 1000), // 24時間以内のポスト
        },
      },
    });
    console.log("postsWithin24hours.length", postsWithin24hours.length);

    // 各ユーザーがランダムにインフルエンサーのポストから４件選択して「いいね」する
    let allInfluencersLikeCount = 0;
    for (let user of testUserList) {
      // インフルエンサーのポストをランダムに4件取得
      const randomInfluencerPosts = getRandomObject(
        postsWithin24hours,
        Math.ceil(LIKES_PER_INFLUENCER / 5)
      );

      const data: Array<any> = [];
      for (let likePost of randomInfluencerPosts) {
        data.push({
          postId: likePost.id,
          userId: user.id,
        });
      }

      // 選択したインフルエンサーのポストにいいねを登録
      const newLike = await prisma.postLike.createMany({
        data,
        skipDuplicates: true,
      });
      allInfluencersLikeCount += newLike.count;

      // 通知を飛ばす
      for (let post of randomInfluencerPosts) {
        await registerNotification(
          NotificationType.Like,
          user.id,
          post.userId,
          post.id
        );
      }
    }
    console.log(
      `Success sending likes to influencers!`,
      allInfluencersLikeCount
    );
  } catch (error) {
    console.error("Error in likeInfluencerPosts:", error);
  }
}
export async function sixHoursBatch() {
  // 一日のおおよそ5回＝6時間ごとに回るバッチ
  try {
    // 【要件】このバッチが一回回るごとに各フェイクユーザーはランダムに選択した１つのポストに「いいね」する＝一日に５ポストにいいねする
    await likeSeeder(1, true);

    // 【要件】インフルエンサーアカウントの投稿２０件にいいねする＝バッチ一回あたり20/5=4件のインフルエンサーのポストにいいねする
    // →ランダムに投稿に遅延時間を設ける＝自然にみえる挙動
    await likeInfluencerPosts();
  } catch (error) {
    console.error("Error sending likes to posts:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}
// 一日に一回のバッチ処理

cron.schedule("0 0 * * *", async () => {
  console.log("dayBatchPost");
  await dayBatchPost();
});

cron.schedule("0 12 * * *", async () => {
  console.log("dayBatchReply");
  await dayBatchReply();
});

// 5分に一回のバッチ処理
cron.schedule("*/5 * * * *", async () => {
  console.log("fiveMinBatch");
  await fiveMinBatch();
});

// 6時間ごとのバッチ処理

cron.schedule("0 */6 * * *", async () => {
  console.log("sixHoursBatch");
  await sixHoursBatch();
});
