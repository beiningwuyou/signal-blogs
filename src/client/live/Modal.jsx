import { useEffect, useRef } from 'react';
import { trapDialogFocus } from '../components/dialog.js';
import { IconButton } from '../components/UI.jsx';

export function Modal({ title, onClose, children, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    dialog.showModal();
    return () => {
      dialog.close();
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`live-modal ${className}`}
      aria-label={title}
      onKeyDown={trapDialogFocus}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <div className="live-modal-heading">
        <h2>{title}</h2>
        <IconButton icon="close" label={`关闭${title}`} onClick={onClose} />
      </div>
      {children}
    </dialog>
  );
}
