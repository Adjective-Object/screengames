// @flow
import delegateEvent from './delegate-event';

export default class ToggleFullscreenButton {
  fullscreenTarget: Element;
  constructor(fullscreen_target: Element) {
    this.fullscreenTarget = fullscreen_target;
  }

  bind(scope: Node, selector: string) {
    delegateEvent(
      scope,
      'click',
      selector,
      (toggleFullscreenButton: HTMLElement, e: MouseEvent) => {
        let doc = window.document;

        let requestFullScreen =
          this.fullscreenTarget.requestFullscreen ||
          this.fullscreenTarget.mozRequestFullScreen ||
          this.fullscreenTarget.webkitRequestFullScreen ||
          // $FlowFixMe MS specific handler
          this.fullscreenTarget.msRequestFullscreen;
        let cancelFullScreen =
          doc.exitFullscreen ||
          doc.mozCancelFullScreen ||
          doc.webkitExitFullscreen ||
          doc.msExitFullscreen;

        if (
          !doc.fullscreenElement &&
          !doc.mozFullScreenElement &&
          !doc.webkitFullscreenElement &&
          !doc.msFullscreenElement
        ) {
          toggleFullscreenButton.classList.add('fullscreen');
          requestFullScreen.call(this.fullscreenTarget);
        } else {
          cancelFullScreen.call(doc);
          toggleFullscreenButton.classList.remove('fullscreen');
        }
      },
    );
  }
}
