const fs = require('fs-extra')
const path = require('path')
const FileIO = require('./file-io')

Log = (name, message, type) => {
  return new Promise((resolve, reject) => {
    const filePath = path.resolve(__dirname, `../logs`)
    const fileName = 'log.txt'
    const fullPath = `${filePath}/${fileName}`
    FileIO.createFilePath({ filePath: fullPath })
      .then(() => {
        let marker = '*'
        if (type === 'error') { marker = '!' }
        const date = new Date()
        const dateString = `${date.getMonth()}/${date.getDay()}/${date.getFullYear()}-${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}_${date.getMilliseconds()}ms`
        const outputString = `${marker}${name}: ${dateString} -- ${message}`
        FileIO.appendToFile({ filePath, fileName, output: outputString })
          .then(resolve)
          .catch(reject)
      })
  })
}

Logger = (name) => {
  const debug = require('debug')(name)
  return (message, type) => {
    let typeMessage = ''
    if (type) {
      typeMessage = `**${type.toUpperCase()}**`
    }
    debug(typeMessage, message)
    Log(name, message, type)
  }
}

module.exports = Logger
