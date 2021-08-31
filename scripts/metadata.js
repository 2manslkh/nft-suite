const Hash = require("ipfs-only-hash");

const fs = require("fs");
require("dotenv").config();
const IPFS_GATEWAY = process.env.IPFS_GATEWAY;
const GENERATED_IMAGES_PATH = "./assets/generated/images/";

async function main() {
  // Initialize Provenance Data
  let provenanceString = "";
  let provenanceData = { provenanceString: "", provenanceHash: "" };
  let fileList = [];

  // Loop through all assets
  let numAssets = 0;
  fs.readdirSync(GENERATED_IMAGES_PATH).forEach(async (file) => {
    numAssets += 1;
  });

  for (let index = 1; index <= numAssets; index++) {
    const readableStreamForFile = fs.createReadStream(
      `${GENERATED_IMAGES_PATH}${index}.png`
    );

    // Get Image Hash
    const imageHash = await Hash.of(readableStreamForFile);

    // Read Image Data
    provenanceString += imageHash;

    // Make Metadata Body
    const body = {
      name: `CheekyCorgi #${index}`,
      description: `CheekyCorgi #${index}`,
      image: `${IPFS_GATEWAY}${imageHash}`,
      external_link: "", // TODO:
      seller_fee_basis_points: 250, // Indicates a 2.5% seller fee.
      fee_recipient: "", // TODO:
      attributes: require(`../assets/generated/attributes/${index}.json`),
    };

    // Write data to metadata file
    fs.writeFileSync(
      `./assets/generated/metadata/${index}`,
      JSON.stringify(body, null, 2)
    );

    // Append Data to CSV File for future use
    line = `${index},${imageHash}\n`;
    fs.appendFileSync("./data/record.csv", line, (err) => {});
  }

  provenanceData["provenanceString"] = provenanceString;
  provenanceData["provenanceHash"] = await Hash.of(
    JSON.stringify(provenanceString)
  );
  // Write Provenence data to text file
  fs.writeFileSync(
    `./data/provenance.json`,
    JSON.stringify(provenanceData, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
