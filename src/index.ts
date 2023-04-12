import fs from "fs";
import { PNGWithMetadata } from "pngjs";
import { PNG } from "pngjs";

// size:4 -> r,g,b,a
type Pixel = Array<number>;
// block - this should end up as lenth of <outPixWidth>*<outPixHeight>
type Block = Array<Pixel>;

// Row of blocks
type BlockRow = Array<Block>;

// Full image represented as an array of blocks
type ImageInBlocks = Array<BlockRow>;

const loadPng = (fileName: string): PNGWithMetadata => {
  //const file =
  const file = fs.readFileSync(fileName);

  const png = PNG.sync.read(file);
  return png;
};

const savePng = (png: PNGWithMetadata, pathToSave: string) => {
  let buff = PNG.sync.write(png);

  fs.writeFileSync(pathToSave, buff);
};

const accumulateColors = (pixels: Array<Pixel>, i: number) =>
  pixels.reduce((acc, item) => {
    return acc + item[i];
  }, 0);

const getMeanOfColors = (pixels: Array<Pixel>): Pixel => {
  const redAccumulated = accumulateColors(pixels, 0);
  const red = redAccumulated / pixels.length;

  const greenAccumulated = accumulateColors(pixels, 1);
  const green = greenAccumulated / pixels.length;

  const blueAccumulated = accumulateColors(pixels, 2);
  const blue = blueAccumulated / pixels.length;

  // TODO: Rethink whether alpha should be in this
  const alphaAccumulated = accumulateColors(pixels, 3);
  const alpha = alphaAccumulated / pixels.length;

  return [red, green, blue, alpha];
};
// input: a jpeg

// algorithm ideas:
//  - take the most prevalent color and make it the main
//  - take the mean of colors
//  - in between - e.g. if a color makes up less than <15% ignore it, otherwise add it to the mean.
//
//(some grid shifting might be needed e.g if the first row is 1.5 pixel high instead of 1)
//(auto-detect pixel size?)
//
//  output: a fixed jpeg
//
//

const Strategies = Object.freeze({
  MAJORITY: "majority",
  MEAN: "mean",
  MAJORITYWITHIGNORE: "majorityWithIgnore",
} as const);

type StrategiesType = (typeof Strategies)[keyof typeof Strategies];

const fix = (
  outPixWidth: number,
  outPixHeight: number,
  strategy: StrategiesType = Strategies.MAJORITYWITHIGNORE
) => {
  const png = loadPng("./testgray.png");

  // alg here
  const imageHeight = png.height;
  const imageWidth = png.width;
  let imageData = png.data;

  const pixBlockSizeWidth = Number((imageWidth / outPixWidth).toFixed(0));
  const pixBlockSizeHeight = Number((imageHeight / outPixHeight).toFixed(0));

  console.log({ pixBlockSizeHeight, pixBlockSizeWidth });

  if (pixBlockSizeWidth !== pixBlockSizeHeight) {
    throw new Error(
      `Different pixel values for width and height. Pix block height: ${pixBlockSizeHeight}. Pix block width: ${pixBlockSizeWidth}`
    );
  }
  console.log({ imageWidth, imageHeight });
  let blocks: Array<Block> = [];

  for (let hI = 0; hI < imageHeight; hI++) {
    for (let wI = 0; wI < imageWidth; wI++) {
      // go through all pixels per row

      const idStart = imageWidth * hI + wI;
      const idx = idStart << 2;
      //console.log(imageData[idx], idx, idStart, hI, wI, rows.length);

      const currentPixel: Pixel = [
        imageData[idx],
        imageData[idx + 1],
        imageData[idx + 2],
        imageData[idx + 3],
      ];

      // Index in the current row
      const colIndex = wI % outPixWidth;
      const rowIndex = hI % outPixHeight;

      // this means we're at the row level of a new block
      if (rowIndex === 0 && colIndex === 0) {
        blocks.push([currentPixel]);
      } else {
        // Push to a corresponding block
        // Logic is - take the amount of blocks "over the current block"( Math.floor(hI / outPixHeight) * (outPixWidth - 1) )
        // and add the current column in the row we're currently traversing
        blocks[
          Math.floor(hI / outPixHeight) * (outPixWidth - 1) +
            Math.floor(wI / outPixWidth)
        ].push(currentPixel);
      }
    }
  }
  console.log(blocks);

  // Go through the blocks and mutate accordingly
  for (let bI = 0; bI < blocks.length; bI++) {
    const block = blocks[bI];
    switch (strategy) {
      case Strategies.MEAN:
        const mean = getMeanOfColors(block);
        console.log(mean);
        blocks[bI] = new Array(block.length).fill(mean);
        break;
      case Strategies.MAJORITY:
        break;
      case Strategies.MAJORITYWITHIGNORE:
        break;
    }
  }

  const flatmapped = blocks.flatMap((e) => e).flatMap((e) => e);

  for (let i = 0; i < imageData.length; i++) {
    imageData[i] = flatmapped[i];
  }

  console.log(flatmapped.length);
  console.log(imageData.length);
  savePng(png, "./test1out.png");
};

fix(4, 4, Strategies.MEAN);
