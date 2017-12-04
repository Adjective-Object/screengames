// @flow
import log from './log';

type PropertyAttributes = {
  value: Function,
};

export default function logRuntime(name: string) {
  return function logRuntimeDecorator(
    target: Object,
    prop_name: string,
    property_attributes: PropertyAttributes,
  ): PropertyAttributes {
    let wrapped = property_attributes.value;
    return {
      value: function logRuntimeWrapper() {
        let start_time = new Date().getTime();
        wrapped.apply(this, arguments);
        let end_time = new Date().getTime();
        log.info({
          type: name,
          message: `elapsed ${end_time - start_time}ms`,
          start_time,
          end_time,
          duration: start_time - end_time,
        });
      },
    };
  };
}
