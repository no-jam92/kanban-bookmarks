/// <reference types="svelte" />
/// <reference types="vite/client" />
/// <reference types="chrome" />

declare module '*.svelte' {
  import type { Component } from 'svelte'
  const component: Component<Record<string, unknown>>
  export default component
}
