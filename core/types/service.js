const Util = require('../../util')
const debug = Util.Log('Service')

/**
 * 
 * 
 * @class Service
 * A Service manages all devices of a specific type
 */
class Service {
  constructor({ app, name, deviceClass, loadDevicesFromFile }) {
    // VALIDATION
    if (!name) { debug('Service must have a "name" attribute!') }
    if (!deviceClass) { debug('Service must have a "deviceClass" attribute!') }

    // REQUIRED -------------------
    this.name = name
    this.deviceClass = deviceClass
    // END REQUIRED ---------------
    
    // STATE
    this.actions = {}
    this.shouldUpdateDevices = false
    this.saveInProgress = false
    this.saveQueue = []
    
    // HELPERS
    this.loadDevicesFromFile = (loadDevicesFromFile != null ? loadDevicesFromFile : true)
    this.app = app

    // INITIALIZATION
    this.initDevices()
    // this.setupActions()
  }

  // ---------------------------
  // MUST BE IMPLEMENTED BY SUBCLASS
  // ---------------------------

  // Discovery
  discoverDevices() {
    debug('"discoverDevices" must be implemented in the Service subclass.')
  }

  // ---------------------------
  // END IMPLEMENTED BY SUBCLASS
  // ---------------------------

  // GETTERS -----------------
   /**
   * Gets every device this service has
   */
  get devices() {
    if (this.shouldUpdateDevices || !this._devices) {
      const deviceKeys = Object.keys(this.deviceMap)
      this._devices = deviceKeys.map(key => this.deviceMap[key])
      this.shouldUpdateDevices = false
    }
    return this._devices
  }

  get fileName() {
    if (!this.name) { debug(`Service must have a valid "name" attribute`) }
    return `service-${this.name}`
  }

  /**
 * Gets the minimal amount of info for each device
 */
  get simpleDevices() {
    return this.devices.map(device => {
      const { id, name, guid, ip, type, mac } = device
      return { id, name, guid, ip, type, mac }
    })
  }

  // -----------------------------
  // INIT ------------------------
  // -----------------------------
  initDeviceMap() {
    this._deviceMap = {}
    this.deviceMap = new Proxy(this._deviceMap, {
      get: (obj, prop) => {
        if (prop) {
          return obj[prop]
        } else {
          return obj
        }
      },
      set: (target, prop, value, receiver) => {
        if (prop != null) {
          target[prop] = value
          this.notifyParentOfDeviceChanges()
          return true
        } else {
          return false
        }
      }
    })
  }

  initDevices() {
    this.initDeviceMap()
    this.initExistingDevices()
      .then(this.discoverDevices.bind(this))
      .then(this.saveDevices.bind(this))
      .catch((error) => {
        debug('Issue initializing devices', error)
      })
  }

  initExistingDevices() {
    return new Promise((resolve, reject) => {
      if (this.loadDevicesFromFile) {
        if (!this.deviceClass) {
          const errMsg = 'Service missing "deviceClass"'
          debug(errMsg)
          reject(errMsg)
        } else {
          this.readData().then(data => {
            if (data.devices) {
              data.devices.forEach((device) => {
                debug('Creating device from existing data -- id:', device.id)
                this.deviceMap[device.id] = new this.deviceClass({ parentService: this, ...device })
              })
            }
            resolve()
          }).catch(reject)
        }
      } else {
        debug(`"${this.name}", Skip loading devices from file`)
        resolve()
      }
    })
  }

  // -----------------------------
  // HELPERS ---------------------
  // -----------------------------
  notifyParentOfDeviceChanges() {
    if (this.app && typeof this.app.onChildDevicesUpdate === 'function') {
      this.app.onChildDevicesUpdate()
    }
  }

  setShouldUpdateDevices() {
    this.shouldUpdateDevices = true
  }

  // -----------------------------
  // DATA ------------------------
  // -----------------------------
  processSaveQueue() {
    if (!this.saveInProgress && this.saveQueue.length > 0) {
      this.saveInProgress = true
      this.saveQueue.shift()(() => {
        this.saveInProgress = false
        this.processSaveQueue()
      })
    }
  }

  deviceArrayToObject({ array }) {
    const obj = {}
    array.forEach(device => {
      obj[device.id] = device
    })
    return obj
  }

  saveDevices({ override } = {}) {
    return new Promise((resolve, reject) => {
      const saveProcess = (callback) => {
        const resolver = () => {
          callback()
          resolve()
        }
        if (this.name) {
          this.readData().then((data) => {
            let devices = null
            if (override && data.devices) {
              // We want to erase the existing devices and
              // start over with the newest ones
              devices = this.simpleDevices
            } else if (!data.devices) {
              // We didn't save any devices, so we use the devices we've found
              devices = this.simpleDevices
            } else {
              devices = [...data.devices, ...this.simpleDevices]
            }
            devices = Util.Array.removeDuplicates({ array: devices, prop: ['ip', 'id'] })
            debug(`Saving ${devices.length} devices to ${this.fileName}.json`)
            Util.FileIO.saveToDataFile({ fileName: this.fileName, key: 'devices', data: devices })
              .then(resolver)
              .catch(() => {
                callback()
                reject(`Could not save device to file ${this.fileName}.json`)
              })
          }).catch((error) => {
            callback()
            reject('Had trouble reading from file while saving devices', error)
          })
        } else {
          callback()
          reject('Service needs name')
        }
      }
      this.saveQueue.push(saveProcess)
      this.processSaveQueue()
    })
  }

  readData() {
    return new Promise((resolve, reject) => {
      if (this.name) {
        Util.FileIO.readDataFile({ fileName: this.fileName })
          .then(resolve)
          .catch(() => {
            debug(`File does not exist, so creating new file: ${this.fileName}.json`)
            let data = {}
            Util.FileIO.saveToDataFile({ fileName: this.fileName, data }).then(() => {
              resolve(data)
            })
          })
      } else {
        reject('Service needs name')
      }
    })
  }
}

module.exports = Service