module.exports = function(count){

    count = parseInt(count);

    var result = { items : [] };

    for (var i = 0 ; i < count ; i ++)
        result.items.push({
            text : "List item nr " + (i + 1)
        });

    return result;
};