# Spectr

Spectr is a simple JSON-focused framework for rapid frontend prototyping and development. It inherits from and is
strongly influenced by the "no-backend" approach of static frontend projects like Assemble.io.

## Build environment

Spectr is vanilla Nodejs, it will fit into any built framework that plays nice with that.

## Template engines

Spectr supports Handlebars.js out of the box. Other template engines can be added.

## Data

### From JSON files

Spectr is first and foremost a convenient way to create and manage lots of JSON. It tries to be forgiving, failing
silently on data errors, until you get things right.

JSON models are normally stored in files, and complex models can easily be stitched together from simpler modules.

simple.json

    {
        "text" : "some simple text"
    }

complex.json

    {
        "content" : "<%= simple %>"
    }

resolves to

    {
        "content" : {
            "text" : "some simple text"
        }
    }

### From script

Spectr also lets you create JSON from functions, and treat these the same as file-based JSON.

basic.js

    module.exports = function(arg){
        return {
            text : "Some content with " + arg
        }
    };

complex.json

    {
        "content" : "<%= basic extras %>"
    }

resolves to

    {
        "content" : {
            "text" : "Some content with extras"
        }
    }


## Server

Spectr has no opinions about which NodeJs web framework you're using. It works with Express and vanilla NodeJS, but
anything should do.

## Other requirements

Spectr has been tested on node 4.x.
