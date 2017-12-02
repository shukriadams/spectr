module.exports = {

    /**
     * Forces windows paths to unix format
     */
    toUnixPath : function(path){
        return path.replace(/\\/g, "/");
    },

    /**
     * spits a a string with a space token, removes empty items
     */
    stringSplit : function (raw){
        return raw.split(' ').filter(function(arg){
            return arg && arg.length? arg: null;
        });
    }
};