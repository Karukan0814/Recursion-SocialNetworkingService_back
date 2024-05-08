import followSeeder from "./followSeeder";
import likeSeeder from "./likeSeeder";
import postSeeder from "./postSeeder";
import replySeeder from "./replySeeder";
import userSeeder from "./userSeeder";

const seeders = ["userSeeder"]; //seederの名前を配列で格納
async function runAllSeeders() {
  try {
    // for (const seederName of seeders) {
    //   const seeder = await import(`./${seederName}`);
    //   console.log(seeder);
    //   await seeder.default();
    //   console.log(`${seederName} executed successfully.`);
    // }

    // await userSeeder();
    // await postSeeder();
    // await replySeeder();
    // await likeSeeder();
    await followSeeder();

    // 他のシーダー関数もここで呼び出す
    console.log("All seeders executed successfully.");
  } catch (error) {
    console.error("Failed to execute seeders:", error);
  }
  process.exit();
}

runAllSeeders();
