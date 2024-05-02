import prisma from "../lib/db";
const bcrypt = require("bcryptjs");
import { faker } from "@faker-js/faker";

function generatePostText() {
  const text = faker.lorem.paragraphs();
  const trimmedText = text.slice(0, 200);
  return trimmedText;
}

function generateRandomImageUrl() {
  const width = faker.datatype.number({ min: 100, max: 1000 });
  const height = faker.datatype.number({ min: 100, max: 1000 });
  return `https://picsum.photos/${width}/${height}`;
}

async function followSeeder() {
  console.log("followSeeder_start");
  const testReplies = [];
  const testUserList = await prisma.user.findMany();

  if (testUserList.length > 1) {
    for (let i = 0; i < testUserList.length; i++) {
      const followingUser = testUserList[i];
      const filteredUsers = testUserList.filter(
        (user) => user.id !== followingUser.id
      );
      const randomIndex = Math.floor(Math.random() * filteredUsers.length);
      const followerUser = filteredUsers[randomIndex];

      testReplies.push({
        followerId: followerUser.id,
        followingId: followingUser.id,
      });
    }

    try {
      await prisma.follows.createMany({
        data: testReplies,
        skipDuplicates: true,
      });
      console.log("Follows seeded successfully.");
    } catch (error) {
      console.error("Follows insert failed:", error);
    }
    console.log("Follows seeded");
  } else {
    console.log("Not enough users found in the database.");
  }
}

export default followSeeder;
