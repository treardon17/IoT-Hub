class ArrayUtil {
  removeDuplicates({ array, prop }) {
    return array.filter((obj, pos, arr) => {
      return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos;
    })
  }
}

module.exports = new ArrayUtil()