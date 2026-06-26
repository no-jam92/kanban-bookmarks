export interface ModalField {
  name: string
  label: string
  value?: string
  placeholder?: string
  type?: 'text' | 'url'
  required?: boolean
}

interface FormState {
  kind: 'form'
  title: string
  fields: ModalField[]
  confirmText: string
}
interface ConfirmState {
  kind: 'confirm'
  title: string
  message?: string
  confirmText: string
  danger: boolean
}
export type ModalState = FormState | ConfirmState

export type FormResult = Record<string, string>

class ModalStore {
  current = $state<ModalState | null>(null)
  #resolve: ((value: unknown) => void) | null = null

  form(opts: { title: string; fields: ModalField[]; confirmText?: string }): Promise<FormResult | null> {
    return new Promise((res) => {
      this.#settle(res as (v: unknown) => void)
      this.current = {
        kind: 'form',
        title: opts.title,
        fields: opts.fields,
        confirmText: opts.confirmText ?? '확인',
      }
    })
  }

  confirm(opts: { title: string; message?: string; confirmText?: string; danger?: boolean }): Promise<boolean> {
    return new Promise((res) => {
      this.#settle(res as (v: unknown) => void)
      this.current = {
        kind: 'confirm',
        title: opts.title,
        message: opts.message,
        confirmText: opts.confirmText ?? '확인',
        danger: opts.danger ?? false,
      }
    })
  }

  resolve(value: unknown): void {
    const r = this.#resolve
    this.#resolve = null
    this.current = null
    r?.(value)
  }

  cancel(): void {
    this.resolve(this.current?.kind === 'confirm' ? false : null)
  }

  // If a previous modal is somehow still open, settle it as cancelled first.
  #settle(res: (v: unknown) => void): void {
    if (this.#resolve) this.#resolve(this.current?.kind === 'confirm' ? false : null)
    this.#resolve = res
  }
}

export const modal = new ModalStore()
