'use strict';

const Spectr = require('./lib/spectr'),
    handlebars = require('./engines/handlebars')

module.exports = {
    Spectr,
    engines : {
        handlebars
    }
}
