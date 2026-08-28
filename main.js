import { AppController } from './controller/AppController.js';

(async function start() {
  const app = new AppController();
  await app.init();
})();
