const path = require('path')
const mkdirp = require('mkdirp')
const fs = require('fs-extra')

class FileIO {
  readFile({ filePath }) {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, { encoding: 'utf-8' }, (err, data) => {
        err ? reject(err) : resolve(data)
      });
    })
  }

  createFilePath({ filePath }) {
    return new Promise((resolve, reject) => {
      mkdirp(path.dirname(filePath), (err) => {
        err ? reject(err) : resolve()
      })
    })
  }

  writeFile({ filePath, contents }) {
    let writeData = contents
    return new Promise((resolve, reject) => {
      this.createFilePath({ filePath })
        .then(() => {
          if (typeof writeData === 'object') {
            writeData = JSON.stringify(contents)
          }
          fs.writeFile(filePath, writeData, (err) => {
            err ? reject(err) : resolve()
          })
        })
        .catch(reject)
    })
  }
}

module.exports = new FileIO()