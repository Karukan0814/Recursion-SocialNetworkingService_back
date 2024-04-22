import resetDb from "./reset-db";
import { PrismaClient } from "@prisma/client";
import { testUsers } from "./testData/testUsers";
import { testCategory } from "./testData/testCategory";

// function generateRandomString(length: number) {
//   const characters =
//     "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
//   let result = "";
//   for (let i = 0; i < length; i++) {
//     const randomIndex = Math.floor(Math.random() * characters.length);
//     result += characters.charAt(randomIndex);
//   }
//   return result;
// }

// const prisma = new PrismaClient();
// beforeAll(async () => {
//   console.log("setup");

//   await resetDb();
// });

// beforeEach(async () => {
//   console.log("setup");

//   await resetDb();

//   // const users = await prisma.user.findMany();
//   // console.log("users", users);

//   await prisma.user.createMany({
//     data: testUsers.map((user) => {
//       return {
//         uid: generateRandomString(16),
//         name: user.name,
//         userImg: user.userImg,
//         isAdmin: user.isAdmin,
//         introduction: user.introduction,
//       };
//     }),
//   });

//   // await prisma.category.createMany({ data: testCategory });
//   // const afterusers = await prisma.user.findMany();
//   // console.log("afterusers", afterusers);
// });

// afterEach(async () => {
//   await prisma.$disconnect();
// });
