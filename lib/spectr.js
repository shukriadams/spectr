/**
 *
 */
let fs = require('fs'),
    globby = require('globby'),
    pathHelper = require('./pathHelper'),
    stringHelper = require('./stringHelper'),
    path = require('path'),
    Spectr = function(options){
        this.models = {}
        this.pageModels = {}
        this._modelFunctions = {}

        // sanitize and standardize options
        options = options || {}
        options.templates = options.templates || {}
        options.models = options.models || {}
        options.templates.pages = pathHelper(options.templates.pages)
        options.models.pages = pathHelper(options.models.pages)
        options.models.functions = pathHelper(options.models.functions)
        options.models.static = pathHelper(options.models.static)

        this.options = options
        this.options.models = this.options.models || {}

        // engine setup force handlebars engine if no engine passed in
        this.engine = options.engine || new (Spectr.engine('handlebars'))()
        this.engine.options = options.templates
        this.engine.options.fallbackModels = this.models
    }


/**
 * Loads and binds all data models, and triggers engine to resolve templates
 */
Spectr.prototype.resolve = function(callback){
    if (!callback)
        throw new Error('resolve expects a callback')

    this.load(function(err){
        if (err)
            return callback(err)

        this.engine.resolve(function(err){
            callback(err)
        })
    }.bind(this))
}


/**
 * Returns a render engine by name.
 */
Spectr.engine = function(name){
    let enginePath = path.join(__dirname, '../engines/', name)

    if (!fs.existsSync(enginePath))
        throw new Error('The render engine ' + name + ' does not exist.')

    return require(enginePath)
}


/**
 * Loads data from json files/functions. This must be called at least once for the dataContext to be populated.
 * Call it again after changing data files to load changes.
 */
Spectr.prototype.load = function(callback){

    if (!callback)
        throw new Error('load expects a callback')

    // reset all, this needs its own function
    this.models = {}
    this.pageModels = {}
    this._modelFunctions = {}
    this.engine.options.fallbackModels = this.models

    // load functions first, these cannot rely on static models via context, but because they're code, they can always
    // load json directly
    if (this.options.models.functions.src){

        globby(this.options.models.functions.src)

            .catch(function(err){
                callback(err);
            })

            .then(function(models){
                models = models || []

                for (var i = 0 ; i < models.length ; i ++){
                    // need better extension remover
                    var model = models[i],
                        filename = model.substr(0, model.length - 3)

                    delete require.cache[require.resolve(filename)]
                    this._modelFunctions[path.basename(filename)] = require(filename)
                }

                next.apply(this)
            }.bind(this))

    } else
        next.apply(this)

    function next(){
        if (!this.options.models.static.src)
            return callback()

        // load static and page models, these can depend on eachother or on functions
        this._loadStatic(this.options.models.static.src, false, function(err){
            if (err)
                return callback(err)

            this._loadStatic(this.options.models.pages.src, true, function(err){
                if (err)
                    return callback(err)

                // finally, after loading everything, scaffold models, static/functions first, then pages
                for (var modelName in this.models)
                    this.models[modelName] = this._processModel(this.models[modelName])

                for (var modelName in this.pageModels)
                    this.pageModels[modelName] = this._processModel(this.pageModels[modelName])

                callback()
            }.bind(this))
        }.bind(this))
    }
}


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
        return null

    return this.engine.render(this.pageModels[route])
}


Spectr.prototype.renderAllRoutes = function(callbacks){
    if (!callbacks || !callbacks.file)
        throw new Error('"file" callback is expected')

    this.resolve(function(){

        var routes = this.getRouteNames(),
            i = 0

        routes.forEach(function(route) {

            var markup = this.renderRoute(route)

            callbacks.file(null, {path : route + '.html', content : markup })

            i++
            if (i === routes.length && callbacks.done)
                callbacks.done()

        }.bind(this))
    }.bind(this))
}


/**
 *
 */
Spectr.prototype.getDataForRoute = function(route){
    return this.pageModels[route]
}


/**
 * Substitutes inline object links for actual objects
 */
Spectr.prototype._processModel = function (model){
        for (let property in model){

        if (typeof model[property] !== 'string'){
            model[property] = this._processModel(model[property])
        } else {
            var json = JSON.stringify(model[property]),
                matches = /"<%=(.*)%>"/g.exec(json)

            if (matches) {
                var allargs = stringHelper.stringSplit(matches[1].trim()),
                    submodelName = allargs[0]

                if (!this._modelFunctions[submodelName] && !this.models[submodelName]) {
                    console.log('The inlined model ' + submodelName + ' was not found.')
                    // model not found, fail quietly
                } else {

                    var modelIsFunction = !!this._modelFunctions[submodelName]

                    if (modelIsFunction){
                        allargs.splice(0, 1)
                        var fn = this._modelFunctions[submodelName],
                            result = fn.apply(null, allargs)

                        if (typeof result !== 'string')
                            result = JSON.stringify(result)

                        json = json.replace(matches[0], result)
                        model[property] = JSON.parse(json)
                    } else {
                        this.models[submodelName] = this._processModel(this.models[submodelName])
                        json = json.replace(matches[0], JSON.stringify(this.models[submodelName]))
                        model[property] = JSON.parse(json)
                    }
                }
            }
        }
    }

    return model
}


/**
 * Loads JSON from files
 */
Spectr.prototype._loadStatic = function(modelPath, isPage, callback){
    if (!modelPath)
        return callback

    globby(modelPath)

        .catch(function(err){
            callback(err)
        })

        .then(function(models){
            models = models || []

            for (var i = 0 ; i < models.length ; i ++){
                var model = stringHelper.toUnixPath(models[i]),
                    content = fs.readFileSync(model, 'utf8')

                // todo : .slice is bad, need better extension remover
                var modelName
                
                if (isPage){
                    if (this.options.models.pages.cwd){
                        modelName = (model).slice(0, -5).replace(this.options.models.pages.cwd, '')
                        // remove leading slash if any
                        if (modelName.indexOf('/')=== 0)
                            modelName = modelName.substr(1)
                    }
                    else
                        modelName = path.basename(model).slice(0, -5)
                }
                else
                    modelName = path.basename(model).slice(0, -5)

                try {
                    if (isPage)
                        this.pageModels[modelName] = JSON.parse(content)
                    else
                        this.models[modelName] = JSON.parse(content)
                } catch (ex){
                    console.log('Error parsing JSON from file ' + model)
                }
            }

            callback()

        }.bind(this))

}

module.exports = Spectr
