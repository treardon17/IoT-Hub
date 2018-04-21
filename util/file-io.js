const path = require('path')
const mkdirp = require('mkdirp')
const isJSON = require('is-json')
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

  writeFile({ filePath, data }) {
    let writeData = data
    return new Promise((resolve, reject) => {
      this.createFilePath({ filePath })
        .then(() => {
          if (typeof writeData === 'object') {
            writeData = JSON.stringify(data, null, 2)
          }
          fs.writeFile(filePath, writeData, (err) => {
            err ? reject(err) : resolve()
          })
        })
        .catch(reject)
    })
  }

  saveToDataFile({ fileName = 'data', key, data }) {
    return new Promise((resolve, reject) => {
      const filePath = path.resolve(__dirname, `../data/${fileName}.json`)
      this.readFile({ filePath })
        .then((fileData) => {
          const newData = isJSON(fileData) ? JSON.parse(fileData) : {}
          key ? newData[key] = data : newData = data
          this.writeFile({ filePath, data: newData })
            .then(resolve)
            .catch(reject)
        }).catch(() => {
          const newData = key ? { [key]: data } : data
          this.writeFile({ filePath, data: newData })
            .then(resolve)
            .catch(reject)
        })
    })
  }

  readDataFile({ fileName = 'data' }) {
    // return new Promise()
  }
}

module.exports = new FileIO()