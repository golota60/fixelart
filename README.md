## fixelart

A simple utility to fix AI-generated pixelart

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

```
export interface MinimumData {
  height: number;
  width: number;
  data: Buffer | Array<number>; // This is an array of RGBA values
  tolerance?: number; // Tolerance when comparing colors
  // e.g. for tolerance=1(default) rgba(1,1,1,1) would be "equal" to rgba(0,0,0,0) and rgba(2,2,2,2)
}
```

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

And here's an example usage with browser Canvas API

```ts
TODO!;
```

### Running examples

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
yarn example-all-stragegies ./tests/assets/test1.png 4 4
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

- `strategy` is one of the strategies(TODO: list all the strategies)
- `path_to_image` is the path to the source image
- `pixel_width` and `pixel_height` are values that indicate how much actual pixels are used in creating a pixel in output pixelart.
  e.g. if your source image is 1024x1024 and `pixel_width` and `pixel_height` are `4`, then the output image is going to be a 256-bit pixelart image.
