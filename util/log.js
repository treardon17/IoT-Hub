const fs = require('fs-extra')
const path = require('path')
const FileIO = require('./file-io')
const stringLength = 22

Log = (name, message) => {
  return new Promise((resolve, reject) => {
    const filePath = path.resolve(__dirname, `../logs`)
    const fileName = 'log.txt'
    const fullPath = `${filePath}/${fileName}`
    FileIO.createFilePath({ filePath: fullPath })
      .then(() => {
        const date = new Date()
        const dateString = `${date.getMonth()}/${date.getDay()}/${date.getFullYear()}-${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}_${date.getMilliseconds()}ms`
        const outputString = `${dateString}\t\t| ${name}\t${message}`
        FileIO.appendToFile({ filePath, fileName, output: outputString })
          .then(resolve)
          .catch(reject)
      })
  })
}

Logger = (name) => {
  const debug = require('debug')(name)
  let logName = name
  // If the name is shorter than the length we specified
  // then make the string that length by appending spaces
  if (name.length < stringLength) {
    const difference = stringLength - name.length
    for(let i = 0; i < difference; i += 1) { logName += ' ' }
  }
  return (...message) => {
    debug(...message)
    Log(logName, message)
  }
}

module.exports = Logger
