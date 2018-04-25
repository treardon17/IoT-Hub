class ArrayUtil {
  removeDuplicates({ array, prop }) {
    const isArray = (typeof prop === 'Array' && prop.length > 0)
    const property = isArray ? prop.shift() : prop

    if (isArray) {
      return this.removeDuplicates({ array, prop })
    }
    return array.filter((obj, pos, arr) => arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos)
  }
}

module.exports = new ArrayUtil()