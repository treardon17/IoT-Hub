class ObjectUtil {
  removeKeysFromObject({ object, keys }) {
    keys.forEach(key => {
      delete object[key]
    })
  }
}

module.exports = new ObjectUtil()