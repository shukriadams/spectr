var stringHelper = require('./stringHelper'),
    path = require('path')

module.exports = function(setting){

    if (!setting)
        return { cwd : null, src : null }

    if (typeof setting === 'string')
        setting = { cwd : null, src : [setting] }

    if (typeof setting.src === 'string')
        setting.src = [setting.src]

    if (typeof setting.cwd === 'string'){

        setting.cwd = stringHelper.toUnixPath(setting.cwd)

        for (var i = 0 ; i < setting.src.length ; i ++)
            setting.src[i] = path.join(setting.cwd, setting.src[i])
    }

    return setting
}