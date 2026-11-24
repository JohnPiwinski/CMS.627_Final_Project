import { defineAppSetup } from '@slidev/types';
import { createPinia } from 'pinia';
import '../src/workspace.css';

export default defineAppSetup(({ app }) => {
  app.use(createPinia());
});
