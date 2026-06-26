import { mount } from 'svelte'
import '../app.css'
import Options from './Options.svelte'

export default mount(Options, { target: document.getElementById('app')! })
