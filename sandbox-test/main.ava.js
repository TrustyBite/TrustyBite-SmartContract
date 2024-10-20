import anyTest from 'ava';
import { Worker } from 'near-workspaces';

// Set default result order for DNS
import { setDefaultResultOrder } from 'dns';
setDefaultResultOrder('ipv4first');

/**
 * @typedef {import('near-workspaces').NearAccount} NearAccount
 * @type {import('ava').TestFn<{worker: Worker, accounts: Record<string, NearAccount>}>}
 */
const test = anyTest;

test.beforeEach(async t => {
  // Create sandbox
  const worker = t.context.worker = await Worker.init();

  // Deploy contract
  const root = worker.rootAccount;
  const contract = await root.createSubAccount('test-account');

  // Get wasm file path from command line arguments
  const wasmFilePath = process.argv[2];
  if (!wasmFilePath) {
    throw new Error('WASM file path not provided.');
  }
  await contract.deploy(wasmFilePath);

  // Save state for test runs, unique for each test
  t.context.accounts = { root, contract };
});

test.afterEach.always(async (t) => {
  await t.context.worker.tearDown().catch((error) => {
    console.log('Failed to stop the Sandbox:', error);
  });
});

// Test cases
test('registers a restaurant', async (t) => {
  const { root, contract } = t.context.accounts;
  await root.call(contract, 'register_restaurant', { restaurant_id: 'restaurant1' });

  const restaurants = await contract.view('list_restaurants', {});
  t.deepEqual(restaurants, ['restaurant1']);
});

test('calculates average sensor data for a given period', async (t) => {
  const { root, contract } = t.context.accounts;
  await root.call(contract, 'register_restaurant', { restaurant_id: 'restaurant1' });

  // Add multiple sensor data entries
  await root.call(contract, 'add_sensor_data', {
    restaurant_id: 'restaurant1',
    category: 'fruits',
    humidity: 60,
    temperature: 25,
    mq3: 10,
    mq4: 20,
    mq8: 30,
    mq135: 40,
    mq137: 50
  });

  await root.call(contract, 'add_sensor_data', {
    restaurant_id: 'restaurant1',
    category: 'fruits',
    humidity: 80,
    temperature: 30,
    mq3: 20,
    mq4: 25,
    mq8: 35,
    mq135: 45,
    mq137: 55
  });

  await root.call(contract, 'add_sensor_data', {
    restaurant_id: 'restaurant1',
    category: 'fruits',
    humidity: 70,
    temperature: 28,
    mq3: 15,
    mq4: 22,
    mq8: 32,
    mq135: 42,
    mq137: 52
  });

  // Get the average sensor data for the last day
  const averageData = await contract.view('get_sensor_data', {
    restaurant_id: 'restaurant1',
    category: 'fruits',
    period: 'last_week'
  });

  // Check the average calculations
  t.is(averageData.humidity, (60 + 80 + 70) / 3);
  t.is(averageData.temperature, (25 + 30 + 28) / 3);
  t.is(averageData.mq3, (10 + 20 + 15) / 3);
  t.is(averageData.mq4, (20 + 25 + 22) / 3);
  t.is(averageData.mq8, (30 + 35 + 32) / 3);
  t.is(averageData.mq135, (40 + 45 + 42) / 3);
  t.is(averageData.mq137, (50 + 55 + 52) / 3);
});

test('adds a review for a restaurant', async (t) => {
  const { root, contract } = t.context.accounts;
  await root.call(contract, 'register_restaurant', { restaurant_id: 'restaurant1' });

  await root.call(contract, 'add_review', {
    restaurant_id: 'restaurant1',
    content: 'Great food!'
  });

  const reviews = await contract.view('get_reviews', { restaurant_id: 'restaurant1' });
  t.is(reviews.length, 1);
  t.is(reviews[0].content, 'Great food!');
   // Ensure the review has a valid timestamp
   console.log("================================================")
   console.log('Review timestamp:', reviews[0].timestamp);
   console.log("================================================")
    // Convert the timestamp to a human-readable date
  const timestamp = reviews[0].timestamp;
  const readableDate = new Date(timestamp).toLocaleString();

  // Print the timestamp in human-readable format
  console.log('Review timestamp (human-readable):', readableDate);
  console.log("================================================")


   t.truthy(reviews[0].timestamp); // Check that the timestamp is not nil or 0
   t.is(typeof reviews[0].timestamp, 'number'); // Ensure the timestamp is a number
   t.true(reviews[0].timestamp > 0); // Ensure the timestamp is greater than 0
});

test('does not retrieve non-existing restaurant', async (t) => {
  const { contract } = t.context.accounts;

  const sensorData = await contract.view('get_sensor_data', {
    restaurant_id: 'non_existing_restaurant',
    category: 'fruits',
    period: 'last_day'
  });

  t.is(sensorData, null);
});

test('does not retrieve reviews from non-existing restaurant', async (t) => {
  const { contract } = t.context.accounts;

  const reviews = await contract.view('get_reviews', { restaurant_id: 'non_existing_restaurant' });
  t.is(reviews, null);
});

