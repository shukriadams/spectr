var express = require('express'),
    path = require('path'),
    app = express(),
    HandlebarsEngine = require('../../engines/handlebars'),
    Spectr = require('../../');

// set up spectr
var spectr = new Spectr({
    views : path.join(__dirname, '../common/views'),
    models : {
        pages : path.join(__dirname, '../common/models/pages'),
        functions : path.join(__dirname, '../common/models/functions'),
        static : path.join(__dirname, '../common/models/static')
    },
    engine : new HandlebarsEngine()
});

// the only route handler you need
app.get('/:route?', function (req, res) {

    // reload all data from file each page load, you probably want this on a dev environment
    spectr.refresh();

    var route = req.params.route;
    // set default
    if (!route || !route.length)
        route = 'index';

    var markup = spectr.renderRoute(route);
    if (!markup)
        return res.status(404).send('No model route found for ' + req.params.route);

    return res.send(markup);
});

app.listen(3000);