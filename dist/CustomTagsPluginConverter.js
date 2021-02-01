"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomTagsPluginConverter = void 0;
const FS = require("fs-extra");
const path = require("path");
const components_1 = require("typedoc/dist/lib/converter/components");
const converter_1 = require("typedoc/dist/lib/converter/converter");
const PluginConstants_1 = require("./PluginConstants");
let CustomTagsPluginConverter = class CustomTagsPluginConverter extends components_1.ConverterComponent {
    constructor() {
        super(...arguments);
        this._declarations = {};
    }
    initialize() {
        this.listenTo(this.owner, {
            [converter_1.Converter.EVENT_BEGIN]: this.onBegin,
            [converter_1.Converter.EVENT_RESOLVE_BEGIN]: this.onBeginResolve,
        });
    }
    onBegin() {
        const options = this.application.options;
        try {
            const configPath = options.getValue(PluginConstants_1.PluginConstants.ArgumentName);
            this._readConfigJson(configPath);
        }
        catch (e) {
            console.error(`typedoc-plugin-custom-tags: ${e.message}`);
        }
    }
    onBeginResolve(context) {
        const reflections = context.project.reflections;
        for (const key in reflections) {
            const comment = reflections[key].comment;
            this.resolveComment(comment);
        }
    }
    resolveComment(comment) {
        if (!comment || !comment.tags) {
            return;
        }
        const handledIndexes = [];
        const matchingTags = [];
        let previousTagName = "";
        let tagGroup = [];
        for (let index = 0; index < comment.tags.length; index++) {
            const tag = comment.tags[index];
            if (!this._declarations.hasOwnProperty(tag.tagName) || !this._declarations[tag.tagName]) {
                continue;
            }
            const config = this._declarations[tag.tagName];
            if (previousTagName !== tag.tagName || config.combineMode === 0 /* none */) {
                tagGroup = [];
                matchingTags.push(tagGroup);
            }
            if (!config.hidden) {
                tagGroup.push({
                    index: index,
                    tag: tag,
                    config: config
                });
            }
            handledIndexes.unshift(index);
            previousTagName = tag.tagName;
        }
        handledIndexes.forEach((index) => {
            (comment.tags || []).splice(index, 1);
        });
        comment["matchingTags"] = matchingTags;
    }
    _readConfigJson(configPath) {
        this._declarations = {};
        if (typeof configPath !== "string" || configPath.trim().length === 0) {
            return;
        }
        // load json
        const configAbsolutePath = path.resolve(configPath);
        let json = null;
        try {
            json = JSON.parse(FS.readFileSync(configAbsolutePath, "utf8"));
        }
        catch (e) {
            throw new Error(`error reading ${PluginConstants_1.PluginConstants.ArgumentDisplayName} json file: ${e.message}`);
        }
        if (Array.isArray(json)) {
            for (let index = 0; index < json.length; index++) {
                this._processConfig(json[index]);
            }
        }
        else if (json && typeof json === "object") {
            this._processConfig(json);
        }
        else {
            throw new Error(`${PluginConstants_1.PluginConstants.ArgumentDisplayName} json file has to have Array or single configuration object as root element`);
        }
    }
    _processConfig(configJson) {
        if (typeof configJson === "object"
            && configJson.hasOwnProperty("tagName") && typeof configJson.tagName === "string"
            && configJson.hasOwnProperty("template") && typeof configJson.template === "string") {
            const tagName = configJson.tagName.trim();
            if (tagName.length === 0) {
                throw new Error(`error reading ${PluginConstants_1.PluginConstants.ArgumentName} json. Missing required property tagName.`);
            }
            if (this._declarations.hasOwnProperty(tagName) && this._declarations[tagName]) {
                throw new Error(`error reading ${PluginConstants_1.PluginConstants.ArgumentName} json. The tagName ${tagName} is already defined.`);
            }
            const template = configJson.template;
            let combineMode = 0 /* none */;
            if (configJson.hasOwnProperty("combine") && typeof configJson.combine === "string") {
                switch (configJson.combine) {
                    case "header-ul":
                        combineMode = 1 /* headerUl */;
                        break;
                    case "header-ol":
                        combineMode = 2 /* headerOl */;
                        break;
                    case "ul":
                        combineMode = 3 /* ul */;
                        break;
                    case "ol":
                        combineMode = 4 /* ol */;
                        break;
                    case "block":
                        combineMode = 5 /* block */;
                        break;
                }
            }
            this._declarations[tagName] = {
                tagName: tagName,
                template: template,
                combineMode: combineMode
            };
            return;
        }
        throw new Error(`${PluginConstants_1.PluginConstants.ArgumentDisplayName} json file syntax has to be: [{"tagName": "STRING", template: "STRING (MARKDOWN FORMATTED)", combine?: "STRING", hidden?: "BOOLEAN"}, ETC.]`);
    }
};
CustomTagsPluginConverter = __decorate([
    components_1.Component({ name: PluginConstants_1.PluginConstants.ConverterPluginName })
], CustomTagsPluginConverter);
exports.CustomTagsPluginConverter = CustomTagsPluginConverter;
