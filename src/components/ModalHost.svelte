<script lang="ts">
  import { fade, scale } from 'svelte/transition'
  import { modal } from '../lib/modal.svelte'

  let values = $state<Record<string, string>>({})
  let panel = $state<HTMLElement | null>(null)

  // 폼이 열리면 초기값 세팅
  $effect(() => {
    const c = modal.current
    if (c?.kind === 'form') {
      const v: Record<string, string> = {}
      for (const f of c.fields) v[f.name] = f.value ?? ''
      values = v
    }
  })

  // 패널이 그려지면 첫 입력에 포커스
  $effect(() => {
    if (modal.current?.kind === 'form' && panel) {
      const el = panel.querySelector('input')
      el?.focus()
      el?.select()
    }
  })

  let canSubmit = $derived.by(() => {
    const c = modal.current
    if (c?.kind !== 'form') return true
    return c.fields.every((f) => !f.required || (values[f.name]?.trim().length ?? 0) > 0)
  })

  function submit(e?: Event) {
    e?.preventDefault()
    const c = modal.current
    if (!c) return
    if (c.kind === 'form') {
      if (!canSubmit) return
      modal.resolve({ ...values })
    } else {
      modal.resolve(true)
    }
  }

  function onKey(e: KeyboardEvent) {
    if (!modal.current) return
    if (e.key === 'Escape') modal.cancel()
  }
</script>

<svelte:window onkeydown={onKey} />

{#if modal.current}
  {@const c = modal.current}
  <div class="backdrop" transition:fade={{ duration: 120 }}
       onclick={(e) => { if (e.target === e.currentTarget) modal.cancel() }} role="presentation">
    <div class="panel" bind:this={panel} role="dialog" aria-modal="true" aria-label={c.title} tabindex="-1"
         transition:scale={{ duration: 150, start: 0.96 }}>
      <h2>{c.title}</h2>

      {#if c.kind === 'form'}
        <form onsubmit={submit}>
          {#each c.fields as f (f.name)}
            <label class="field">
              <span class="lbl">{f.label}{#if f.required}<em>*</em>{/if}</span>
              <input class="tn-input" type={f.type ?? 'text'}
                     bind:value={values[f.name]} placeholder={f.placeholder ?? ''} />
            </label>
          {/each}
          <div class="actions">
            <button type="button" class="tn-btn" onclick={() => modal.cancel()}>취소</button>
            <button type="submit" class="tn-btn tn-btn--primary" disabled={!canSubmit}>{c.confirmText}</button>
          </div>
        </form>
      {:else}
        {#if c.message}<p class="msg">{c.message}</p>{/if}
        <div class="actions">
          <button class="tn-btn" onclick={() => modal.cancel()}>취소</button>
          <button class="tn-btn {c.danger ? 'tn-btn--danger' : 'tn-btn--primary'}"
                  onclick={submit}>{c.confirmText}</button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: grid;
    place-items: center;
    padding: var(--space-5);
    background: rgba(13, 14, 20, 0.6);
    backdrop-filter: blur(4px);
  }
  .panel {
    width: 100%;
    max-width: 420px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-drag);
    padding: var(--space-5);
  }
  h2 {
    margin: 0 0 var(--space-4);
    font-size: var(--text-lg);
    font-weight: var(--weight-semibold);
    color: var(--color-text);
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin-bottom: var(--space-4);
  }
  .lbl {
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .lbl em { color: var(--color-danger); font-style: normal; margin-left: 2px; }
  .field .tn-input { height: 38px; width: 100%; }
  .msg {
    margin: 0 0 var(--space-4);
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
    line-height: 1.5;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
    margin-top: var(--space-2);
  }
  .tn-btn[disabled] { opacity: 0.45; cursor: not-allowed; }
</style>
