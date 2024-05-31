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

export async function sendScheduledPost() {
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

export async function actionsByFakeUsers() {
  try {
    console.log("actionsByFakeUsers -start");
    // フェイクユーザーのユーザーリストを取得
    const testUserList = await prisma.user.findMany({
      where: {
        fakeFlag: true,
      },
      include: {
        followings: true,
      },
    }); //登録されているフェイクのユーザーのリストを取得

    // 【要件】各ユーザーは毎日ランダムなテキストジェネレーターを使用した内容の異なる 3 つの投稿を行う
    // →5分ごとのバッチのついでに7人が３ポストすればいい

    // 指定の数だけランダムにユーザーを取得する
    const pickedUpUsers = getRandomObject<User>(
      testUserList,
      Math.ceil(testUserList.length / (12 * 24))
    );

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

    // 【要件】各フェイクユーザーは一日当たりランダムに選択した５つのポストに「いいね」する

    // フェイクユーザーのリストからフォロワーの数が100を超えるユーザーを取得
    const influencerList = testUserList.filter(
      (user: { followings: string | any[] }) => {
        return user.followings.length >= NUMBER_OF_INFLUENCERS_FOLLOWERS;
      }
    );

    // インフルエンサーのIDリストを作成
    const influencerIds = influencerList.map((influencer) => influencer.id);

    // インフルエンサーになっているユーザーの２４時間以内のポストリストを取得
    const influencesrPosts = testPostList.filter((post) =>
      influencerIds.includes(post.userId)
    );
    console.log("influencesrPosts", influencesrPosts.length);

    // 先ほどランダムに選択したユーザーを使う
    const likeData: Array<any> = [];
    for (let user of pickedUpUsers) {
      // ランダムに５つの投稿をピックアップする
      const likePosts = getRandomObject<Post>(testPostList, LIKES_PER_USER);

      for (let likePost of likePosts) {
        likeData.push({
          postId: likePost.id,
          userId: user.id,
        });
      }

      // インフルエンサーの投稿からランダムに20の投稿をピックアップする
      const pickedUpInfluencersPosts = getRandomObject<Post>(
        testPostList,
        LIKES_PER_INFLUENCER
      );
      for (let likePost of pickedUpInfluencersPosts) {
        likeData.push({
          postId: likePost.id,
          userId: user.id,
        });
      }

      // いいねしたことを通知する
      for (let post of likePosts) {
        await registerNotification(
          NotificationType.Like,
          post.userId,
          user.id,
          post.id
        );
      }
    }

    // いいねを登録
    const newLike = await prisma.postLike.createMany({
      data: likeData,
      skipDuplicates: true,
    });

    console.log(`${newLike.count} of  likes were sent!`);
  } catch (e: any) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 5分に一回のバッチ処理 12*24=288回/日回るバッチ
cron.schedule("*/5 * * * *", async () => {
  console.log("fiveMinBatch");
  await sendScheduledPost(); //スケジュールされたポストを送信
  await actionsByFakeUsers(); //ランダムに選択されたユーザーが投稿・リプライする
});
