export default function delegateEvent(
  scope: HTMLElement,
  event: string,
  selector: string,
  handler: (e: any) => void,
) {
  console.log(scope);
  scope.addEventListener(event, (e: any) => {
    let current = e.srcElement || e.originalTarget;
    while (current !== undefined && current !== null) {
      if (current.matches(selector)) {
        return handler.call(null, current, e);
      }
      current = current.parentElement;
    }
  });
}
