// ONLY PINS IMAGE DATA

const pinataSDK = require("@pinata/sdk");
require("dotenv").config();
const AUIndex = require("../data/AUindex.json");
// console.log("🚀 | AUIndex", AUIndex);
const checkpoint = require("../data/checkpoint.json");
console.log("🚀 | checkpoint", checkpoint);
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_API_SECRET_KEY = process.env.PINATA_API_SECRET_KEY;
const fs = require("fs");

const COUNT = 10;

async function main() {
  const pinata = pinataSDK(PINATA_API_KEY, PINATA_API_SECRET_KEY);

  const pinData = async (index, imageHash, metadataHash) => {
    console.log(index);
    let options = {
      pinataMetadata: {
        name: `${index}_image`,
      },
    };

    let tx = await pinata.pinByHash(imageHash, options);

    options = {
      pinataMetadata: {
        name: `${index}_metadata`,
      },
    };

    tx = await pinata.pinByHash(metadataHash, options);
    // console.log("🚀 | pinData | tx", tx);
  };

  // Loop through Hashes
  for (let i = checkpoint["AU_pin"]; i <= AUIndex.length; i++) {
    await pinData(i, AUIndex[i - 1]["image"], AUIndex[i - 1]["metadata"]);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
