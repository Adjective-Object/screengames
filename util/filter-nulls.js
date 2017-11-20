export default function filterNulls<T>(arr: Array<?T>): Array<T> {
  var result = [];
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] != null) {
      result.push(arr[i]);
    }
  }
  return result;
}
