// @flow
import CodedError from '../../../util/CodedError';

export default class ResizeToContainer {
  resizeContainer: HTMLElement;
  resizedElement: HTMLSvgElement;

  constructor(resize_container: HTMLElement, resized_element: HTMLSvgElement) {
    this.resizeContainer = resize_container;
    this.resizedElement = resized_element;
  }

  /**
   * Manually perform the resize of the bound resizedElement ot the bound
   * resize container
   **/
  resize(resize_event: Event): ResizeToContainer {
    let container_box = this.resizeContainer.getBoundingClientRect();
    this.resizedElement.setAttribute('width', container_box.width);
    this.resizedElement.setAttribute('height', container_box.height);
    this.resizedElement.setAttribute(
      'viewBox',
      `0 0 ${container_box.width} ${container_box.height}`,
    );
    return this;
  }

  /**
   * Register the resize container 
   **/
  bind(resize_trigger: HTMLElement): ResizeToContainer {
    resize_trigger.addEventListener('resize', event => this.resize(event));
    return this;
  }
}
