// Native <dialog> makes the rest of the document inert. Keep Tab cycling inside
// the dialog as well, instead of allowing the first/last control to reach browser chrome.
export function trapDialogFocus(event) {
  if (event.key !== 'Tab') return;
  const dialog = event.currentTarget;
  const focusable = Array.from(
    dialog.querySelectorAll('button, a[href], input, select, textarea, [tabindex]'),
  ).filter(
    (element) => !element.disabled && element.tabIndex >= 0 && element.getClientRects().length > 0,
  );
  const first = focusable[0];
  const last = focusable.at(-1);
  if (!first) {
    event.preventDefault();
    return;
  }
  if (
    event.shiftKey &&
    (document.activeElement === first || !dialog.contains(document.activeElement))
  ) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
