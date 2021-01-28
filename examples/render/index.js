var path = require('path'),
    fs = require('fs'),
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

var folderPath = path.join(__dirname, 'web');
if (!fs.existsSync(folderPath))
    fs.mkdirSync(folderPath);

// reload all data from file each page load, you probably want this on a dev environment
spectr.renderAllRoutes({
    file : function(err, output){
        if (err ||output.content === null)
            return console.log(err);

        var filePath = path.join(folderPath, output.path);
        if (!fs.existsSync(path.dirname(filePath)))
            fs.mkdirSync(path.dirname(filePath));

        fs.writeFile(filePath, output.content, ()=>{
            console.log('file written')
        })
    },
    done : function(){
        console.log('finished rendering');
    }
});