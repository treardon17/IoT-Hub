const os = require('os')
const ping = require('ping')
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

  get deviceSubnet() {
    const ip = this.deviceIP
    const ipArray = ip.split('.')
    ipArray.splice(-1,1)
    return ipArray.join('.')
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
    return new Promise((resolve, reject) => {
      this.getIPsOnNetwork().then(ips => {
        this.ipsOnPort(port, ips).then((ips) => {
          resolve(ips)
        })
      }).catch(error => reject(error))
    })
  }

  getIPsOnNetwork() {
    return new Promise((resolve, reject) => {
      const ips = []
      const maxIP = 254
      let resolveCount = 0
      const checkResolve = () => {
        resolveCount += 1
        if (resolveCount >= maxIP) {
          resolve(ips)
        }
      }
      for (let index = 1; index < maxIP + 1; index++) {
        const ipAddr = `${this.deviceSubnet}.${index}`
        ping.sys.probe(ipAddr, (isAlive) => {
          if (isAlive) {
            ips.push(ipAddr)
          }
          checkResolve()
        })
      }
    })
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