/**
 *
 */
var fs = require('fs'),
    glob = require('glob'),
    path = require('path');


/**
 *
 */
var Spectr = function(options){
    this.models = {};
    this.pageModels = {};
    this._modelFunctions = {};

    this.options = options || {};
    this.options.models = this.options.models || {};

    // unpack glob options if they exist
    this.options.models.staticOptions = {};
    if (typeof this.options.models.static === 'object'){
        this.options.models.staticOptions = this.options.models.static.options;
        this.options.models.static = this.options.models.static.path;
    }

    this.options.models.pageOptions = {};
    if (typeof this.options.models.pages === 'object'){
        this.options.models.pageOptions = this.options.models.pages.options;
        this.options.models.pages = this.options.models.pages.path;
    }

    // engine setup force handlebars engine if no engine passed in
    this.engine = options.engine || new (Spectr.engine('handlebars'))();
    this.engine.options = options.templates;
    this.engine.options.fallbackModels = this.models;
};


/**
 * Loads and binds all data models, and triggers engine to resolve templates
 */
Spectr.prototype.resolve = function(callback){
    if (!callback)
        throw new Error('resolve expects a callback');

    this.load(function(err){
        if (err)
            return callback(err);

        this.engine.resolve(function(err){
            callback(err);
        });
    }.bind(this));

};


/**
 * Returns a render engine by name.
 */
Spectr.engine = function(name){
    var enginePath = path.join(__dirname, '../engines/', name);

    if (!fs.existsSync(enginePath))
        throw new Error('The render engine ' + name + ' does not exist.');

    return require(enginePath);
};


/**
 * Loads data from json files/functions. This must be called at least once for the dataContext to be populated.
 * Call it again after changing data files to load changes.
 */
Spectr.prototype.load = function(callback){

    if (!callback)
        throw new Error('load expects a callback');

    // reset all, this needs its own function
    this.models = {};
    this.pageModels = {};
    this._modelFunctions = {};
    this.engine.options.fallbackModels = this.models;

    // load functions first, these cannot rely on static models via context, but because they're code, they can always
    // load json directly
    if (this.options.models.functions){
        glob(this.options.models.functions, function(err, models){
            if (err)
                return callback(err);

            for (var i = 0 ; i < models.length ; i ++){
                // need better extension remover
                var model = models[i],
                    filename = model.substr(0, model.length - 3);

                delete require.cache[require.resolve(filename)];
                this._modelFunctions[path.basename(filename)] = require(filename);
            }

            next.apply(this);
        }.bind(this))
    } else
        next.apply(this);

    function next(){
        // load static and page models, these can depend on eachother or on functions
        this._loadStatic(this.options.models.static, this.options.models.staticOptions, false, function(err){
            if (err)
                return callback(err);

            this._loadStatic(this.options.models.pages, this.options.models.pageOptions, true, function(err){
                if (err)
                    return callback(err);

                // finally, after loading everything, scaffold models, static/functions first, then pages
                for (var modelName in this.models)
                    this.models[modelName] = this._processModel(this.models[modelName]);

                for (var modelName in this.pageModels)
                    this.pageModels[modelName] = this._processModel(this.pageModels[modelName]);

                callback();
            }.bind(this));
        }.bind(this));
    }

};


/**
 * Returns string array of all page route names.
 */
Spectr.prototype.getRouteNames = function(){
    var routeNames = [];
    for (var modelName in this.pageModels)
        routeNames.push(modelName);

    return routeNames;
};


/**
 * Trivial wrapper for engine render.
 */
Spectr.prototype.renderRoute = function(route){
    if (!this.pageModels[route])
        return null;

    return this.engine.render(this.pageModels[route]);
};


/**
 *
 */
Spectr.prototype.getDataForRoute = function(route){
    return this.pageModels[route];
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

            if (!this._modelFunctions[submodelName] && !this.models[submodelName]) {
                console.log('The inlined model ' + submodelName + ' was not found.');
                // model not found, fail quietly
                json = json.replace(matches[0], '""');
            } else {

                var modelIsFunction = !!this._modelFunctions[submodelName];

                if (modelIsFunction){
                    allargs.splice(0, 1);
                    var fn = this._modelFunctions[submodelName],
                        result = fn.apply(null, allargs);

                    if (!(typeof result === 'string'))
                        result = JSON.stringify(result);

                    json = json.replace(matches[0], result);
                } else {
                    this.models[submodelName] = this._processModel(this.models[submodelName]);
                    json = json.replace(matches[0], JSON.stringify(this.models[submodelName]));
                }
            }

            model = JSON.parse(json);

        }
    } while (matches);

    return model;
};


/**
 * Utility method, splits string and removes empty values
 */
Spectr.prototype._stringSplit = function (raw){
    return raw.split(' ').filter(function(arg){
        return arg && arg.length? arg: null;
    });
};


/**
 * Loads JSON from files
 */
Spectr.prototype._loadStatic = function(modelPath, options, isPage, callback){
    if (!modelPath)
        return callback;

    glob(modelPath, options, function(er, models){
        if (er)
            return callback(er, null);

        for (var i = 0 ; i < models.length ; i ++){
            var model = models[i],
                content = fs.readFileSync(model, 'utf8');

            // .slice is bad, need better extension remover
            var modelName = path.basename(model).slice(0, -5);

            try {
                if (isPage)
                    this.pageModels[modelName] = JSON.parse(content);
                else
                    this.models[modelName] = JSON.parse(content);
            } catch (ex){
                console.log('Error parsing JSON from file ' + model);
            }
        }

        callback();
    }.bind(this))
};


module.exports = Spectr;