# Spectr

Spectr is a simple JSON-focused "CMS" for rapid frontend prototyping and development.
It inherits from and is strongly influenced by the "no-backend" approach of static frontend projects like
Assemble.io and Jekyll.

## Build environment

Spectr is vanilla Nodejs, it will fit into built framework that plays nice with Nodejs.

## Template engines

Spectr supports Handlebars.js out of the box. Other template engines can be added.

## Data

### Static JSON

Spectr is first and foremost a convenient way to create and manage lots of JSON. JSON models are normally stored in
files, and complex models can easily be stitched together from simpler modules.

simple.json

    {
        "text" : "some simple text"
    }

complex.json

    {
        "content" : "<%= simple %>"
    }

yields

    {
        "content" : {
            "text" : "some simple text"
        }
    }

### Data from functions

Spectr also lets you create JSON from functions, and treat these the same as file-based JSON.

basic.json

    module.exports = function(arg){
        return {
            text : "Some content with " + arg
        }
    };

complex.json

    {
        "content" : "<%= basic extras %>"
    }

yields

    {
        "content" : {
            "text" : "Some content with extras"
        }
    }


## Server

Spectr has no opinions about which NodeJs web framework you're using. It works with Express and vanilla NodeJS, but
anything should do.

## Other requirements

Spectr works on node 0.10 and above.
