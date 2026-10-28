import {defineConfig} from 'vitest/config';
export default defineConfig({test:{environment:'node',setupFiles:['./tests/setup.js'],testTimeout:180000,pool:'forks',poolOptions:{forks:{singleFork:false}}}});
