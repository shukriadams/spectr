var http = require('http'),
    path = require('path'),
    HandlebarsEngine = require('../../engines/handlebars'),
    Spectr = require('../../');

// set up spectr
var spectr = new Spectr({
    templates : {
        views : path.join(__dirname, '../common/views/**/*.hbs'),
        pages : path.join(__dirname, '../common/pages/**/*.hbs')
    },
    models : {
        pages : { cwd : path.join(__dirname, '../common/models/pages'), src : ['**/*.json'] },
        functions : path.join(__dirname, '../common/models/functions/**/*.js'),
        static : path.join(__dirname, '../common/models/static/**/*.json')
    },
    engine : new HandlebarsEngine()
});


/**
 * Set up a barebones HTTP server with Node's own http module. You probably want to use Express for real applications,
 * but this demonstrate the point.
 */
var server = http.createServer(function (req, res) {

    // reload all data from file each page load, you probably want this on a dev environment
    spectr.resolve(function(){
        // Page url is the route. To handle a given route, create a page model file with the same name as that route.
        // Page models go in your "models/pages" folder
        var route = req.url.substr(1); //remove leading "/"
        if (!route || !route.length)
            route = 'index'; // treat "index" as default for empty routes

        // renderRoute returns null if route doesn't exist, else it return markup for that route
        var markup = spectr.renderRoute(route);
        if (!markup)
        {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/plain');
            res.end('No model route found for ' + route);
            return;
        }

        res.setHeader('Content-Length', markup.length);
        res.setHeader('Content-Type', 'text/html');
        res.statusCode = 200;
        res.end(markup);
    });

});


server.listen(3000, '127.0.0.1');