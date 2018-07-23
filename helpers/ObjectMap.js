const Util = require('../util')
const debug = Util.Log('Helpers:ObjectMap')

class ObjectMap {
  constructor() {
    this.initMap()
    this._listeners = {}
    this._items = []
    this._itemsDirty = true
  }

  initMap() {
    this._map = {}
    this.map = new Proxy(this._map, {
      get: this.getObj.bind(this),
      set: this.setObj.bind(this)
    })
  }

  get items() {
    if (this._itemsDirty) {
      // cache the list of new items
      this._items = Object.keys(this._map).map(key => this._map[key])
      // items aren't dirty anymore
      this._itemsDirty = false
    }
    return this._items
  }

  // LISTENERS
  uniqueListenerID(id) {
    if (!id) { id = Util.ID.guid() }
    if (this._listeners[id]) {
      return this.ensureUniqueListenerID(Util.ID.guid())
    } else {
      return id
    }
  }

  addListener({ id, callback }) {
    id = this.uniqueListenerID(id)
    if (typeof callback === 'function') {
      this._listeners[id] = callback
      return id
    }
    debug('Cannot add listener of type', typeof callback)
    return null
  }

  removeListener({ id }) {
    debug('Removing listener:', id)
    delete this._listeners[id]
  }

  notify(method, prop, value) {
    Object.keys(this._listeners).forEach(key => {
      const callback = this._listeners[key]
      if (typeof key === 'function') {
        callback(method, prop, value)
      }
    })
  }

  // GETTERS/SETTERS
  update() {
    // update the list of items
    this._itemsDirty = true
    // this is a getter, so the list will be refreshed after this declaration
    this.items
  }

  getObj(obj, prop) {
    if (prop) {
      const value = obj[prop]
      this.notify('get', prop, value)
      return value
    } else {
      this.notify('get', null, obj)
      return obj
    }
  }

  setObj(target, prop, value, receiver) {
    if (prop != null) {
      this._itemsDirty = true
      this.notify('set', prop, value)
      target[prop] = value
      return true
    } else {
      this.notify('set', null, null)
      return false
    }
  }
}

module.exports = ObjectMap