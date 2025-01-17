"use strict";
/*
 * Copyright 2019 Google Inc. All Rights Reserved.
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
exports.TwaGenerator_v2 = void 0;
const path = require("path");
const fs = require("fs");
const lodash_1 = require("lodash");
const util_1 = require("util");
//sundy const ImageHelper_1 = require("./node_modules/@bubblewrap/core/dist/lib/ImageHelper");
const ImageHelper_2 = require("./ImageHelper_v2");
const FeatureManager_1 = require("./node_modules/@bubblewrap/core/dist/lib/features/FeatureManager");
const util_2 = require("./node_modules/@bubblewrap/core/dist/lib/util");
const FetchUtils_1 = require("./node_modules/@bubblewrap/core/dist/lib/FetchUtils");
//import { isWebUri } from 'valid-url';
const  valid_url = require('valid-url');

const Jimp = require("jimp");
const { stringify } = require("querystring");

const COPY_FILE_LIST = [
    'settings.gradle',
    'gradle.properties',
    'build.gradle',
    'gradlew',
    'gradlew.bat',
    'gradle/wrapper/gradle-wrapper.jar',
    'gradle/wrapper/gradle-wrapper.properties',
    'app/src/main/res/values/colors.xml',
    'app/src/main/res/xml/filepaths.xml',
    'app/src/main/res/xml/shortcuts.xml',
    'app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml',
    'app/src/main/res/drawable-anydpi/shortcut_legacy_background.xml',
];
const TEMPLATE_FILE_LIST = [
    'app/build.gradle',
    'app/src/main/AndroidManifest.xml',
    'app/src/main/res/values/strings.xml',
];
const JAVA_DIR = 'app/src/main/java/';
const JAVA_FILE_LIST = [
    'LauncherActivity.java',
    'Application.java',
    'DelegationService.java',
];
const DELETE_PROJECT_FILE_LIST = [
    'settings.gradle',
    'gradle.properties',
    'build.gradle',
    'gradlew',
    'gradlew.bat',
    'store_icon.png',
    'gradle/',
    'app/',
];
const DELETE_FILE_LIST = [
    'app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml',
];
const SPLASH_IMAGES = [
    { dest: 'app/src/main/res/drawable-mdpi/splash.png', size: 300 },
    { dest: 'app/src/main/res/drawable-hdpi/splash.png', size: 450 },
    { dest: 'app/src/main/res/drawable-xhdpi/splash.png', size: 600 },
    { dest: 'app/src/main/res/drawable-xxhdpi/splash.png', size: 900 },
    { dest: 'app/src/main/res/drawable-xxxhdpi/splash.png', size: 1200 },
];
const IMAGES = [
    { dest: 'app/src/main/res/mipmap-mdpi/ic_launcher.png', size: 48 },
    { dest: 'app/src/main/res/mipmap-hdpi/ic_launcher.png', size: 72 },
    { dest: 'app/src/main/res/mipmap-xhdpi/ic_launcher.png', size: 96 },
    { dest: 'app/src/main/res/mipmap-xxhdpi/ic_launcher.png', size: 144 },
    { dest: 'app/src/main/res/mipmap-xxxhdpi/ic_launcher.png', size: 192 },
    { dest: 'store_icon.png', size: 512 },
];
const ADAPTIVE_IMAGES = [
    { dest: 'app/src/main/res/mipmap-mdpi/ic_maskable.png', size: 82 },
    { dest: 'app/src/main/res/mipmap-hdpi/ic_maskable.png', size: 123 },
    { dest: 'app/src/main/res/mipmap-xhdpi/ic_maskable.png', size: 164 },
    { dest: 'app/src/main/res/mipmap-xxhdpi/ic_maskable.png', size: 246 },
    { dest: 'app/src/main/res/mipmap-xxxhdpi/ic_maskable.png', size: 328 },
];
const NOTIFICATION_IMAGES = [
    { dest: 'app/src/main/res/drawable-mdpi/ic_notification_icon.png', size: 24 },
    { dest: 'app/src/main/res/drawable-hdpi/ic_notification_icon.png', size: 36 },
    { dest: 'app/src/main/res/drawable-xhdpi/ic_notification_icon.png', size: 48 },
    { dest: 'app/src/main/res/drawable-xxhdpi/ic_notification_icon.png', size: 72 },
    { dest: 'app/src/main/res/drawable-xxxhdpi/ic_notification_icon.png', size: 96 },
];
const WEB_MANIFEST_LOCATION = '/app/src/main/res/raw/';
const WEB_MANIFEST_FILE_NAME = 'web_app_manifest.json';
function shortcutMaskableTemplateFileMap(assetName) {
    return {
        'app/src/main/res/drawable-anydpi-v26/shortcut_maskable.xml': `app/src/main/res/drawable-anydpi-v26/${assetName}.xml`,
    };
}
function shortcutMonochromeTemplateFileMap(assetName) {
    return {
        'app/src/main/res/drawable-anydpi/shortcut_monochrome.xml': `app/src/main/res/drawable-anydpi/${assetName}.xml`,
        'app/src/main/res/drawable-anydpi-v26/shortcut_monochrome.xml': `app/src/main/res/drawable-anydpi-v26/${assetName}.xml`,
    };
}
function shortcutImages(assetName) {
    return [
        { dest: `app/src/main/res/drawable-mdpi/${assetName}.png`, size: 48 },
        { dest: `app/src/main/res/drawable-hdpi/${assetName}.png`, size: 72 },
        { dest: `app/src/main/res/drawable-xhdpi/${assetName}.png`, size: 96 },
        { dest: `app/src/main/res/drawable-xxhdpi/${assetName}.png`, size: 144 },
        { dest: `app/src/main/res/drawable-xxxhdpi/${assetName}.png`, size: 192 },
    ];
}
// fs.promises is marked as experimental. This should be replaced when stable.
const fsMkDir = util_1.promisify(fs.mkdir);
const fsCopyFile = util_1.promisify(fs.copyFile);
const fsWriteFile = util_1.promisify(fs.writeFile);
const fsReadFile = util_1.promisify(fs.readFile);
// eslint-disable-next-line @typescript-eslint/no-empty-function
const noOpProgress = () => { };
/**
 * An utility class to help ensure progress tracking is consistent.
 */
class Progress {
    constructor(total, progress) {
        this.total = total;
        this.progress = progress;
        this.current = 0;
        this.progress(this.current, this.total);
    }
    /**
     * Updates the progress. Increments current by 1.
     */
    update() {
        if (this.current === this.total) {
            throw new Error('Progress already reached total.' +
                ` current: ${this.current}, total: ${this.total}`);
        }
        this.current++;
        this.progress(this.current, this.total);
    }
    /**
     * Should be called for the last update. Throws an error if total !== current after incrementing
     * current.
     */
    done() {
        this.update();
        if (this.current !== this.total) {
            throw new Error('Invoked done before current equals total.' +
                ` current: ${this.current}, total: ${this.total}`);
        }
    }
}
/**
 * Generates TWA Projects from a TWA Manifest
 */
class TwaGenerator_v2 {
    constructor() {
        this.imageHelper = new ImageHelper_2.ImageHelper();
    }
    // Ensures targetDir exists and copies a file from sourceDir to target dir.
    async copyStaticFile(sourceDir, targetDir, filename) {
        const sourceFile = path.join(sourceDir, filename);
        const destFile = path.join(targetDir, filename);
        await fsMkDir(path.dirname(destFile), { recursive: true });
        await fsCopyFile(sourceFile, destFile);
    }
    // Copies a list of file from sourceDir to targetDir.
    copyStaticFiles(sourceDir, targetDir, fileList) {
        return Promise.all(fileList.map((file) => {
            return this.copyStaticFile(sourceDir, targetDir, file);
        }));
    }
    async applyTemplate(sourceFile, destFile, args) {
        await fsMkDir(path.dirname(destFile), { recursive: true });
        const templateFile = await fsReadFile(sourceFile, 'utf-8');
        const output = lodash_1.template(templateFile)(args);
        await fsWriteFile(destFile, output);
    }
    async applyTemplateList(sourceDir, targetDir, fileList, args) {
        await Promise.all(fileList.map((filename) => {
            const sourceFile = path.join(sourceDir, filename);
            const destFile = path.join(targetDir, filename);
            this.applyTemplate(sourceFile, destFile, args);
        }));
    }
    async applyJavaTemplate(sourceDir, targetDir, packageName, filename, args) {
        const sourceFile = path.join(sourceDir, JAVA_DIR, filename);
        const destFile = path.join(targetDir, JAVA_DIR, packageName.split('.').join('/'), filename);
        await fsMkDir(path.dirname(destFile), { recursive: true });
        const templateFile = await fsReadFile(sourceFile, 'utf-8');
        const output = lodash_1.template(templateFile)(args);
        await fsWriteFile(destFile, output);
    }
    applyJavaTemplates(sourceDir, targetDir, packageName, fileList, args) {
        return Promise.all(fileList.map((file) => {
            this.applyJavaTemplate(sourceDir, targetDir, packageName, file, args);
        }));
    }
    async applyTemplateMap(sourceDir, targetDir, fileMap, args) {
        await Promise.all(Object.keys(fileMap).map((filename) => {
            const sourceFile = path.join(sourceDir, filename);
            const destFile = path.join(targetDir, fileMap[filename]);
            this.applyTemplate(sourceFile, destFile, args);
        }));
    }
    async generateIcons(iconUrl, targetDir, iconList, backgroundColor) {
        var icon, image_data;
        try{ 
            if (valid_url.isWebUri(iconUrl)) {
                icon = await this.imageHelper.fetchIcon(iconUrl);
                image_data = icon.data;
            }
            else{
                image_data = await Jimp.read(iconUrl);
            }
        }catch(error)
        {
            console.error("Error:" );
            return null;
        }

        await Promise.all(iconList.map((iconDef) => {
            //return this.imageHelper.generateIcon(icon, targetDir, iconDef, backgroundColor);
            return this.imageHelper.generateIcon(image_data, targetDir, iconDef, backgroundColor);
        }));
    }
    async writeWebManifest(twaManifest, targetDirectory) {
        if (!twaManifest.webManifestUrl) {
            throw new Error('Unable to write the Web Manifest. The TWA Manifest does not have a webManifestUrl');
        }
        const response = await FetchUtils_1.fetchUtils.fetch(twaManifest.webManifestUrl.toString());
        if (response.status !== 200) {
            throw new Error(`Failed to download Web Manifest ${twaManifest.webManifestUrl}.` +
                `Responded with status ${response.status}`);
        }
        // We're writing as a string, but attempt to convert to check if it's a well-formed JSON.
        const webManifestJson = JSON.parse((await response.text()).trim());
        // We want to ensure that "start_url" is the same used to launch the Trusted Web Activity.
        webManifestJson['start_url'] = twaManifest.startUrl;
        const webManifestLocation = path.join(targetDirectory, WEB_MANIFEST_LOCATION);
        // Ensures the target directory exists.
        await fs.promises.mkdir(webManifestLocation, { recursive: true });
        const webManifestFileName = path.join(webManifestLocation, WEB_MANIFEST_FILE_NAME);
        await fs.promises.writeFile(webManifestFileName, JSON.stringify(webManifestJson));
    }
    /**
     * Generates shortcut data for a new TWA Project.
     *
     * @param {String} targetDirectory the directory where the project will be created
     * @param {String} templateDirectory the directory where templates are located.
     * @param {Object} twaManifest configurations values for the project.
     */
    async generateShortcuts(targetDirectory, templateDirectory, twaManifest) {
        await Promise.all(twaManifest.shortcuts.map(async (shortcut, i) => {
            const assetName = shortcut.assetName(i);
            const monochromeAssetName = `${assetName}_monochrome`;
            const maskableAssetName = `${assetName}_maskable`;
            const templateArgs = { assetName, monochromeAssetName, maskableAssetName };
            if (shortcut.chosenMonochromeIconUrl) {
                await this.applyTemplateMap(templateDirectory, targetDirectory, shortcutMonochromeTemplateFileMap(assetName), templateArgs);
                const monochromeImages = shortcutImages(monochromeAssetName);
                const baseMonochromeIcon = await this.imageHelper.fetchIcon(shortcut.chosenMonochromeIconUrl);
                const monochromeIcon = await this.imageHelper.monochromeFilter(baseMonochromeIcon, twaManifest.themeColor);
                return await Promise.all(monochromeImages.map((iconDef) => {
                    return this.imageHelper.generateIcon(monochromeIcon, targetDirectory, iconDef);
                }));
            }
            if (!shortcut.chosenIconUrl) {
                throw new Error(`ShortcutInfo ${shortcut.name} is missing chosenIconUrl and chosenMonochromeIconUrl`);
            }
            if (shortcut.chosenMaskableIconUrl) {
                await this.applyTemplateMap(templateDirectory, targetDirectory, shortcutMaskableTemplateFileMap(assetName), templateArgs);
                const maskableImages = shortcutImages(maskableAssetName);
                await this.generateIcons(shortcut.chosenMaskableIconUrl, targetDirectory, maskableImages);
            }
            const images = shortcutImages(assetName);
            return this.generateIcons(shortcut.chosenIconUrl, targetDirectory, images);
        }));
    }
    static generateShareTargetIntentFilter(twaManifest) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        if (!twaManifest.shareTarget) {
            return undefined;
        }
        const shareTargetIntentFilter = {
            actions: ['android.intent.action.SEND'],
            mimeTypes: [],
        };
        if (((_b = (_a = twaManifest.shareTarget) === null || _a === void 0 ? void 0 : _a.params) === null || _b === void 0 ? void 0 : _b.url) || ((_d = (_c = twaManifest.shareTarget) === null || _c === void 0 ? void 0 : _c.params) === null || _d === void 0 ? void 0 : _d.title) || ((_f = (_e = twaManifest.shareTarget) === null || _e === void 0 ? void 0 : _e.params) === null || _f === void 0 ? void 0 : _f.text)) {
            shareTargetIntentFilter.mimeTypes.push('text/plain');
        }
        if ((_h = (_g = twaManifest.shareTarget) === null || _g === void 0 ? void 0 : _g.params) === null || _h === void 0 ? void 0 : _h.files) {
            shareTargetIntentFilter.actions.push('android.intent.action.SEND_MULTIPLE');
            for (const file of twaManifest.shareTarget.params.files) {
                file.accept.forEach((accept) => shareTargetIntentFilter.mimeTypes.push(accept));
            }
        }
        return shareTargetIntentFilter;
    }
    /**
     * Creates a new TWA Project.
     *
     * @param {String} targetDirectory the directory where the project will be created
     * @param {Object} twaManifest configurations values for the project.
     */
    async createTwaProject(targetDirectory, twaManifest, log, reportProgress = noOpProgress) {
        const features = new FeatureManager_1.FeatureManager(twaManifest, log);
        const progress = new Progress(9, reportProgress);
        const error = twaManifest.validate();
        if (error !== null) {
            throw new Error(`Invalid TWA Manifest: ${error}`);
        }
        const templateDirectory = path.join(__dirname, 'node_modules/@bubblewrap/core/template_project');
        const copyFileList = new Set(COPY_FILE_LIST);
        if (!twaManifest.maskableIconUrl) {
            DELETE_FILE_LIST.forEach((file) => copyFileList.delete(file));
        }
        progress.update();
        // Copy Project Files
        await this.copyStaticFiles(templateDirectory, targetDirectory, Array.from(copyFileList));
        // Apply proper permissions to gradlew. See https://nodejs.org/api/fs.html#fs_file_modes
        await fs.promises.chmod(path.join(targetDirectory, 'gradlew'), '755');
        progress.update();
        // Those are the arguments passed when applying templates. Functions are not automatically
        // copied from objects, so we explicitly copy generateShortcuts.
        const args = {
            ...twaManifest,
            ...features,
            shareTargetIntentFilter: TwaGenerator_v2.generateShareTargetIntentFilter(twaManifest),
            generateShortcuts: twaManifest.generateShortcuts,
            escapeJsonString: util_2.escapeJsonString,
            escapeGradleString: util_2.escapeGradleString,
            toAndroidScreenOrientation: util_2.toAndroidScreenOrientation,
        };
        // Generate templated files
        await this.applyTemplateList(templateDirectory, targetDirectory, TEMPLATE_FILE_LIST, args);
        progress.update();
        // Generate java files
        await this.applyJavaTemplates(templateDirectory, targetDirectory, twaManifest.packageId, JAVA_FILE_LIST, args);
        progress.update();
        // Generate images
        if (twaManifest.iconUrl) {
            await this.generateIcons(twaManifest.iconUrl, targetDirectory, IMAGES);
            await this.generateIcons(twaManifest.iconUrl, targetDirectory, SPLASH_IMAGES, twaManifest.backgroundColor);
        }
        progress.update();
        await this.generateShortcuts(targetDirectory, templateDirectory, twaManifest);
        progress.update();
        // Generate adaptive images
        if (twaManifest.maskableIconUrl) {
            await this.generateIcons(twaManifest.maskableIconUrl, targetDirectory, ADAPTIVE_IMAGES);
        }
        progress.update();
        // Generate notification images
        const iconOrMonochromeIconUrl = twaManifest.monochromeIconUrl || twaManifest.iconUrl;
        if (twaManifest.enableNotifications && iconOrMonochromeIconUrl) {
            await this.generateIcons(iconOrMonochromeIconUrl, targetDirectory, NOTIFICATION_IMAGES);
        }
        progress.update();
        if (twaManifest.webManifestUrl) {
            // Save the Web Manifest into the project
            await this.writeWebManifest(twaManifest, targetDirectory);
        }
        progress.done();
    }
    /**
     * Removes all files generated by crateTwaProject.
     * @param targetDirectory the directory where the project was created.
     */
    async removeTwaProject(targetDirectory) {
        await Promise.all(DELETE_PROJECT_FILE_LIST.map((entry) => util_2.rmdir(path.join(targetDirectory, entry))));
    }
}
exports.TwaGenerator_v2= TwaGenerator_v2;
