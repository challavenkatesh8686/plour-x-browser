export interface ToastAction {
  label: string;
  onPress: () => void;
}

export interface ToastPayload {
  id: string;
  message: string;
  action?: ToastAction;
}

const EVENT = 'plourx-browser:toast';

export function showToast(message: string, action?: ToastAction) {
  const payload: ToastPayload = { id: crypto.randomUUID(), message, action };
  window.dispatchEvent(new CustomEvent<ToastPayload>(EVENT, { detail: payload }));
}

export function onToast(listener: (payload: ToastPayload) => void) {
  const handler = (event: Event) => listener((event as CustomEvent<ToastPayload>).detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
