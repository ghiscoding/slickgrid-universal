import { mount } from 'svelte';
import './styles.scss';
import App from './App.svelte';

mount(App, { target: document.getElementById('app')! });
