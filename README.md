## fixelart

A simple utility to fix AI-generated pixelart

### Generating test data

All the test images are located inside `./tests/assets/` folder

Before running anything, install all the dependencies by running `yarn`.

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
