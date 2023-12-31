import * as mediasoup from 'mediasoup';
import { types as mediasoupTypes } from 'mediasoup';

import { config } from '../../config';
import { createLogger } from '../logger';

const logger = createLogger('workerPool');

class WorkerPool {
  private workers: Array<mediasoupTypes.Worker> = [];
  private currentWorkerIndex: number = 0;

  static async create(poolSize: number) {
    const workers: Array<mediasoupTypes.Worker> = [];

    for (let i = 0; i < poolSize; i++) {
      const worker = await mediasoup.createWorker({
        logLevel: config.mediasoup.worker.logLevel,
        logTags: config.mediasoup.worker.logTags,
        rtcMinPort: config.mediasoup.worker.rtcMinPort,
        rtcMaxPort: config.mediasoup.worker.rtcMaxPort,
      });

      worker.on('died', (error) => {
        logger.error('mediasoup worker died!: %o', error);
        process.exit(1);
      });

      workers.push(worker);
    }
    logger.info(`created worker pool of ${workers.length} `);
    return new WorkerPool(workers);
  }

  constructor(workers: Array<mediasoupTypes.Worker>) {
    this.workers = workers;
  }

  getWorker(): mediasoupTypes.Worker {
    const worker = this.workers[this.currentWorkerIndex];
    this.currentWorkerIndex = (this.currentWorkerIndex + 1) % this.workers.length;
    return worker;
  }
}

export { WorkerPool };
