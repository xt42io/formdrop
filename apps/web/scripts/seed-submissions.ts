import { faker } from "@faker-js/faker";

const TARGET_URL = "http://localhost:1400/f/r9S2w03d";
const TOTAL_RECORDS = 2000;
const BATCH_SIZE = 1000;

async function sendSubmission() {
  const payload = {
    email: faker.internet.email(),
    name: faker.person.firstName(),
  };

  try {
    const response = await fetch(TARGET_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`Failed: ${response.status} ${response.statusText}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error sending submission:", error);
    return false;
  }
}

async function run() {
  console.log(`Starting seed of ${TOTAL_RECORDS} submissions to ${TARGET_URL}`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < TOTAL_RECORDS; i += BATCH_SIZE) {
    const currentBatchSize = Math.min(BATCH_SIZE, TOTAL_RECORDS - i);
    console.log(
      `Processing batch ${i / BATCH_SIZE + 1} (${currentBatchSize} records)...`,
    );

    const promises = [];
    for (let j = 0; j < currentBatchSize; j++) {
      promises.push(sendSubmission());
    }

    const results = await Promise.all(promises);

    const batchSuccess = results.filter((r) => r).length;
    const batchFail = results.filter((r) => !r).length;

    successCount += batchSuccess;
    failCount += batchFail;

    console.log(
      `Batch ${i / BATCH_SIZE + 1} complete. Success: ${batchSuccess}, Failed: ${batchFail}`,
    );
  }

  console.log("-----------------------------------");
  console.log(`Seeding complete.`);
  console.log(`Total Success: ${successCount}`);
  console.log(`Total Failed: ${failCount}`);
}

run().catch(console.error);
