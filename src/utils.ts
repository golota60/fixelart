// TODO: Add a 'shift' option? that would "shift" the start by N pixels

// size:4 -> r,g,b,a
export type Pixel = Array<number>;
// block - this should end up as lenth of <outPixWidth>*<outPixHeight>
export type Block = Array<Pixel>;

export interface MinimumData {
  height: number;
  width: number;
  // For our usage, it doesn't matter whether it's a buffer or an array
  data: Buffer | Array<number>;
}

export const Strategies = Object.freeze({
  // take the color that takes the majority of the block
  MAJORITY: "majority",
  // just take the mean out of colors in the current block
  AVERAGE: "average",
  // take the color only if it is present for over X% of the image, otherwise take average
  ALG05: 0.05,
  ALG10: 0.1,
  ALG20: 0.2,
  ALG30: 0.3,
  ALG40: 0.4,
  ALG50: 0.5,
  ALG60: 0.6,
  ALG70: 0.7,
  ALG80: 0.8,
  ALG90: 0.9,
} as const);

export type StrategiesType = (typeof Strategies)[keyof typeof Strategies];

export interface FixOptions {
  outPixWidth: number;
  outPixHeight: number;
  strategy: StrategiesType;
}

const accumulateColors = (pixels: Array<Pixel>, i: number) =>
  pixels.reduce((acc, item) => {
    return acc + item[i];
  }, 0);

export const getAverageOfColors = (pixels: Array<Pixel>): Pixel => {
  const redAccumulated = accumulateColors(pixels, 0);
  const red = redAccumulated / pixels.length;

  const greenAccumulated = accumulateColors(pixels, 1);
  const green = greenAccumulated / pixels.length;

  const blueAccumulated = accumulateColors(pixels, 2);
  const blue = blueAccumulated / pixels.length;

  // TODO: Rethink whether alpha should be in this
  const alphaAccumulated = accumulateColors(pixels, 3);
  const alpha = alphaAccumulated / pixels.length;

  return [
    Math.round(red),
    Math.round(green),
    Math.round(blue),
    Math.round(alpha),
  ];
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

export const getMajorityColor = (
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
