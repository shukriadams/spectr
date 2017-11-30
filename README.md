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

Spectr lets you easily create a unique data context for each page in your prototype, without having to write a lot of
boilerplate Json. You can of course still choose to write a lof of static JSON. You can however create data ...

### From JSON files

JSON models are normally stored in files, and complex models can easily be stitched together from simpler modules.

    *simple.json*
    {
        "text" : "I am a simple model"
    }

    *complex.json*
    {
        "content" : "<%= simple %>"
    }

resolves to

    {
        "content" : {
            "text" : "I am a simple model"
        }
    }

### From script

Spectr also lets you create data on-the-fly by mixing JSON and calls to javascript functions.

    *basic.js*
    module.exports = function(arg){
        return {
            text : "Some content with " + arg
        }
    };

    *complex.json*
    {
        "content" : "<%= basic extras %>"
    }

resolves to

    {
        "content" : {
            "text" : "Some content with extras"
        }
    }

In this way your route JSON consists only of arguments for how data should be created, while your logic for creating
models rests in centralized functions.

## Fast to rebuild

Your static template system is great at the start, but once you've created a lot of complex partials and many pages,
it can take a while to rebuild, especially as it typically rebuilds everything each time you make a change. Spectr
can run on Express, rendering only the page you're requesting, and on-the-fly.

Spectr can also render all its pages as static HTML if that's what you prefer.

## Build environment

Spectr is vanilla Nodejs, it will fit into any built framework that plays nice with that.

## Template engines

Spectr supports Handlebars.js out of the box. Other template engines can be added in the future.


## Server

Spectr has no opinions about which NodeJs web framework you're using. It works with Express and vanilla NodeJS, but
anything should do.

## Other requirements

Spectr has been tested on node 4.x.

