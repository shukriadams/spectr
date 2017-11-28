var Handlebars,
    unescape = require('unescape'),
    fs = require('fs'),
    path = require('path'),
    glob = require('glob'),
    layouts = require('handlebars-layouts');


var Engine = function (options){
    options = options || {};
    this.options = options;

    // Handlebars can be passed in preconfigured if wanted
    Handlebars = options.Handlebars || require('handlebars');

    var self = this;

    Handlebars.registerHelper(layouts(Handlebars));
    Handlebars.registerHelper('renderSection', function(partialName, context){
        if (!partialName || ! context)
            return console.log('renderSection received invalid partial name or context');

        var fn,
            template = Handlebars.partials[partialName];

        if (typeof template === 'function')
            fn = template;
        else
            fn = Handlebars.compile(template);

        var output = fn(context).replace(/^\s+/, '');
        return new Handlebars.SafeString(self._decode(output));
    });

    // get the standard page
    this.page = Handlebars.compile(fs.readFileSync(path.join(__dirname, 'page.hbs'), 'utf8'));

};


Engine.prototype._decode = function(string){
    string = unescape(string);
    string = new Handlebars.SafeString(string);
    // temp workaround to fix hex codes being rendered, not sure what's causing this
    string = string.replace('&#x3D;','=');
    string = string.replace(/&#x27;/g, "'")

    return string;
};


/**
 * Finds and registers all partials associated with engine. This must be done whenever partials are changed, or on page
 * render.
 */
Engine.prototype.registerPartials = function(callback){
    if (!callback)
        throw new Error('registerPartials expects a callback')

    glob(this.options.views, function(err, partials){
        if (err)
            return callback(err);

        for (var i = 0 ; i < partials.length; i ++){
            var partial = partials[i],
                content = fs.readFileSync(partial, 'utf8'),
                partialName = path.basename(partial).slice(0, -4); // find better way to remove extension!

            Handlebars.registerPartial(partialName, content);
        }

        callback();
    })

};

Engine.prototype.render = function(data){
    var markup = this.page(data);
    markup = this._decode(markup);
    return markup;
};

module.exports = Engine;