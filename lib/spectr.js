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
    this.options = options;
    this.engine = options.engine;
    this.engine.options.views = options.views;
    this.models = {};
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

            if (!this._modelFunctions[submodelName] && !this.models[submodelName]) {
                // model not found, fail quietly by replacing with error object
                json = json.replace(matches[0], '{ "error" : "' + submodelName +' not found " }');
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
Spectr.prototype._loadStatic = function(modelPath, isPage, callback){
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
                this.models[modelName].__isPage = isPage;
            }catch (ex){
                console.log('Error parsing JSON from file ' + model);
            }
        }

        callback();
    }.bind(this))
};


/**
 * Loads and binds all data models and templates in engine
 */
Spectr.prototype.resolve = function(callback){
    if (!callback)
        throw new Error('refresh expects a callback')

    this.load(function(err){
        if (err)
            return callback(err);

        if (this.engine)
            this.engine.registerPartials(function(err){
                callback(err);
            });
        else
            callback();
    }.bind(this));

};

Spectr.engine = function(name){
    return require(path.join(__dirname, '../engines/' + name));
}

/**
 * Loads data from json files/functions. This must be called at least once for the dataContext to be populated.
 * Call it again after changing data files to load changes.
 */
Spectr.prototype.load = function(callback){

    if (!callback)
        throw new Error('load expects a callback');

    // reset all
    var self = this;
    this.models = {};
    this._modelFunctions = {};

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

            next();
        })
    } else
        next();


    function next(){
        // load static, these can depend on eachother or on functions
        self._loadStatic(self.options.models.static, false, function(err){
            if (err)
                return callback(err)

            self._loadStatic(self.options.models.pages, true, function(err){
                if (err)
                    return callback(err)

                // scaffold models
                for (var modelName in self.models)
                    self.models[modelName] = self._processModel(self.models[modelName]);

                callback();
            });
        });
    }

};


/**
 * Returns string array of all page route names.
 */
Spectr.prototype.getRouteNames = function(){
    var routeNames = [];
    for (var modelName in this.models)
        if (this.models[modelName].__isPage)
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


module.exports = Spectr;