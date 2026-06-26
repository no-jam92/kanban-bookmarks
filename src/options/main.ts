import { mount } from 'svelte'
import '../app.css'
import { theme } from '../lib/theme.svelte'
import Options from './Options.svelte'

void theme.init()
export default mount(Options, { target: document.getElementById('app')! })
