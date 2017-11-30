/**
 *
 */
var Handlebars,
    unescape = require('unescape'),
    fs = require('fs'),
    path = require('path'),
    globby = require('globby'),
    layouts = require('handlebars-layouts');


/**
 *
 */
var Engine = function (options){
    options = options || {};
    this.options = options;
    this.pages = {};

    // Handlebars can be passed in preconfigured if wanted
    Handlebars = options.Handlebars || require('handlebars');

    Handlebars.registerHelper(layouts(Handlebars));
    Handlebars.registerHelper('renderSection', function(partialName, context){
        if (!partialName || ! context)
            return console.log('renderSection received invalid partial name or context');

        var fn,
            template = Handlebars.partials[partialName];

        if (!template)
            return console.log('renderSection failed to retrieve partial ' + partialName);

        if (typeof template === 'function')
            fn = template;
        else
            fn = Handlebars.compile(template);

        var output = fn(context).replace(/^\s+/, '');
        return new Handlebars.SafeString(this._decode(output));

    }.bind(this));
};


/**
 *
 */
Engine.prototype._decode = function(string){
    string = unescape(string);
    string = new Handlebars.SafeString(string).string;

    // temp workaround to fix hex codes being rendered, not sure what's causing this
    string = string.replace('&#x3D;','=');
    string = string.replace(/&#x27;/g, "'");
    string = string.replace(/&#x60;/g, "`");

    return string;
};


/**
 * Finds and registers all partials associated with engine. This must be done whenever partials are changed, or on page
 * render.
 */
Engine.prototype.resolve = function(callback){
    if (!callback)
        throw new Error('registerPartials expects a callback');

    if (this.options.views)

        globby(this.options.views)

            .catch(function(err){
                callback(err);
            })

            .then(function(partials){
                for (var i = 0 ; i < partials.length; i ++){
                    var partial = partials[i],
                        content = fs.readFileSync(partial, 'utf8'),
                        partialName = path.basename(partial).slice(0, -4); // find better way to remove extension!

                    try {
                        Handlebars.registerPartial(partialName, content);
                    }catch(ex){
                        console.log('failed to compile partial ' + partialName + ' @ ' + partial, ex);
                    }
                }

                then.apply(this);
            }.bind(this));

    else
        then.apply(this);

    function then(){

        if (!this.options.pages)
            return callback();
            
        globby(this.options.pages)

            .catch(function(err){
                callback(err)
            })

            .then(function(pages){
                for (var i = 0 ; i < pages.length; i ++){
                    var page = pages[i],
                        content = fs.readFileSync(page, 'utf8'),
                        pageName = path.basename(page).slice(0, -4); // find better way to remove extension!

                    try {
                        this.pages[pageName] = Handlebars.compile(content);
                    }catch(ex){
                        console.log('failed to compile page ' + pageName + ' @ ' + page, ex);
                    }
                }

                callback();
            }.bind(this));

    }

};


/**
 * Renders page template based on the content of data. Data context can be a model defined in data, or the entire data
 * context if no model is specified.
 */
Engine.prototype.render = function(data){
    var pageTemplate = this.pages[data.page] ,
        bindingData = data.data || this.options.fallbackModels;

    if (!pageTemplate)
        return 'Could not find a page template for "' + data.page +'".';

    var markup = pageTemplate(bindingData);
    markup = this._decode(markup);
    return markup;
};

module.exports = Engine;