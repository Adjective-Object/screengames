// @flow

export default class ToggleMenuButton {
  menuElement: Element;
  buttonElement: Element;
  overlayElement: Element;

  constructor(
    menu_element: Element,
    button_element: Element,
    overlay_element: Element,
  ) {
    this.menuElement = menu_element;
    this.buttonElement = button_element;
    this.overlayElement = overlay_element;
  }

  close(): void {
    this.menuElement.classList.add('hidden');
  }

  open(): void {
    this.menuElement.classList.remove('hidden');
  }

  toggle(): void {
    this.menuElement.classList.toggle('hidden');
  }

  bind() {
    this.buttonElement.addEventListener('click', () => {
      console.log('toggle on button click');
      this.toggle();
    });
    this.overlayElement.addEventListener('click', () => {
      console.log('hide on overlay click');
      this.close();
    });
    return this;
  }
}
