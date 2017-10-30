export const NO_EXCEPTION = 'NO_THROWN_EXCEPTION';
export const captureException = fn => {
  try {
    fn();
  } catch (e) {
    if (!e.hasOwnProperty('type')) {
      throw new Error(`got exception without property 'type' ${e}`);
    }
    return e;
  }
  return { type: NO_EXCEPTION };
};
