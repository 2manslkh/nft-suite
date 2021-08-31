const assetsFolder = "./assets/";
const fs = require("fs");
const dict = {};

function main() {
  fs.readdirSync(assetsFolder).forEach((file) => {
    let [category, itemName] = file.split("__");
    if (category in Object.keys(dict)) {
      dict[category]["items"].push(itemName);
    } else {
      dict[category] = { items: [], chance: [] };
      dict[category]["items"].push(itemName);
    }
  });

  let data = JSON.stringify(dict, null, 2);
  fs.writeFileSync(`data/items.json`, data);
}

main();
