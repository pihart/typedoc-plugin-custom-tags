"use strict";
const pluginConverter = require("./CustomTagsPluginConverter");
const pluginRenderer = require("./CustomTagsPluginRenderer");
const PluginConstants_1 = require("./PluginConstants");
module.exports = (pluginHost) => {
    const app = pluginHost.owner;
    app.options.addDeclaration({ name: PluginConstants_1.PluginConstants.ArgumentName });
    app.converter.addComponent(PluginConstants_1.PluginConstants.ConverterPluginName, pluginConverter.CustomTagsPluginConverter);
    app.renderer.addComponent(PluginConstants_1.PluginConstants.RendererPluginName, pluginRenderer.CustomTagsPluginRenderer);
};
