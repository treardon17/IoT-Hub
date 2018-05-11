const path = require('path')
var os = require("os")
const mkdirp = require('mkdirp')
const isJSON = require('is-json')
const fs = require('fs-extra')

class FileIO {
  getFilesInDirectory({ filePath }) {
    return new Promise((resolve, reject) => {
      fs.readdir(testFolder, (err, files) => {
        err ? reject(err) : resolve(files)
      })
    })
  }

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
    return new Promise((resolve, reject) => {
      const filePath = path.resolve(__dirname, `../data/${fileName}.json`)
      this.readFile({ filePath })
        .then((data) => {
          if (isJSON(data)) {
            const dataObj = JSON.parse(data)
            resolve(dataObj)
          } else {
            reject('Invalid JSON in file', filePath)
          }
        })
        .catch(reject)
    })
  }

  appendToFile({ filePath, fileName, output }) {
    return new Promise((resolve, reject) => {
      this.createFilePath({ filePath })
        .then(() => {
          const fullPath = path.resolve(filePath, fileName)
          const fileExists = fs.existsSync(fullPath)
          if (!fileExists) {
            fs.openSync(fullPath, 'w');
          }
          fs.appendFile(fullPath, `${output}${os.EOL}`, (err) => {
            if (err) { reject() }
            else { resolve() }
          })
        })
    })
  }
}

module.exports = new FileIO()