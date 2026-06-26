import { mount } from 'svelte'
import '../app.css'
import { theme } from '../lib/theme.svelte'
import App from './App.svelte'

void theme.init() // 동기 prefix가 mount 전에 테마를 적용한다
const app = mount(App, { target: document.getElementById('app')! })
export default app
