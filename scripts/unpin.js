// ONLY PINS IMAGE DATA

const pinataSDK = require("@pinata/sdk");
require("dotenv").config();

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_API_SECRET_KEY = process.env.PINATA_API_SECRET_KEY;

const unpinList = [];

async function main() {
  const pinata = pinataSDK(PINATA_API_KEY, PINATA_API_SECRET_KEY);

  // Loop through Hashes
  for (let i = 0; i < unpinList.length; i++) {
    // let hash = pinList["rows"][i]["ipfs_pin_hash"];
    let hash = unpinList[i];
    console.log("🚀 | main | hash", hash);
    try {
      await pinata.unpin(hash);
    } catch (error) {
      console.log(error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
