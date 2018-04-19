const os = require('os')
const arp = require('arp-a')
const portscanner = require('portscanner')

class NetworkUtil {
  get deviceIP() {
    if (!this._ip) {
      const addresses = this.localIPAddresses()
      if (addresses.length > 0) {
        this._ip = addresses[0]
      }
    }
    return this._ip
  }

  localIPAddresses() {
    const interfaces = os.networkInterfaces()
    const keys = Object.keys(interfaces)
    const validInterfaces = []
    keys.forEach((key) => {
      const item = interfaces[key]
      item.forEach((iface) => {
        if (iface.family === 'IPv4' && !iface.internal && iface.address !== '127.0.0.1') {
          validInterfaces.push(iface.address)
        }
      })
    })
    return validInterfaces
  }

  getIPsOnNetworkOnPort(port) {
    return new Promise((resolve) => {
      const ips = this.getIPsOnNetwork()
      this.ipsOnPort(port, ips).then((ips) => {
        resolve(ips)
      })
    })
  }

  getIPsOnNetwork() {
    const ips = []
    arp.table(function (err, entry) {
      if (!!err) return console.log('arp: ' + err.message)
      if (!entry) return
      ips.push(entry.ip)
    })
    return ips
  }

  ipOnPort(port, ip) {
    return new Promise((resolve) => {
      portscanner.checkPortStatus(port, ip, (err, status) => {
        resolve(status)
      })
    })
  }

  ipsOnPort(port, ips) {
    return new Promise((resolve) => {
      let completeCount = 0
      const ipArray = []
      const checkComplete = (data) => {
        if (data.status) {
          ipArray.push(data.ip)
        }
        completeCount += 1
        if (completeCount >= ips.length) {
          resolve(ipArray)
        }
      }
      ips.forEach((ip) => {
        this.ipOnPort(port, ip).then((status) => {
          checkComplete({ ip, status: status === 'open' })
        })
      })
    })
  }
}

module.exports = new NetworkUtil()