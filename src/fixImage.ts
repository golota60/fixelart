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
  {
    outPixWidth,
    outPixHeight,
    strategy,
    tolerance = 1,
    shrinkOutput = false,
  }: FixOptions
): T => {
  const imageHeight = png.height;
  const imageWidth = png.width;
  let imageData = [...png.data];

  const pixBlockSizeWidth = Number((imageWidth / outPixWidth).toFixed(0));
  const pixBlockSizeHeight = Number((imageHeight / outPixHeight).toFixed(0));

  // Round down the image to width and height mathcing X*pixel
  const adjustedWidth = Math.floor(imageWidth / outPixWidth) * outPixWidth;
  const adjustedHeight = Math.floor(imageHeight / outPixHeight) * outPixHeight;

  const widthOffset = imageWidth - adjustedWidth;
  const heightOffset = imageHeight - adjustedHeight;

  let blocks: Array<Block> = [];

  // 1. Split into blocks
  for (let hI = 0; hI < adjustedHeight; hI++) {
    for (let wI = 0; wI < adjustedWidth; wI++) {
      const idStart = imageWidth * hI + wI; // - widthOffset * wI - heightOffset * hI;
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

  if (shrinkOutput) {
    const outData = blocks.flatMap((e) => e[0]);
    return {
      ...png,
      width: adjustedWidth / outPixWidth,
      height: adjustedHeight / outPixHeight,
      data: outData,
    };
  } else {
    // 3. De-blockify png and mutate it
    for (let hI = 0; hI < adjustedHeight; hI++) {
      for (let wI = 0; wI < adjustedWidth; wI++) {
        const idStart = adjustedWidth * hI + wI;
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

    return {
      ...png,
      width: adjustedWidth,
      height: adjustedHeight,
      data: imageData,
    };
  }
};
