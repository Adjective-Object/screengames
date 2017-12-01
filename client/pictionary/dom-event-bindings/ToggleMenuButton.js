// @flow

export default class ToggleMenuButton {
  menuElement: Element;
  buttonElement: Element;

  constructor(menu_element: Element, button_element: Element) {
    this.menuElement = menu_element;
    this.buttonElement = button_element;
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
    this.menuElement.addEventListener('click', () => {
      this.toggle();
    });
  }
}
