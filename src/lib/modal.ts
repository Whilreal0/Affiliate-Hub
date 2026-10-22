export function modalFocus(node: HTMLElement, onclose: () => void) {
  const previous = document.activeElement as HTMLElement | null;
  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const backdrop = node.parentElement;
  let startedOutside = false;
  let finishedOutside = false;
  function pointerDown(event: PointerEvent) {
    startedOutside = event.button === 0 && event.target === backdrop;
    finishedOutside = false;
  }
  function pointerUp(event: PointerEvent) {
    finishedOutside = startedOutside && event.target === backdrop;
  }
  function cancelPointer() {
    startedOutside = false;
    finishedOutside = false;
  }
  function outsideClick(event: MouseEvent) {
    const dismiss = startedOutside && finishedOutside && event.target === backdrop;
    cancelPointer();
    if (dismiss) onclose();
  }
  backdrop?.addEventListener('pointerdown', pointerDown);
  backdrop?.addEventListener('pointerup', pointerUp);
  backdrop?.addEventListener('pointercancel', cancelPointer);
  backdrop?.addEventListener('click', outsideClick);
  const focusables = () =>
    Array.from(
      node.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]'
      )
    );
  (focusables()[0] ?? node).focus();
  function keydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onclose();
    }
    if (event.key !== 'Tab') return;
    const elements = focusables();
    const first = elements[0];
    const last = elements.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
  node.addEventListener('keydown', keydown);
  return {
    destroy() {
      node.removeEventListener('keydown', keydown);
      backdrop?.removeEventListener('pointerdown', pointerDown);
      backdrop?.removeEventListener('pointerup', pointerUp);
      backdrop?.removeEventListener('pointercancel', cancelPointer);
      backdrop?.removeEventListener('click', outsideClick);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    }
  };
}
