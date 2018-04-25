class ArrayUtil {
  removeDuplicates({ array, prop }) {
    const isArray = (Array.isArray(prop) && prop.length > 0)
    const property = isArray ? prop.shift() : prop
    if (isArray) {
      return this.removeDuplicates({ array, prop: property })
    }
    return array.filter((obj, pos, arr) => arr.map(mapObj => mapObj[property]).indexOf(obj[property]) === pos)
  }
}

module.exports = new ArrayUtil()