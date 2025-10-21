import 'reflect-metadata';
import dataSource from '../typeorm.datasource';

async function run() {
  try {
    await dataSource.initialize();
    await dataSource.runMigrations();
    // eslint-disable-next-line no-console
    console.log('[migrations] Applied');
    await dataSource.destroy();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[migrations] Failed:', e);
    process.exit(1); // fail-fast: block app startup when migrations fail
  }
}

run();


