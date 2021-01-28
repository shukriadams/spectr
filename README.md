# Spectr

Spectr is a simple data-focused framework for rapid frontend prototyping and development. It is strongly influenced by
the "no-backend" approach of template-based projects like Assemble.io.

Spectr uses data-centric routing. Normally, template-driven development has you create a template view like

    myPage.hbs :

    <html>
        {{>myPartial myData}}
    </html>

This compiles the partial myPartial.hbs with data from the file myData.json. This system works fine, until you find
yourself maintaining a lot of variations of pages and static JSON files to demonstrate all your partials' variations,
with your models duplicated across many files.

## Data

### Hello world

At the heart of Spectr is the concept that each rendered HTML page is defined by a unique JSON model file. The file `hello.json` with content

    {
        "page" : "world",
        "data" : {
            "header" : "hello world"
        }
    }

can be combined with the Handlebars template `world.hbs`

    <div>
        {{header}}
    </div>

to render the page `hello.html` with content

    <div>
        hello world
    </div>

Nothing special yet. If you're using Spectr you'll be wanting to build your page models up from other other JSON models. You can create an independent model file `myModel.json` containining

    {
        "header" : "hello world"
    }

and include it in your page model file using the include syntax `"<%= source %>"`

    {
        "page" : "world",
        "data" : "<%= myModel %>"
    }

You can make your page model as complex as desired, importing whatever you need

    {
        "page" : "world",
        "data" : {
            "hero" : "<%= myHeroModel %>",
            "someSections" : {
                "gadgets" : "<%= gadgetModel %>",
                "etc" : "<%= whatever %>"
            }
        }
    }

### Combines JSON files in other JSON files

The real power of Spectr comes from letting you stitch together data from mulitple sources to create more complex models for your page templates. If you have a model file `simple.json` with content

    {
        "text" : "I am a simple model"
    }

you can merge that into another JSON file `complex.json` using

    {
        "content" : "<%= simple %>"
    }

When `complex.json` is used to render a Handlebars partial it will resolve 

    {
        "content" : {
            "text" : "I am a simple model"
        }
    }

### Import from functions

Spectr also lets you create data on-the-fly by mixing JSON and calls to javascript functions. If you have a file `basic.js` containing

    module.exports = function(arg){
        return {
            text : "Some content with " + arg
        }
    }

and import it in `complex.json` as

    {
        "content" : "<%= basic extras %>"
    }

the Handlebars rendered from `complex.json` with get

    {
        "content" : {
            "text" : "Some content with extras"
        }
    }

## Fast to rebuild

Your static template system is great at the start, but once you've created a lot of complex partials and many pages, it can take a while to rebuild, especially as it typically rebuilds everything each time you make a change. Spectr can run on Express, rendering only the page you're requesting, and on-the-fly.

Spectr can also render all its pages as static HTML if that's what you prefer.

## Build environment

Spectr is vanilla Nodejs, it will fit into any built framework that plays nice with that.

## Template engines

Spectr supports Handlebars.js out of the box. Other template engines can be added in the future.

## Server

Spectr has no opinions about which NodeJs web framework you're using. It works with Express and vanilla NodeJS, but anything should do.

## Other requirements

Spectr has been tested on node 10.x.

