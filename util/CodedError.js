export default class CodedError extends Error {
  constructor(body) {
    super(body.message);
    for (let key in body) {
      this[key] = body[key];
    }
  }
}
