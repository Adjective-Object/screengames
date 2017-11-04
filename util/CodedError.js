export default class CodedError extends Error {
  constructor(body) {
    super(body.message);
    for (let key in body) {
      this[key] = body[key];
    }
  }
}

export function invariantViolation(message: string) {
  return new CodedError({
    type: 'invariant_violation',
    message,
  });
}
