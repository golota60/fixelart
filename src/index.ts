import fs from "fs";
import { PNG, PNGWithMetadata } from "pngjs";
// TODO: Add a 'shift' option? that would "shift" the start by N pixels

// size:4 -> r,g,b,a
type Pixel = Array<number>;
// block - this should end up as lenth of <outPixWidth>*<outPixHeight>
type Block = Array<Pixel>;

// Row of blocks
type BlockRow = Array<Block>;

// Full image represented as an array of blocks
type ImageInBlocks = Array<BlockRow>;

/*
 * Loads a png using `pngjs`
 */
export const loadPng = (fileName: string): PNGWithMetadata => {
  const file = fs.readFileSync(fileName);

  const png = PNG.sync.read(file);
  return png;
};

/*
 * Saves a png using `pngjs`
 */
export const savePng = (png: PNGWithMetadata, pathToSave: string) => {
  let buff = PNG.sync.write(png);

  fs.writeFileSync(pathToSave, buff);
};

const accumulateColors = (pixels: Array<Pixel>, i: number) =>
  pixels.reduce((acc, item) => {
    return acc + item[i];
  }, 0);

const getAverageOfColors = (pixels: Array<Pixel>): Pixel => {
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

interface MajorityColorData {
  color: Pixel;
  occurences: number; // n of occurences
}

const compareWithTolerance = (
  val: number,
  val2: number,
  tolerance: number
): boolean => {
  return val + tolerance > val2 && val2 > val - tolerance;
};

const comparePixelPredicate = (
  pix: Pixel,
  pix2: Pixel,
  tolerance: number
): boolean => {
  return (
    compareWithTolerance(pix[0], pix2[0], tolerance) &&
    compareWithTolerance(pix[1], pix2[1], tolerance) &&
    compareWithTolerance(pix[2], pix2[2], tolerance) &&
    compareWithTolerance(pix[3], pix2[3], tolerance)
  );
};

const getMajorityColor = (
  pixels: Array<Pixel>,
  tolerance = 1
): MajorityColorData => {
  // TODO: write this shit performantly instead of like this
  const colorsAndOccurences = pixels.reduce((acc, pixel) => {
    const found = acc.find((pixOccurData) =>
      comparePixelPredicate(pixOccurData.color, pixel, tolerance)
    );
    if (!!found) {
      const filteredOut = acc.filter(
        (pixOccurData) =>
          !comparePixelPredicate(pixOccurData.color, pixel, tolerance)
      );
      return [{ ...found, occurences: found.occurences + 1 }, ...filteredOut];
    }
    return [...acc, { color: pixel, occurences: 1 }];
  }, [] as Array<MajorityColorData>);

  const majority = colorsAndOccurences.reduce((acc, pixOccurData, index) => {
    if (index === 0) return pixOccurData;
    return acc.occurences > pixOccurData.occurences ? acc : pixOccurData;
  }, {} as MajorityColorData);

  return majority;
};

// input: a png

// algorithm ideas:
//  - take the most prevalent color and make it the main
//  - take the average/mean of colors
//  - in between - e.g. if a color makes up less than <15% ignore it, otherwise add it to the mean.
//
//(some grid shifting might be needed e.g if the first row is 1.5 pixel high instead of 1)
//(auto-detect pixel size?)
//
//  output: a fixed jpeg
//
//
//

export const Strategies = Object.freeze({
  // take the color that takes the majority of the block
  MAJORITY: "majority",
  // just take the mean out of colors in the current block
  AVERAGE: "average",
  // take the color only if it is present for over X% of the image, otherwise take mean
  ALG50: 50,
  ALG60: 60,
  ALG70: 70,
  ALG80: 80,
  ALG90: 90,
} as const);

export type StrategiesType = (typeof Strategies)[keyof typeof Strategies];

interface FixOptions {
  outPixWidth: number;
  outPixHeight: number;
  strategy: StrategiesType;
}
export const fixImage = <T extends PNG = PNG>(
  png: T,
  { outPixWidth, outPixHeight, strategy }: FixOptions
): T => {
  //  const png = loadPng("./tests/assets/test1.png");

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

  // 1. Split into blocks
  for (let hI = 0; hI < imageHeight; hI++) {
    for (let wI = 0; wI < imageWidth; wI++) {
      const idStart = imageWidth * hI + wI;
      const idx = idStart << 2;

      const currentPixel: Pixel = [
        imageData[idx],
        imageData[idx + 1],
        imageData[idx + 2],
        imageData[idx + 3],
      ];

      const colIndex = wI % outPixWidth;
      const rowIndex = hI % outPixHeight;

      // this means we're at the row level of a new block
      if (rowIndex === 0 && colIndex === 0) {
        blocks.push([currentPixel]);
      } else {
        // Push to a corresponding block
        // Logic is
        // - take the amount of blocks "over the current block"
        // - and add the current column in the row we're currently traversing
        const blockIndex =
          Math.floor(hI / outPixHeight) * Math.floor(imageWidth / outPixWidth) +
          Math.floor(wI / outPixWidth);

        blocks[blockIndex].push(currentPixel);
      }
    }
  }

  // 2. Go through the blocks and mutate png according to strategy
  for (let bI = 0; bI < blocks.length; bI++) {
    const tolerance = 1;
    const block = blocks[bI];
    const { color, occurences } = getMajorityColor(block, tolerance);

    const average = getAverageOfColors(block);
    switch (strategy) {
      case Strategies.AVERAGE:
        blocks[bI] = new Array(block.length).fill(average);
        break;
      case Strategies.MAJORITY:
        // if the color is +/- tolerance value we treat it the same
        // e.g. 111,111,111,255 would equal 112,112,112,255 if tolerance > 1.
        // This is to account for potential export discrepancies
        // TODO: make it inputtable?

        blocks[bI] = new Array(block.length).fill(color);
        break;

      // get all the alg cases
      default:
        const coverage: number = occurences / (outPixWidth * outPixHeight);
        if (typeof strategy !== "number") {
          throw new Error("There is no such strategy");
        }

        if (coverage >= strategy) {
          blocks[bI] = new Array(block.length).fill(color);
        } else {
          blocks[bI] = new Array(block.length).fill(average);
        }
        break;
    }
  }

  // 3. De-blockify png and mutate it
  for (let hI = 0; hI < imageHeight; hI++) {
    for (let wI = 0; wI < imageWidth; wI++) {
      const idStart = imageWidth * hI + wI;
      // effectively start of data
      const idx = idStart << 2;

      const colIndex = wI % outPixWidth;
      const rowIndex = hI % outPixHeight;

      // Amount of things "over" the current block
      const currentBlockIndex =
        Math.floor(hI / outPixHeight) * Math.floor(imageWidth / outPixWidth) +
        //          rowIndex * outPixWidth +
        Math.floor(wI / outPixWidth);

      const currentBlock = blocks[currentBlockIndex];

      const baseIndex = Math.floor(hI % outPixHeight);

      imageData[idx] = currentBlock[baseIndex + colIndex][0];
      imageData[idx + 1] = currentBlock[baseIndex + colIndex][1];
      imageData[idx + 2] = currentBlock[baseIndex + colIndex][2];
      imageData[idx + 3] = currentBlock[baseIndex + colIndex][3];
    }
  }

  return png;
};
