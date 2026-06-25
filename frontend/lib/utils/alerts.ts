import Swal from 'sweetalert2';

function themeColors() {
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    background: dark ? '#172033' : '#ffffff',
    color:      dark ? '#f8fafc'  : '#111827',
    cancelBg:   dark ? '#1f2937'  : '#f3f4f6',
    cancelColor:dark ? '#94a3b8'  : '#374151',
  };
}

interface ConfirmDeleteOptions {
  title?: string;
  confirmText?: string;
  cancelText?: string;
}

export async function confirmDelete(opts: ConfirmDeleteOptions = {}): Promise<boolean> {
  const { background, color, cancelBg, cancelColor } = themeColors();

  const result = await Swal.fire({
    title: opts.title ?? 'Are you sure?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: opts.confirmText ?? 'Delete',
    cancelButtonText: opts.cancelText ?? 'Cancel',
    reverseButtons: true,
    width: '22rem',
    background,
    color,
    confirmButtonColor: '#ef4444',
    customClass: {
      popup:         'rounded-2xl shadow-xl text-sm',
      title:         '!text-base !font-semibold !pt-5 !pb-1',
      actions:       '!gap-2 !mt-4 !mb-5',
      confirmButton: '!rounded-full !px-5 !py-1.5 !text-sm !font-semibold',
      cancelButton:  '!rounded-full !px-5 !py-1.5 !text-sm !font-semibold',
    },
    didOpen: (popup) => {
      const cancel = popup.querySelector('.swal2-cancel') as HTMLElement | null;
      if (cancel) {
        cancel.style.backgroundColor = cancelBg;
        cancel.style.color = cancelColor;
      }
    },
  });
  return result.isConfirmed;
}

export function toastSuccess(message: string): void {
  const { background, color } = themeColors();
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'success',
    title: message,
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
    background,
    color,
  });
}

export function toastError(message: string): void {
  const { background, color } = themeColors();
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'error',
    title: message,
    showConfirmButton: false,
    timer: 3500,
    timerProgressBar: true,
    background,
    color,
  });
}
