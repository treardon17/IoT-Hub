const Trigger = require('../core/types/trigger')
const Util = require('../util')
const debug = Util.Log('Hook:NetworkScanner')
const Shell = require('shelljs')
const parser = require('xml2json')

class Scanner extends Trigger {
  constructor({ app }) {
    super({ app })
    this.devicesOnNetwork = []
    this.enterListeners = {}
    this.leaveListeners = {}
    this.onNetworkListeners = {}
    this.offNetworkListeners = {}
    this.thresholdMap = {}
    this.waitMap = {}
    this.scanInterval = 5 * 1000
    this.scanIntervalID = null
  }

  start() {
    debug('Network scanner starting...')
    this.refreshNetwork(true)
  }

  stop() {
    debug('Network scanner stopping...')
    clearTimeout(this.scanIntervalID)
  }

  get listeningIDs() {
    const enter = Object.keys(this.enterListeners)
    const leave = Object.keys(this.leaveListeners)
    const onNetwork = Object.keys(this.onNetworkListeners)
    const offNetwork = Object.keys(this.offNetworkListeners)
    const array = [...enter, ...leave, ...onNetwork, ...offNetwork]
    return Util.Array.removeDuplicates({ array: [...enter, ...leave, ...onNetwork, ...offNetwork] })
  }

  getNetworkMap() {
    return new Promise((resolve) => {
      Util.Network.getIPsOnNetwork().then(ips => {
        resolve(ips)
      })
    })
  }

  scanNetwork() {
    return new Promise((resolve, reject) => {
      this.getNetworkMap().then((devices) => {
        // const currentDevices = devices.map(device => device.id)
        const currentDevices = devices
        const expiredDevices = Util.Array.difference({ array1: this.devicesOnNetwork, array2: currentDevices })
        const newDevices = Util.Array.difference({ array1: currentDevices, array2: this.devicesOnNetwork })
        const expiredListening = Util.Array.difference({ array1: this.listeningIDs, array2: currentDevices })
        resolve({ current: currentDevices, expired: expiredDevices, new: newDevices, expiredListening })
      })
    })
  }

  refreshNetwork(loop) {
    // debug('refreshing network', loop)
    this.scanNetwork().then((data) => {
      // debug('refresh finished')
      // debug(data)
      this.devicesOnNetwork = data.current
      this.notify({ ids: data.new, eventName: 'deviceEntered' })
      this.notify({ ids: data.expired, eventName: 'deviceLeft' })
      this.notify({ ids: data.current, eventName: 'deviceOnNetwork' })
      this.notify({ ids: data.expiredListening, eventName: 'deviceOffNetwork' })
      // debug('new', data.new)
      // debug('expired', data.expired)
      // debug('current', data.current)
      // debug('expired listening', data.expiredListening)
      if (loop) {
        this.scanIntervalID = setTimeout(this.refreshNetwork.bind(this, true), this.scanInterval)
      }
    }).catch((err) => {
      debug(err)
    })
  }

  notify({ ids, eventName }) {
    ids.forEach(id => {
      const event = this[eventName].bind(this)
      if (typeof event === 'function') {
        event({ id })
      }
    })
  }

  setupTriggerActive({ id, callback, waitTime }) {
    return new Promise((resolve, reject) => {
      debug('Listening to actions ON:', id)
      if (Array.isArray(id)) {
        id.forEach((myID) => {
          this.onNetwork({ id: myID, callback, waitTime })
        })
      } else {
        this.onNetwork({ id, callback, waitTime })
      }
      resolve()
    })
  }

  setupTriggerInactive({ id, callback, threshold }) {
    return new Promise((resolve, reject) => {
      debug('Listening to actions OFF:', id)
      if (Array.isArray(id)) {
        id.forEach((myID) => {
          this.offNetwork({ id: myID, callback, threshold })
        })
      } else {
        this.offNetwork({ id, callback, threshold })
      }
      resolve()
    })
  }

  onEnter({ callback, id }) {
    return this.addListener({ callback, id, listenContainer: 'enterListeners' })
  }

  onLeave({ callback, id }) {
    return this.addListener({ callback, id, listenContainer: 'leaveListeners' })
  }

  /**
   * 
   * @id string -- the IP/MAC address of the device leaving the network
   * @callback function -- the function to be called when the device with `id` leaves the network
   * @waitAfterFirst number -- time in milliseconds that should go by before callback should be called after the first time
   * ex. The device connects, but the device keeps disconnecting and reconnecting to the network. This is the amount of time that should
   * pass of inactivity before the callback should be called again
   */
  onNetwork({ callback, id, waitTime }) {
    if (waitTime != null) {
      this.waitMap[id] = {
        waitTime,
        timeoutID: null
      }
    }
    if (this.devicesOnNetwork.indexOf(id.toUpperCase()) !== -1) {
      this.deviceOnNetwork({ id })
    }
    return this.addListener({ callback, id, listenContainer: 'onNetworkListeners' })
  }

  /**
   * 
   * @id string -- the IP/MAC address of the device leaving the network
   * @callback function -- the function to be called when the device with `id` leaves the network
   * @threshold number -- the amount of times the device can be disconnected from the network before registering as off the network
   */
  offNetwork({ callback, id, threshold }) {
    if (threshold != null) {
      this.thresholdMap[id] = {
        threshold,
        count: 0
      }
    }
    return this.addListener({ callback, id, listenContainer: 'offNetworkListeners' })
  }

  addListener({ callback, id, listenContainer }) {
    id = id || Util.ID.guid()
    id = id.toUpperCase()
    this[listenContainer][id] = callback
    return id
  }

  // EVENTS
  deviceOnNetwork(event) {
    const { id } = event
    const callback = this.onNetworkListeners[id]
    // If there's a threshold set, we reset it here
    const thresholdObj = this.thresholdMap[id]
    if (thresholdObj) {
      thresholdObj.count = 0
    }
    // if there's a wait time set
    let waiting = false
    if (this.waitMap[id]) {
      debug(`Device ${id} has wait of ${this.waitMap[id].waitTime}; Timeout ID is: ${this.waitMap[id].timeoutID}`)
      if (this.waitMap[id].timeoutID != null) {
        waiting = true
        debug(`Device ${id} is currently waiting`)
      } else {
        debug(`Setting wait for ${id}, ${this.waitMap[id].waitTime}`)
        this.waitMap[id].timeoutID = setTimeout(() => {
          debug(`Wait over for ${id}. Setting to null.`)
          this.waitMap[id].timeoutID = null
        }, this.waitMap[id].waitTime)
      }
    }
    const alreadyOnNetwork = this.devicesOnNetwork.indexOf(id) === -1
    const thresholdDevice = this.thresholdMap[id] != null
    if (typeof callback === 'function' && (!alreadyOnNetwork && thresholdDevice && !waiting)) { callback(event) }
  }

  deviceOffNetwork(event) {
    const { id } = event
    const callback = this.offNetworkListeners[event.id]
    // If there's a threshold object set here, increment the current count
    const thresholdObj = this.thresholdMap[id]
    if (thresholdObj) {
      thresholdObj.count += 1
    }
    if (this.waitMap[id] && this.waitMap[id].timeoutID != null) {
      clearTimeout(this.waitMap[id].timeoutID)
      this.waitMap[id].timeoutID = null
    }
    const meetsThreshold = (!thresholdObj || (thresholdObj && thresholdObj.count < thresholdObj.threshold))
    const alreadyOffNetwork = this.devicesOnNetwork.indexOf(event.id) === -1
    if (typeof callback === 'function' && meetsThreshold && !alreadyOffNetwork) {
      callback(event)
    }
  }

  deviceEntered(event) {
    debug('device entered:', event.id)
    const callback = this.enterListeners[event.id]
    if (typeof callback === 'function') { callback(event) }
  }

  deviceLeft(event) {
    debug('device left:', event.id)
    const callback = this.leaveListeners[event.id]
    if (typeof callback === 'function') { callback(event) }
  }
}

module.exports = Scanner