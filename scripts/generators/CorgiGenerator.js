const items = require("../../data/items.json");

var getRandom = function (items, odds) {
  if (odds.length === 0) {
    return items[Math.floor(Math.random() * items.length)];
  } else {
    let rnd = Math.floor(Math.random() * 100);
    var counter = 0;
    for (i = 0; i < odds.length; i++) {
      counter += odds[i] * 100;
      if (counter > rnd) {
        return items[i];
      }
    }
  }
};

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function formatValue(string) {
  console.log("🚀 | formatValue | string", string);
  if (string) {
    string = string.replace("_", " ");
    string = capitalizeFirstLetter(string);
    return string;
  }
}

module.exports = class CorgiGenerator {
  constructor() {
    this.BASE_ASSETS_PATH = `./assets`;
    this.index = 0;

    this.attributes = [];
    this.imageStack = [];

    // for quick access for conditions
    this.store = {};
  }

  newCorgi() {
    this.attributes = [];
    this.imageStack = [];

    // reset all traits
    for (let trait in this.store) {
      this.store[trait] = null;
    }
    return this;
  }

  select(trait) {
    const options = items[trait].items;
    const chance = items[trait].chance;
    let selectedOption = getRandom(options, chance);
    this.store[trait] = selectedOption;

    const path = selectedOption
      ? `${this.BASE_ASSETS_PATH}/${trait}__${selectedOption}`
      : null;

    return this.add(trait, null, selectedOption, path);
  }

  getAttributes() {
    return this.attributes;
  }

  getImageStack() {
    return this.imageStack;
  }

  add(traitType, displayType, value, imgPath) {
    let obj;
    [value] = value.split(".");

    if (value) {
      value = formatValue(value);

      // When the trait doesn't need to be added to attributes
      if (traitType) {
        traitType = formatValue(traitType);

        if (displayType) {
          obj = {
            trait_type: traitType,
            displayType: displayType,
            value: value,
          };
        } else {
          obj = {
            trait_type: traitType,
            value: value,
          };
        }
        this.attributes.push(obj);
      }
    }

    if (imgPath) {
      this.imageStack.push(imgPath);
    }
    return this;
  }

  generate() {
    this.newCorgi()
      .select("background")
      .select("body")
      .select("shirt")
      .select("face")
      .select("hat");
  }

  async generateMany(count) {
    for (let i = 0; i < count; i++) {
      await this.generate();
    }
  }
};
