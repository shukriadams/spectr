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
    this.options = options || {};
    // force handlebars engine if no engine passed in
    this.engine = options.engine || new (Spectr.engine('handlebars'))();
    this.engine.options = options.templates;
    this.models = {};
    this._modelFunctions = {};
    // used to flag model names as being pages
    this._pageModels = {};
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

    // reset all
    this.models = {};
    this._modelFunctions = {};
    this._pageModels = {};

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
                this._modelFunctions[filename] = require(filename);
            }

            next.apply(this);
        }.bind(this))
    } else
        next.apply(this);

    function next(){
        // load static, these can depend on eachother or on functions
        this._loadStatic(this.options.models.static, false, function(err){
            if (err)
                return callback(err);

            this._loadStatic(this.options.models.pages, true, function(err){
                if (err)
                    return callback(err);

                // scaffold models
                for (var modelName in this.models)
                    this.models[modelName] = this._processModel(this.models[modelName]);

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
    for (var modelName in this._pageModels)
        routeNames.push(modelName);

    return routeNames;
};


/**
 * Trivial wrapper for engine render.
 */
Spectr.prototype.renderRoute = function(route){
    if (!this.models[route])
        return null;
    return this.engine.render(this.models[route]);
};


/**
 *
 */
Spectr.prototype.getDataForRoute = function(route){
    return this.models[route];
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
Spectr.prototype._loadStatic = function(modelPath, isPage, callback){
    if (!modelPath)
        return callback;

    glob(modelPath, function(er, models){
        if (er)
            return callback(er, null);

        for (var i = 0 ; i < models.length ; i ++){
            var model = models[i],
                content = fs.readFileSync(model, 'utf8');

            // .slice is bad, need better extension remover
            var modelName = path.basename(model).slice(0, -5);

            try {
                this.models[modelName] = JSON.parse(content);

                if (isPage)
                    this._pageModels[modelName] = {};
            }catch (ex){
                console.log('Error parsing JSON from file ' + model);
            }
        }

        callback();
    }.bind(this))
};


module.exports = Spectr;