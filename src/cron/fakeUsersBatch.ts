import cron from "node-cron";

import prisma from "../lib/db";
import {
  generatePostText,
  generateRandomImageUrl,
  getRandomObject,
  registerNotification,
} from "../lib/util";
import { NotificationType, Post, User } from "@prisma/client";
import likeSeeder from "../seeders/likeSeeder";
import {
  LIKES_PER_INFLUENCER,
  LIKES_PER_USER,
  NUMBER_OF_INFLUENCERS_FOLLOWERS,
  POSTS_PER_USER,
  REPLIES_PER_USER,
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
  try {
    // scheduledAtが現在時刻をすぎているPostを探して、sentAtに現在時刻を入れる
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

export async function batch5minPost() {
  try {
    console.log("batch5minPost -start");
    const testUserList = await prisma.user.findMany({
      where: {
        fakeFlag: true,
      },
    }); //登録されているフェイクのユーザーのリストを取得

    // 【要件】各ユーザーは毎日ランダムなテキストジェネレーターを使用した内容の異なる 3 つの投稿を行う
    // →5分ごとのバッチのついでに１０人が３ポストすればいい

    // 指定の数だけランダムにユーザーを取得する
    const pickedUpUsers = getRandomObject<User>(testUserList, 10);

    const newPosts: Array<any> = [];

    //一日当たり指定の回数ポストするように設定
    for (let user of pickedUpUsers) {
      for (let i = 0; i < POSTS_PER_USER; i++) {
        newPosts.push({
          text: generatePostText(200),
          img: generateRandomImageUrl(),
          imgFileType: "image/jpeg", //piscumは通常、jpegファイルを返すため
          userId: user.id,
          sentAt: new Date(),
        });
      }
    }

    // 【要件】1つのランダムに選ばれたメインの投稿に対して返信をします。=毎日 1 つのランダムなメイン投稿に返信する
    // →5分ごとのバッチのついでに１人がリプライすればいい

    const replyUserList = getRandomObject<User>(testUserList, 1);
    const toDate = new Date();
    const fromDate = new Date(toDate.getTime() - 24 * 3600 * 1000); // 24時間前の日時

    const testPostList: Post[] = await prisma.post.findMany({
      where: {
        sentAt: {
          gte: fromDate, //24時間以内に投稿されたポスト
          lt: toDate,
        },
        replyToId: null, //返信ではない、メインのポスト
        NOT: {
          sentAt: null,
        },
      },
    });

    // リプライしたいポストを選択
    const replyToPostList = getRandomObject<Post>(testPostList, 1);
    if (replyToPostList && replyToPostList.length > 0) {
      const replyToPost = replyToPostList[0];
      for (let user of replyUserList) {
        for (let i = 0; i < REPLIES_PER_USER; i++) {
          // リプライのデータをプッシュ
          newPosts.push({
            text: generatePostText(200),
            img: generateRandomImageUrl(),
            imgFileType: "image/jpeg", //piscumは通常、jpegファイルを返すため
            replyToId: replyToPost.id,
            userId: user.id,
            scheduledAt: null,
            sentAt: new Date(),
          });

          // 通知を登録
          await registerNotification(
            NotificationType.REPLY,
            replyToPost.userId,
            user.id,
            replyToPost.id
          );
        }
      }
    }
    // ポストを登録
    const posts = await prisma.post.createMany({
      data: newPosts,
      skipDuplicates: true,
    });

    console.log(`${posts.count} of  posts were sent!`);
  } catch (e: any) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

export async function batchReplyPost() {
  try {
    // 【要件】各ユーザーは毎日ランダムなテキストジェネレーターを使用した内容の異なる 3 つの投稿を行う

    // 【要件】1つのランダムに選ばれたメインの投稿に対して返信をします。=毎日 1 つのランダムなメイン投稿に返信する
    await replySeeder();
  } catch (e: any) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// // 一日に一回のバッチ処理

// cron.schedule("0 8 * * *", async () => {
//   console.log("dayBatchPost");
//   await dayBatchPost();
// });

// cron.schedule("0 12 * * *", async () => {
//   console.log("dayBatchReply");
//   await dayBatchReply();
// });

// 5分に一回のバッチ処理
cron.schedule("*/5 * * * *", async () => {
  console.log("fiveMinBatch");
  await fiveMinBatch();
  await batch5minPost();
});

// 6時間ごとのバッチ処理

cron.schedule("0 */6 * * *", async () => {
  console.log("sixHoursBatch");
  await sixHoursBatch();
});
