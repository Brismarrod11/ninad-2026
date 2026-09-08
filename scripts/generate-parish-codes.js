const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { MongoClient } = require("mongodb");

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");

  if (!fs.existsSync(envPath)) {
    throw new Error(".env.local not found");
  }

  const text = fs.readFileSync(envPath, "utf8");

  const env = {};

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const index = trimmed.indexOf("=");

    if (index === -1) {
      continue;
    }

    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();

    env[key] = value.replace(/^["']|["']$/g, "");
  }

  return env;
}

function generateCode() {
  const part1 = crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase();

  const part2 = crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase();

  return `${part1}-${part2}`;
}

function hashCode(code) {
  return crypto
    .createHash("sha256")
    .update(code.trim().toUpperCase())
    .digest("hex");
}

async function main() {
  const env = loadEnv();

  const uri = env.MONGODB_URI;
  const dbName = env.MONGODB_DB || "ninad2026";

  if (!uri) {
    throw new Error("MONGODB_URI is missing from .env.local");
  }

  console.log("");
  console.log("NINAD 2026 - Parish Access Code Generator");
  console.log("-------------------------------------------");
  console.log("");

  const client = new MongoClient(uri);

  try {
    await client.connect();

    const db = client.db(dbName);
    const collection = db.collection("parishes");

    const parishes = await collection
      .find({})
      .sort({ name: 1 })
      .toArray();

    console.log(`Found ${parishes.length} parishes.`);

    if (parishes.length !== 125) {
      console.log(
        `WARNING: Expected 125 parishes, found ${parishes.length}.`
      );
    }

    const output = [];

    for (const parish of parishes) {
      let code = generateCode();

      while (
        output.some(
          (item) => item.accessCode === code
        )
      ) {
        code = generateCode();
      }

      const hash = hashCode(code);

      await collection.updateOne(
        { _id: parish._id },
        {
          $set: {
            parishAccessCodeHash: hash,
          },
        }
      );

      output.push({
        parish: parish.name,
        accessCode: code,
      });
    }

    const csvLines = [
      "Parish,Access Code",
      ...output.map((item) => {
        const parish = `"${String(item.parish).replace(/"/g, '""')}"`;

        return `${parish},${item.accessCode}`;
      }),
    ];

    const outputPath = path.join(
      process.cwd(),
      "parish-access-codes.csv"
    );

    fs.writeFileSync(
      outputPath,
      csvLines.join("\n"),
      "utf8"
    );

    console.log("");
    console.log("SUCCESS");
    console.log(`Generated ${output.length} access codes.`);
    console.log("");
    console.log(`CSV created: ${outputPath}`);
    console.log("");
    console.log(
      "Only hashed codes were stored in MongoDB."
    );
    console.log(
      "Keep the CSV private and distribute each code only to its parish."
    );
    console.log("");
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error("");
  console.error("FAILED");
  console.error(error);
  process.exit(1);
});