/**
 *
 */

var fs = require('fs'),
    path = require('path');


/**
 *
 */
var Spectr = function(options){
    this.options = options;
    this._engine = options.engine;
    this._engine.options.views = options.views;
    this._models = {};
    this._modelFunctions = {};
};


/**
 * Substitutes inline object links for actual objects
 */
Spectr.prototype._processModel = function (model){
    var regex = /"<%=([-_a-zA-Z0-9\s]*)%>"/g,
        matches;

    do {
        var json = JSON.stringify(model);
        matches = regex.exec(json);
        if (matches) {
            var allargs = this._stringSplit(matches[1].trim()),
                submodelName = allargs[0];

            if (!this._modelFunctions[submodelName] && !this._models[submodelName])
                   throw new Error('Static model or function ' + submodelName + ' does not exist');

            var modelIsFunction = !!this._modelFunctions[submodelName];

            if (modelIsFunction){
                allargs.splice(0, 1);
                var fn = this._modelFunctions[submodelName],
                    result = fn.apply(null, allargs);

                if (!(typeof result === 'string'))
                    result = JSON.stringify(result);

                json = json.replace(matches[0], result);
            } else {
                this._models[submodelName] = this._processModel(this._models[submodelName]);
                json = json.replace(matches[0], JSON.stringify(this._models[submodelName]));
            }
            model = JSON.parse(json);

        }
    } while (matches);

    return model;
};


/**
 *
 */
Spectr.prototype._stringSplit = function (raw){
    var args = raw.split(' ');
    return args.filter(function(arg){
        return arg && arg.length? arg: null;
    });
};


/**
 *
 */
Spectr.prototype._loadStatic = function(modelPath, isPage){
    var models = fs.readdirSync(modelPath); // use glob here instead!
    for (var i = 0 ; i < models.length ; i ++){
        var model = models[i],
            content = fs.readFileSync(path.join(modelPath,model), 'utf8');

        // .slice is bad, need better extension remover
        var modelName = model.slice(0, -5);
        this._models[modelName] = JSON.parse(content);
        this._models[modelName].__isPage = isPage;
    }
};


/**
 *
 */
Spectr.prototype.refresh = function(){
    this.load();
    if (this._engine)
        this._engine.registerPartials();
};


/**
 * Loads data from json files/functions. This must be called at least once for the dataContext, to be populated.
 * Call it again after changing data files to load changes.
 */
Spectr.prototype.load = function(){
    // reset all
    this._models = {};
    this._modelFunctions = {};

    // load functions first, these cannot rely on static models via context, but because they're code, they can always
    // load json directly
    var models = fs.readdirSync(this.options.models.functions); // use glob here instead!
    for (var i = 0 ; i < models.length ; i ++){
        // need better extension remover
        var model = models[i],
            filename = model.substr(0, model.length - 3);

        // remove file from require cache, so we know we're always loading latest
        var requirePath = path.join(this.options.models.functions, filename);
        delete require.cache[require.resolve(requirePath)];
        this._modelFunctions[filename] = require(requirePath);
    }

    // load static, these can depend on eachother or on functions
    this._loadStatic(this.options.models.static, false);
    this._loadStatic(this.options.models.pages, true);

    // scaffold models
    for (var modelName in this._models)
        this._models[modelName] = this._processModel(this._models[modelName]);
};


/**
 * Returns string array of all page route names.
 */
Spectr.prototype.getRouteNames = function(){
    var routeNames = [];
    for (var modelName in this._models)
        if (this._models[modelName].__isPage)
            routeNames.push(modelName);

    return routeNames;
};


/**
 * Trivial wrapper for engine render.
 */
Spectr.prototype.renderRoute = function(route){
    if (!this._models[route])
        return null;
    return this._engine.render(this._models[route]);
};


/**
 *
 */
Spectr.prototype.getDataForRoute = function(route){
    return this._models[route];
};


module.exports = Spectr;