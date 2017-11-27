var Handlebars,
    unescape = require('unescape'),
    fs = require('fs'),
    path = require('path'),
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
    string = string.replace('&#x3D;','=');
    return string;
};


/**
 * Finds and registers all partials associated with engine. This must be done whenever partials are changed, or on page
 * render.
 */
Engine.prototype.registerPartials = function(){
    var partials = fs.readdirSync(this.options.views); // use glob here instead!

    for (var i = 0 ; i < partials.length; i ++){
        var partial = partials[i],
            content = fs.readFileSync(path.join(this.options.views, partial), 'utf8');

        Handlebars.registerPartial(partial.slice(0, -4), content);
    }
};

Engine.prototype.render = function(data){
    return this._decode(this.page(data));
};

module.exports = Engine;