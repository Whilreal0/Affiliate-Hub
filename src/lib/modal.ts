export function modalFocus(node: HTMLElement, onclose: () => void) {
  const previous = document.activeElement as HTMLElement | null;
  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const backdrop = node.parentElement;
  const handle = document.createElement('div');
  handle.className = 'sheet-drag-handle';
  handle.setAttribute('aria-hidden', 'true');
  node.prepend(handle);
  let touchStart: { x: number; y: number } | null = null;
  let dragDistance = 0;
  let dragging = false;
  let suppressClick = false;
  function resetDrag() {
    touchStart = null;
    dragging = false;
    dragDistance = 0;
    node.classList.remove('sheet-dragging');
    node.style.removeProperty('translate');
  }
  function touchStartSheet(event: TouchEvent) {
    resetDrag();
    suppressClick = false;
    if (!matchMedia('(max-width: 850px)').matches || event.touches.length !== 1) return;
    const target = event.target as HTMLElement;
    // Inputs, selections and nested scrollers retain their native gestures.
    if (target.closest('button, a, input, textarea, select, [contenteditable="true"]')) return;
    for (
      let element: HTMLElement | null = target;
      element && element !== node;
      element = element.parentElement
    ) {
      if (
        element.scrollHeight > element.clientHeight &&
        /auto|scroll/.test(getComputedStyle(element).overflowY)
      )
        return;
    }
    if (node.scrollTop > 0) return;
    const touch = event.touches[0];
    touchStart = { x: touch.clientX, y: touch.clientY };
  }
  function touchMoveSheet(event: TouchEvent) {
    if (!touchStart) return;
    if (event.touches.length !== 1) return resetDrag();
    const touch = event.touches[0];
    const distance = touch.clientY - touchStart.y;
    const horizontal = Math.abs(touch.clientX - touchStart.x);
    if (!dragging) {
      if (Math.max(Math.abs(distance), horizontal) < 8) return;
      if (distance <= horizontal || distance < 0 || node.scrollTop > 0) return resetDrag();
      dragging = true;
      node.classList.add('sheet-dragging');
    }
    event.preventDefault();
    dragDistance = Math.max(0, distance);
    node.style.translate = `0 ${dragDistance}px`;
  }
  function touchEndSheet() {
    const dismiss = dragging && dragDistance >= Math.min(120, node.clientHeight * 0.25);
    suppressClick = dragging;
    resetDrag();
    if (dismiss) onclose();
  }
  function preventDragClick(event: MouseEvent) {
    if (!suppressClick) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClick = false;
  }
  node.addEventListener('touchstart', touchStartSheet, { passive: true });
  node.addEventListener('touchmove', touchMoveSheet, { passive: false });
  node.addEventListener('touchend', touchEndSheet);
  node.addEventListener('touchcancel', resetDrag);
  node.addEventListener('click', preventDragClick, true);
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
      resetDrag();
      handle.remove();
      node.removeEventListener('touchstart', touchStartSheet);
      node.removeEventListener('touchmove', touchMoveSheet);
      node.removeEventListener('touchend', touchEndSheet);
      node.removeEventListener('touchcancel', resetDrag);
      node.removeEventListener('click', preventDragClick, true);
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
