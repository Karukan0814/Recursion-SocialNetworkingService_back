import prisma from "../lib/db";
import { PrismaClient, User } from "@prisma/client";
const bcrypt = require("bcryptjs");
import { fa, faker } from "@faker-js/faker";
import { registerNotification } from "../lib/util";
import { NotificationType } from "@prisma/client";
import {
  FOLLOWS_PER_USER,
  NUMBER_OF_INFLUENCERS,
  NUMBER_OF_INFLUENCERS_FOLLOWERS,
} from "./seederConatants";
import { getRandomObject } from "./seederUtils";

// 【要件】fakeユーザー2000人の中で、特定の 50 人の「インフルエンサー」アカウントがある

async function createInfluencers() {
  console.log("followSeeder_start");
  const testFollows = [];
  const testUserList: User[] = await prisma.user.findMany();

  if (testUserList.length > NUMBER_OF_INFLUENCERS) {
    //全ユーザーの中から50人をランダムにインフルエンサーアカウントとしてピックアップする
    const influencers = getRandomObject<User>(
      testUserList,
      NUMBER_OF_INFLUENCERS
    );
    console.log(
      "influencers",
      influencers.map((val) => val.id)
    );

    for (let influencer of influencers) {
      //全ユーザーの中から、当該インフルエンサー以外のユーザーリストを作成
      const filteredUsers = testUserList.filter(
        (user) => user.id !== influencer.id
      );

      // 各インフルエンサーには最低100人のフォロワーをつける
      const influencersFollowers = getRandomObject<User>(
        filteredUsers,
        NUMBER_OF_INFLUENCERS
      );
      const followerIds = influencersFollowers.map((val) => val.id);
      console.log(
        "influencersFollowers",
        influencersFollowers.map((val) => val.id)
      );
      const data = followerIds.map((id) => {
        return { followerId: id, followingId: influencer.id };
      });

      try {
        const newFollows = await prisma.follows.createMany({
          data,
          skipDuplicates: true,
        });

        for (let notice of data) {
          await registerNotification(
            NotificationType.FOLLOW,
            notice.followingId,
            notice.followerId
          );
        }
      } catch (e) {
        console.error("something wrong with following influencer");
      }
    }
  } else {
    console.log("Not enough users found in the database.");
  }
}

async function followSeeder() {
  console.log("followSeeder_start");

  // 各ユーザーにつき、3人にフォローされる

  const testUserList: User[] = await prisma.user.findMany();

  const influencers = getRandomObject<User>(
    testUserList,
    NUMBER_OF_INFLUENCERS
  );
  const influencersIds = influencers.map((val) => val.id);
  for (let user of testUserList) {
    let influencerFlag = false;
    if (influencersIds.includes(user.id)) {
      influencerFlag = true;
    }
    const filteredUsers = testUserList.filter((other) => other.id !== user.id);
    const randomUserList = getRandomObject(
      filteredUsers,
      influencerFlag ? NUMBER_OF_INFLUENCERS_FOLLOWERS : FOLLOWS_PER_USER
    );
    const followerIds = randomUserList.map((val) => val.id);
    console.log("followerIds", followerIds);
    const data = followerIds.map((id) => {
      return { followerId: id, followingId: user.id };
    });

    try {
      const newFollows = await prisma.follows.createMany({
        data,
        skipDuplicates: true,
      });

      for (let notice of data) {
        await registerNotification(
          NotificationType.FOLLOW,
          notice.followingId,
          notice.followerId
        );
      }
    } catch (e) {
      console.error("something wrong with following seed");
    }
  }
}

export default followSeeder;
