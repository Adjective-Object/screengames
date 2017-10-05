import { cloneDeep } from "lodash";
const dataProvider = dataset => test_function => {
  for (let test_name in dataset) {
    let test_data = cloneDeep(dataset[test_name]);
    it(test_name, () => test_function(test_data));
  }
};

export default dataProvider;
