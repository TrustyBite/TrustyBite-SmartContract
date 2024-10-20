import { NearBindgen, near, call, view } from 'near-sdk-js';

// Data structure for sensor readings
class SensorData {
  timestamp: number;
  humidity: number;
  temperature: number;
  mq3: number;  // Alcohol detection (e.g., ethanol, formaldehyde)
  mq4: number;  // Methane gas detection
  mq8: number;  // Hydrogen gas detection
  mq135: number; // Air quality (CO2, NH3, benzene)
  mq137: number; // Ammonia (NH3)

  constructor(
    timestamp: number,
    humidity: number,
    temperature: number,
    mq3: number,
    mq4: number,
    mq8: number,
    mq135: number,
    mq137: number
  ) {
    this.timestamp = timestamp;
    this.humidity = humidity;
    this.temperature = temperature;
    this.mq3 = mq3;
    this.mq4 = mq4;
    this.mq8 = mq8;
    this.mq135 = mq135;
    this.mq137 = mq137;
  }
}

// Data structure for storing reviews
class Review {
  reviewer: string;
  content: string;
  timestamp: number;

  constructor(reviewer: string, content: string, timestamp: number) {
    this.reviewer = reviewer;
    this.content = content;
    this.timestamp = timestamp;
  }
}

@NearBindgen({})
class SafeBite {
  // Data structure to store each restaurant's data
  restaurants: Record<
    string,
    {
      owner: string,
      categories: {
        fruits: Array<SensorData>,
        vegetables: Array<SensorData>,
        meat: Array<SensorData>,
        fish: Array<SensorData>
      },
      reviews: Array<Review>
    }
  > = {};

  // Register a new restaurant with the caller as the owner
  @call({})
  register_restaurant({ restaurant_id }: { restaurant_id: string }): void {
    if (this.restaurants[restaurant_id]) {
      near.log(`Restaurant ${restaurant_id} is already registered.`);
      return;
    }
    const owner = near.predecessorAccountId();
    this.restaurants[restaurant_id] = {
      owner,
      categories: {
        fruits: [],
        vegetables: [],
        meat: [],
        fish: []
      },
      reviews: []
    };
    near.log(`Restaurant ${restaurant_id} has been registered by owner ${owner}.`);
  }

  // Add sensor data for a specific restaurant and food category
  @call({})
  add_sensor_data({
    restaurant_id,
    category,
    humidity,
    temperature,
    mq3,
    mq4,
    mq8,
    mq135,
    mq137
  }: {
    restaurant_id: string,
    category: "fruits" | "vegetables" | "meat" | "fish",
    humidity: number,
    temperature: number,
    mq3: number,
    mq4: number,
    mq8: number,
    mq135: number,
    mq137: number
  }): void {
    const restaurant = this.restaurants[restaurant_id];

    if (!restaurant) {
      near.log(`Restaurant ${restaurant_id} is not registered.`);
      return;
    }

    // Ensure the caller is the restaurant owner
    const caller = near.predecessorAccountId();
    if (restaurant.owner !== caller) {
      near.log(`Caller ${caller} is not the owner of restaurant ${restaurant_id}.`);
      return;
    }

    // Create a new SensorData object with the current timestamp
    const timestampBigInt = near.blockTimestamp(); // This is a bigint
    const timestamp = Number(timestampBigInt / BigInt(1_000_000)); // Convert nanoseconds to milliseconds

    const sensorData = new SensorData(timestamp, humidity, temperature, mq3, mq4, mq8, mq135, mq137);

    // Add the sensor data to the respective food category
    restaurant.categories[category].push(sensorData);
    near.log(`Sensor data added for ${category} at restaurant ${restaurant_id}.`);
  }

  // View all sensor data recorded for a specific restaurant and category
@view({})
get_sensor_data({
  restaurant_id,
  category,
  period
}: {
  restaurant_id: string,
  category: "fruits" | "vegetables" | "meat" | "fish",
  period: "last_hour" | "last_4_hours" | "last_day" | "last_week" | "last_month"
}): SensorData | null {
  const restaurant = this.restaurants[restaurant_id];
  if (!restaurant) {
    near.log(`Restaurant ${restaurant_id} is not registered.`);
    return null;
  }

  const now = Number(near.blockTimestamp()) / 1_000_000; // Convert nanoseconds to milliseconds
  let period_ms: number;

  switch (period) {
    case "last_hour":
      period_ms = 60 * 60 * 1000;
      break;
    case "last_4_hours":
      period_ms = 4 * 60 * 60 * 1000;
      break;
    case "last_day":
      period_ms = 24 * 60 * 60 * 1000;
      break;
    case "last_week":
      period_ms = 7 * 24 * 60 * 60 * 1000;
      break;
    case "last_month":
      period_ms = 30 * 24 * 60 * 60 * 1000;
      break;
    default:
      return null;
  }

  const data = restaurant.categories[category].filter(entry => now - entry.timestamp <= period_ms);
  
  if (data.length === 0) return null;

  // Calculate averages for the sensor data
  const averageData: SensorData = {
    timestamp: now,
    humidity: 0,
    temperature: 0,
    mq3: 0,
    mq4: 0,
    mq8: 0,
    mq135: 0,
    mq137: 0
  };

  data.forEach(entry => {
    averageData.humidity += entry.humidity;
    averageData.temperature += entry.temperature;
    averageData.mq3 += entry.mq3;
    averageData.mq4 += entry.mq4;
    averageData.mq8 += entry.mq8;
    averageData.mq135 += entry.mq135;
    averageData.mq137 += entry.mq137;
  });

  // Divide by the number of entries to get averages
  averageData.humidity /= data.length;
  averageData.temperature /= data.length;
  averageData.mq3 /= data.length;
  averageData.mq4 /= data.length;
  averageData.mq8 /= data.length;
  averageData.mq135 /= data.length;
  averageData.mq137 /= data.length;

  return averageData;
}

  // Add a review for a specific restaurant
  @call({})
  add_review({
    restaurant_id,
    content
  }: {
    restaurant_id: string,
    content: string
  }): void {
    const restaurant = this.restaurants[restaurant_id];
    if (!restaurant) {
      near.log(`Restaurant ${restaurant_id} is not registered.`);
      return;
    }

    const reviewer = near.predecessorAccountId();
    const timestampBigInt = near.blockTimestamp(); // This is a bigint
    const timestamp = Number(timestampBigInt / BigInt(1_000_000)); // Convert nanoseconds to milliseconds

    const newReview = new Review(reviewer, content, timestamp);
    restaurant.reviews.push(newReview);

    near.log(`Review added by ${reviewer} for restaurant ${restaurant_id}.`);
  }

  // View all reviews for a specific restaurant
  @view({})
  get_reviews({ restaurant_id }: { restaurant_id: string }): Array<Review> | null {
    const restaurant = this.restaurants[restaurant_id];
    if (!restaurant) {
      near.log(`Restaurant ${restaurant_id} is not registered.`);
      return null;
    }

    return restaurant.reviews;
  }

  // List all registered restaurants by their ID
  @view({})
  list_restaurants(): Array<string> {
    return Object.keys(this.restaurants);
  }
}