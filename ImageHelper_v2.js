"use strict";
/*
 * Copyright 2020 Google Inc. All Rights Reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageHelper = void 0;
const path = require("path");
const fs = require("fs");
const Jimp = require("jimp");
const FetchUtils_1 = require("./node_modules/@bubblewrap/core/dist/lib/FetchUtils");
const util_1 = require("util");
const svg2img_1 = require("./node_modules/@bubblewrap/core/dist/lib/wrappers/svg2img");
// fs.promises is marked as experimental. This should be replaced when stable.
const fsMkDir = util_1.promisify(fs.mkdir);
class ImageHelper {
    async saveIcon(image_data, size, fileName, backgroundColor) {
        const image = await Jimp.read(image_data);
        // Jimp creates artifacts when upscaling images that have an alpha channel. This happens
        // because even when a pixel is fully transparent the RGB part of the color still gets blended
        // with other pixels. To avoid this, we apply the RGB part of `backgroundColor` to transparent
        // pixels so they are blended with that color instead and match a background.
        // See https://github.com/GoogleChromeLabs/bubblewrap/issues/488#issuecomment-806560923.
        if (backgroundColor && image.hasAlpha()) {
            // The replacement colour is the same as the background colour, but fully transparent.
            const replacementColor = ((backgroundColor.rgbNumber() << 8) & 0xFFFFFF00) >>> 0;
            // Iterate over the pixels, check for fully transparent ones and replace with
            // replacementColor.
            for (let y = 0; y < image.getHeight(); y++) {
                for (let x = 0; x < image.getWidth(); x++) {
                    const color = image.getPixelColour(x, y);
                    // Apply replacement color if the pixel is fully transparent.
                    if ((color & 0xFF) === 0) {
                        image.setPixelColour(replacementColor, x, y);
                    }
                }
            }
        }
        image.resize(size, size);
        await image.writeAsync(fileName);
    }
    /**
     * Generate a file for the given icon inside targetDir.
     *
     * @param {Object} image Object containing /*the original URL and*//* the icon image data.
     * @param {string} targetDir Path to the directory the image will be saved in.
     * @param {Object} iconDef Icon definitions specifying the size the icon should be exported as.
     */
    async generateIcon(image, targetDir, iconDef, backgroundColor) {
        const destFile = path.join(targetDir, iconDef.dest);
        await fsMkDir(path.dirname(destFile), { recursive: true });
        return await this.saveIcon(/*icon*/ image, iconDef.size, destFile, backgroundColor);
    }
    /**
     * Set the color of a monochrome icon to be the theme color.
     *
     * @param {Object} icon Original monochrome icon to use.
     * @param {Color} themeColor Color to use for the icon.
     * @returns New image data.
     */
    async monochromeFilter(icon, themeColor) {
        const image = await Jimp.read(icon.data);
        image.color([
            // Set all pixels to black/0
            { apply: 'red', params: [-255] },
            { apply: 'green', params: [-255] },
            { apply: 'blue', params: [-255] },
            // Add to channels using theme color
            { apply: 'red', params: [themeColor.red()] },
            { apply: 'green', params: [themeColor.green()] },
            { apply: 'blue', params: [themeColor.blue()] },
        ]);
        return { url: icon.url, data: image };
    }
    /**
     * Fetches an Icon.
     *
     * @param {string} iconUrl the URL to fetch the icon from.
     * @returns an Object containing the original URL and the icon image data.
     */
    async fetchIcon(iconUrl) {
        const response = await FetchUtils_1.fetchUtils.fetch(iconUrl);
        if (response.status !== 200) {
            throw new Error(`Failed to download icon ${iconUrl}. Responded with status ${response.status}`);
        }
        const contentType = response.headers.get('content-type');
        if (!(contentType === null || contentType === void 0 ? void 0 : contentType.startsWith('image/'))) {
            throw new Error(`Received icon "${iconUrl}" with invalid Content-Type.` +
                ` Responded with Content-Type "${contentType}"`);
        }
        let body = await response.arrayBuffer();
        if (contentType.startsWith('image/svg')) {
            if (!svg2img_1.isSvgSupported()) {
                throw new Error(`This installation doesn't support image/svg. Please, ensure the optional
            "svg2img" library is installed or use an alternative image format.`);
            }
            try {
                body = await svg2img_1.svg2img(iconUrl);
            }
            catch (error) {
                throw new Error(`Problem reading ${iconUrl}: ${error.message}`);
            }
        }
        return {
            url: iconUrl,
            data: await Jimp.read(Buffer.from(body)),
        };
    }
}
exports.ImageHelper = ImageHelper;
