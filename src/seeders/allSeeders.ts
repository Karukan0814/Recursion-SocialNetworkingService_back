import userSeeder from "./userSeeder";

const seeders = ["userSeeder"]; //seederの名前を配列で格納
async function runAllSeeders() {
  try {
    for (const seederName of seeders) {
      const seeder = await import(`./${seederName}`);
      console.log(seeder);
      await seeder.default();
      console.log(`${seederName} executed successfully.`);
    }

    // await userSeeder();
    // 他のシーダー関数もここで呼び出す
    console.log("All seeders executed successfully.");
  } catch (error) {
    console.error("Failed to execute seeders:", error);
  }
  process.exit();
}

runAllSeeders();
