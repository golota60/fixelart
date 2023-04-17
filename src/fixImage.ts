import {
  Block,
  FixOptions,
  MinimumData,
  Pixel,
  Strategies,
  getAverageOfColors,
  getMajorityColor,
} from "./utils";

export const fixImage = <T extends MinimumData>(
  png: T,
  { outPixWidth, outPixHeight, strategy }: FixOptions
): T => {
  const imageHeight = png.height;
  const imageWidth = png.width;
  let imageData = png.data;

  const pixBlockSizeWidth = Number((imageWidth / outPixWidth).toFixed(0));
  const pixBlockSizeHeight = Number((imageHeight / outPixHeight).toFixed(0));

  if (pixBlockSizeWidth !== pixBlockSizeHeight) {
    throw new Error(
      `Different pixel values for width and height. Pix block height: ${pixBlockSizeHeight}. Pix block width: ${pixBlockSizeWidth}`
    );
  }
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
