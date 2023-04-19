## fixelart

A simple utility to fix AI-generated pixelart. Read about how it came to be [here](https://szymon.codes/blog/fixing-ai-pixelart) or use the [playground](https:/szymon.codes/fixelart-playground)

### Installation

Using yarn

```ts
yarn add fixelart
```

or npm

```ts
npm install fixelart
```

### Usage

The `fixImage` function accepts an object with the following structure

```ts
import { fixImage } from "fixelart";

export interface MinimumData {
  height: number;
  width: number;
  data: Buffer | Array<number>; // This is an array of RGBA values
}

export interface FixOptions {
  // Output pixel width
  outPixWidth: number;
  // Output pixel height
  outPixHeight: number;
  // Strategy to use
  strategy: StrategiesType;
  // Tolerance to be used for mode algorithms
  // e.g. for tolerance=1 rgba(1,1,1,1) would be "equal" to rgba(0,0,0,0) and rgba(2,2,2,2)
  tolerance?: number; // default = 1
  // Whether the output should be shrunk so that an output pixel is actually a pixel
  shrinkOutput?: boolean; // default = false
}

fixImage(png: MinimumData, options: FixOptions)
```

### Strategies

Below you can find all the existing strategies and what they do underneath the hood. PRs are open for more!

- Strategies.MAJORITY - take the color that occurs the most often in the block
- Strategies.AVERAGE - take the average of colors in the blocks
- Strategies.ALG(05|10|20|30|40|50|60|70|80|90) - a mix; if a color is making up above X%, then take it, otherwise take the average

### Examples

Here's an example usage with `pngjs`.

```ts
import { fixImage } from "fixelart";
import fs from "fs";
import { PNGWithMetadata } from "pngjs";

export const loadPng = (fileName: string): PNGWithMetadata => {
  const file = fs.readFileSync(fileName);

  const png = PNG.sync.read(file);
  return png;
};

export const savePng = (png: PNGWithMetadata, pathToSave: string) => {
  let buff = PNG.sync.write(png);

  fs.writeFileSync(pathToSave, buff);
};

const png = loadPng(path);

const fixedImage = fixImage(png, { outPixWidth, outPixHeight, strategy });

savePng(fixedImage, "./output.png");
```

You could also use it pretty easily in the browser with Canvas Browser API(todo!) as demonstrated in the [demo](szymon.codes/fixelart-playground)

### Interactive examples

All the test images are located inside `tests/assets` folder

Before running anything, install all the dependencies by running `yarn`.

There are currently two examples

1. Generate all the algorithms for an images

This generates all the possible variations of your "fixed" pixelart for every rounding strategy(e.g. average, mean of the colors in the pixel).

Recipe:

```
yarn example-all-strategies <path_to_image> <pixel_width> <pixel_height>
```

example:

```
yarn example-all-strategies ./tests/assets/test-face.png 8 8
```

2. Generate all the test images for an algorithm

Recipe:

```
yarn example-all-images <strategy> <pixel_width> <pixel_height>
```

example:

```
yarn example-all-images MEAN 4 4
```

where

- `strategy` is one of the strategies
- `path_to_image` is the path to the source image
- `pixel_width` and `pixel_height` are values that indicate how much actual pixels are used in creating a pixel in output pixelart.
  e.g. if your source image is 1024x1024 and `pixel_width` and `pixel_height` are `4`, then the output image is going to be a 256-bit pixelart image.
