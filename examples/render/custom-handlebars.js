var Handlebars = require('handlebars')

// do something with Handlebars, like register a partial
Handlebars.registerHelper('stringify', data =>{
    return data ? JSON.stringify(data) : ''
})

var path = require('path'),
    fs = require('fs'),
    HandlebarsEngine = require('../../engines/handlebars'),
    Spectr = require('../../').Spectr,
    spectr = new Spectr({
        templates : {
            views : path.join(__dirname, '../common/views/**/*.hbs'),
            pages : path.join(__dirname, '../common/pages/**/*.hbs')
        },
        models : {
            pages : { cwd : path.join(__dirname, '../common/models/pages'), src : ['**/*.json'] },
            functions : path.join(__dirname, '../common/models/functions/**/*.js'),
            static : path.join(__dirname, '../common/models/static/**/*.json')
        },
        
        // pass modified Handlebars to spectre
        engine : new HandlebarsEngine({ Handlebars })
    })
