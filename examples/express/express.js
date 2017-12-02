var express = require('express'),
    path = require('path'),
    app = express(),
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
    }
});

// the only route handler you need
app.get('/*', function (req, res) {

    // reload all data from file each page load, you probably want this on a dev environment
    spectr.resolve(function(err){
        if (err)
            console.log(err);

        var route = req.params[0];
        // set default
        if (!route || !route.length)
            route = 'index';

        var markup = spectr.renderRoute(route);
        if (!markup)
            return res.status(404).send('No model route found for ' + req.params.route);

        return res.send(markup);
    });
});

app.listen(3000);