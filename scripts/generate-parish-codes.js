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

function parseCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [];
  }

  const header = lines[0].toLowerCase();

  if (
    !header.includes("parish") ||
    !header.includes("access code")
  ) {
    throw new Error(
      "Invalid parish-access-codes.csv format."
    );
  }

  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    const commaIndex = line.lastIndexOf(",");

    if (commaIndex === -1) {
      continue;
    }

    let parish = line.slice(0, commaIndex).trim();
    const accessCode = line
      .slice(commaIndex + 1)
      .trim();

    if (
      parish.startsWith('"') &&
      parish.endsWith('"')
    ) {
      parish = parish
        .slice(1, -1)
        .replace(/""/g, '"');
    }

    if (!parish || !accessCode) {
      continue;
    }

    records.push({
      parish,
      accessCode,
    });
  }

  return records;
}

function createCsv(records) {
  const lines = [
    "Parish,Access Code",
    ...records.map((item) => {
      const parish = `"${String(item.parish).replace(
        /"/g,
        '""'
      )}"`;

      return `${parish},${item.accessCode}`;
    }),
  ];

  return lines.join("\n");
}

async function main() {
  const env = loadEnv();

  const uri = env.MONGODB_URI;
  const dbName = env.MONGODB_DB || "ninad2026";

  if (!uri) {
    throw new Error(
      "MONGODB_URI is missing from .env.local"
    );
  }

  const outputPath = path.join(
    process.cwd(),
    "parish-access-codes.csv"
  );

  console.log("");
  console.log(
    "NINAD 2026 - Permanent Parish Access Code Manager"
  );
  console.log(
    "--------------------------------------------------"
  );
  console.log("");

  /*
   * Load the existing CSV if it exists.
   *
   * Existing codes are NEVER replaced.
   */
  const existingCodes = new Map();

  if (fs.existsSync(outputPath)) {
    const csvText = fs.readFileSync(
      outputPath,
      "utf8"
    );

    const records = parseCsv(csvText);

    for (const record of records) {
      existingCodes.set(
        record.parish,
        record.accessCode
      );
    }

    console.log(
      `Existing CSV found with ${existingCodes.size} codes.`
    );
  } else {
    console.log(
      "No existing CSV found."
    );
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();

    const db = client.db(dbName);
    const collection = db.collection("parishes");

    const parishes = await collection
      .find({})
      .sort({ name: 1 })
      .toArray();

    console.log(
      `Found ${parishes.length} parishes in MongoDB.`
    );

    if (parishes.length !== 125) {
      console.log(
        `WARNING: Expected 125 parishes, found ${parishes.length}.`
      );
    }

    const output = [];

    /*
     * Track codes so no two parishes can receive
     * the same access code.
     */
    const usedCodes = new Set(
      Array.from(existingCodes.values()).map(
        (code) => code.toUpperCase()
      )
    );

    for (const parish of parishes) {
      const parishName = parish.name;

      /*
       * CASE 1:
       * Existing CSV code exists.
       *
       * Keep it permanently.
       */
      if (existingCodes.has(parishName)) {
        const existingCode =
          existingCodes.get(parishName);

        const existingHash =
          hashCode(existingCode);

        /*
         * If MongoDB already has a hash, verify that
         * it matches the CSV code.
         *
         * If it doesn't match, STOP instead of
         * changing anything.
         */
        if (parish.parishAccessCodeHash) {
          if (
            parish.parishAccessCodeHash !==
            existingHash
          ) {
            throw new Error(
              `SECURITY ERROR: CSV code does not match MongoDB hash for "${parishName}". No changes were made.`
            );
          }
        } else {
          /*
           * Hash exists in CSV but not in MongoDB.
           * Store the hash.
           */
          await collection.updateOne(
            { _id: parish._id },
            {
              $set: {
                parishAccessCodeHash:
                  existingHash,
              },
            }
          );
        }

        output.push({
          parish: parishName,
          accessCode: existingCode,
        });

        continue;
      }

      /*
       * CASE 2:
       * MongoDB already has a hash but the CSV
       * doesn't contain the actual code.
       *
       * We cannot recover the original code from
       * the hash, so STOP.
       */
      if (parish.parishAccessCodeHash) {
        throw new Error(
          `SECURITY ERROR: "${parishName}" already has an access code in MongoDB, but its actual code is missing from the CSV. The existing code will NOT be changed.`
        );
      }

      /*
       * CASE 3:
       * This parish has never received a code.
       *
       * Generate one.
       */
      let code = generateCode();

      while (
        usedCodes.has(code.toUpperCase())
      ) {
        code = generateCode();
      }

      usedCodes.add(code.toUpperCase());

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
        parish: parishName,
        accessCode: code,
      });

      console.log(
        `Generated new code for: ${parishName}`
      );
    }

    /*
     * Save the complete permanent code list.
     */
    fs.writeFileSync(
      outputPath,
      createCsv(output),
      "utf8"
    );

    console.log("");
    console.log("SUCCESS");
    console.log(
      `Total parishes: ${output.length}`
    );
    console.log(
      `Permanent access codes: ${output.length}`
    );
    console.log("");
    console.log(
      `CSV: ${outputPath}`
    );
    console.log("");
    console.log(
      "Existing parish access codes were preserved."
    );
    console.log(
      "Only new/unassigned parishes receive new codes."
    );
    console.log(
      "Only hashed codes are stored in MongoDB."
    );
    console.log("");
    console.log(
      "IMPORTANT: Keep parish-access-codes.csv private."
    );
    console.log("");
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error("");
  console.error("FAILED");
  console.error(error.message || error);
  console.error("");
  process.exit(1);
});