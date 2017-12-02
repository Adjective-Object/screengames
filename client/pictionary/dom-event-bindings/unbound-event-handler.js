// @flow
import CodedError from '../../../util/CodedError';

export default function unboundEventHandler(handler_name: string) {
  return () => {
    throw new CodedError({
      type: 'unbound event handler',
      message: `called unbound event handler ${handler_name}`,
    });
  };
}
