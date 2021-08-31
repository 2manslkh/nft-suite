const fs = require("fs");
// const { Canvas } = require("canvas-constructor/cairo");
const { createCanvas, loadImage } = require("canvas");

const CorgiGenerator = require("./generators/CorgiGenerator");

class MasterGenerator {
  constructor(height, width) {
    this.width = width;
    this.height = height;
    this.index = 1;

    this.attributes = [];
    this.imageStack = [];
    this.corgiGenerator = new CorgiGenerator();
    this.huskyGenerator = new HuskyGenerator();
  }
  y;

  generateJSON(attributes) {
    // convert JSON object to string
    const data = JSON.stringify(attributes, null, 2);
    fs.writeFileSync(`./assets/generated/attributes/${this.index}.json`, data);
    return this;
  }

  async generateImage(imageStack, type) {
    let image;
    let canvas = createCanvas(this.width, this.height);
    let context = canvas.getContext("2d");

    console.log(this.index, imageStack);

    if (imageStack.length > 0) {
      for (let i = 0; i < imageStack.length; i++) {
        image = await loadImage(imageStack[i]);
        context.drawImage(image, 0, 0);
      }

      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(`./assets/generated/images/${this.index}.png`, buffer);
      console.log("done");
    }
    return this;
  }

  async generate(generator) {
    generator.generate();
    let attributes = generator.getAttributes();
    let imageStack = generator.getImageStack();
    await this.generateImage(imageStack);
    this.generateJSON(attributes);
    this.index += 1;
  }

  async generateMany(count) {
    for (let i = 0; i < count; i++) {
      await this.generate(this.corgiGenerator);
    }
  }
}

async function main() {
  const height = 2000;
  const width = 2000;

  gen = new MasterGenerator(height, width);
  await gen.generateMany(100);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
