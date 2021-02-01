"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var CustomTagsPluginRenderer_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomTagsPluginRenderer = void 0;
const components_1 = require("typedoc/dist/lib/output/components");
const PluginConstants_1 = require("./PluginConstants");
const events_1 = require("typedoc/dist/lib/output/events");
const models_1 = require("typedoc/dist/lib/models");
const comments_1 = require("typedoc/dist/lib/models/comments");
let CustomTagsPluginRenderer = CustomTagsPluginRenderer_1 = class CustomTagsPluginRenderer extends components_1.RendererComponent {
    constructor() {
        super(...arguments);
        this._processedReadme = false;
    }
    /**
     * Create a new MarkedLinksPlugin instance.
     */
    initialize() {
        super.initialize();
        this.listenTo(this.owner, {
            [events_1.PageEvent.BEGIN]: this.onBeginPage,
        }, undefined, -1);
    }
    onBeginPage(page) {
        const markdownPlugin = this.owner.owner.renderer.getComponent("marked");
        if (page.model instanceof models_1.ProjectReflection) {
            page.model.readme = this._processReadme(page.model.readme, markdownPlugin, page);
        }
        else if (page.model instanceof models_1.DeclarationReflection) {
            CustomTagsPluginRenderer_1.__processReflection(page.model, markdownPlugin, page);
        }
    }
    _processReadme(readme, markdownPlugin, context) {
        if (typeof readme !== "string" || this._processedReadme) {
            return readme;
        }
        this._processedReadme = true;
        const pluginConverter = this.owner.owner.converter.getComponent(PluginConstants_1.PluginConstants.ConverterPluginName);
        const rawLines = readme.split("\n");
        const processLines = [];
        let readmeComment = undefined;
        let previousTagName = null;
        let newLines = "";
        for (let index = 0; index < rawLines.length; index++) {
            const rawLine = rawLines[index];
            let processLine = rawLine;
            let tagName = null;
            if (rawLine.length > 0 && rawLine[0] === "@") {
                const tag = CustomTagsPluginRenderer_1.__tagRexEx.exec(rawLine);
                if (tag) {
                    tagName = tag[1].toLowerCase();
                    if (tagName !== previousTagName) {
                        this._processReadmeComment(processLines, newLines, readmeComment, pluginConverter, markdownPlugin, context);
                        newLines = "";
                        readmeComment = new comments_1.Comment("", "");
                        readmeComment.tags = [];
                    }
                    const tagContent = rawLine.substr(tagName.length + 1).trim();
                    ((readmeComment && readmeComment.tags) || []).push(new comments_1.CommentTag(tagName, undefined, tagContent));
                    previousTagName = tagName;
                    continue;
                }
            }
            if (rawLine.trim().length > 0) {
                if (tagName === null) {
                    this._processReadmeComment(processLines, newLines, readmeComment, pluginConverter, markdownPlugin, context);
                    readmeComment = undefined;
                }
                newLines = "";
                previousTagName = tagName;
            }
            else if (readmeComment) {
                newLines += "\n";
            }
            processLines.push(processLine);
        }
        const newContents = processLines.join("\n");
        return newContents;
    }
    _processReadmeComment(processLines, newLines, comment, pluginConverter, markdownPlugin, context) {
        pluginConverter.resolveComment(comment);
        CustomTagsPluginRenderer_1.__processComment(comment, markdownPlugin, context);
        if (comment && typeof comment.text === "string") {
            processLines.push(comment.text, newLines);
        }
    }
    static __processReflection(reflection, markdownPlugin, context) {
        if (!reflection) {
            return;
        }
        reflection.traverse((r, property) => {
            CustomTagsPluginRenderer_1.__processReflection(r, markdownPlugin, context);
        });
        const comment = reflection ? reflection.comment : undefined;
        CustomTagsPluginRenderer_1.__processComment(comment, markdownPlugin, context);
    }
    static __processComment(comment, markdownPlugin, context) {
        if (!comment || !comment.hasOwnProperty("matchingTags") || !Array.isArray(comment["matchingTags"])) {
            return;
        }
        const matchingTags = comment["matchingTags"];
        let tagGroup = [];
        for (let index = 0; index < matchingTags.length; index++) {
            tagGroup = matchingTags[index];
            const combineMode = tagGroup[0].config.combineMode;
            let text = tagGroup[0].config.template;
            let content = "";
            let innerContent = "";
            for (let part = 0; part < tagGroup.length; part++) {
                const item = tagGroup[part];
                const isListItem = (part > 0 && (combineMode === 1 /* headerUl */ || combineMode === 2 /* headerOl */)) || (part >= 0 && (combineMode === 3 /* ul */ || combineMode === 4 /* ol */));
                const itemText = CustomTagsPluginRenderer_1.__resolveText(item.tag.text, markdownPlugin, context);
                if (isListItem) {
                    innerContent += "<li>" + itemText + "</li>";
                }
                else {
                    content += itemText + "\n";
                }
            }
            if (innerContent.length > 0) {
                if (combineMode === 3 /* ul */ || combineMode === 1 /* headerUl */) {
                    content = content + "<ul>" + innerContent + "</ul>";
                }
                else if (combineMode === 4 /* ol */ || combineMode === 2 /* headerOl */) {
                    content = content + "<ol>" + innerContent + "</ol>";
                }
                else {
                    content += "\n" + innerContent;
                }
            }
            if (text.indexOf("{content}") >= 0) {
                text = text.replace("{content}", content);
            }
            else {
                text += content;
            }
            comment.text += CustomTagsPluginRenderer_1.__resolveText(text, markdownPlugin, context);
        }
        delete comment["matchingTags"];
    }
    static __resolveText(text, markdownPlugin, context) {
        let resolvedText = text;
        try {
            if (markdownPlugin) {
                resolvedText = markdownPlugin.parseMarkdown(text, context).trim();
                if (resolvedText.length > 7 && resolvedText.substr(0, 3) === "<p>" && resolvedText.substr(resolvedText.length - 4) === "</p>") {
                    resolvedText = resolvedText.substr(3, resolvedText.length - 7);
                }
            }
        }
        catch (e) {
            e.message = `failed to parse text '${text}'. Error: ${e.message}`;
            throw e;
        }
        return resolvedText;
    }
};
CustomTagsPluginRenderer.__tagRexEx = /^@(\S+)/;
CustomTagsPluginRenderer = CustomTagsPluginRenderer_1 = __decorate([
    components_1.Component({ name: PluginConstants_1.PluginConstants.RendererPluginName })
], CustomTagsPluginRenderer);
exports.CustomTagsPluginRenderer = CustomTagsPluginRenderer;
