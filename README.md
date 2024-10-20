# TrustyBite-SmartContract
Smart contract for the TrustyBite platform, enabling real-time freshness and cleanliness tracking for restaurants through sensor data and user reviews, ensuring transparency and trust in food safety standards on the NEAR blockchain.

# TrustyBite Interaction Flow

In **TrustyBite**, a seamless experience is crafted for both restaurant owners and food enthusiasts, ensuring transparency and freshness in dining. Here’s how the interaction unfolds:

1. **Restaurant Registration**
   - The **Restaurant Owner** registers their restaurant on the **TrustyBite** platform. This step secures a unique identifier for their establishment, allowing for data tracking and visibility.

2. **Sensor Data Upload**
   - The **FreshSense Device**, representing the Raspberry Pi, continuously monitors environmental conditions and sensor readings (like humidity, temperature, and gas levels). It uploads this crucial data to **TrustyBite**, ensuring real-time updates on food freshness and hygiene.

3. **Fetching Sensor Data**
   - A **Food Enthusiast** interested in dining at a particular restaurant queries **TrustyBite** for freshness and cleanliness data related to their chosen food category over a specific time period. This allows them to make informed decisions based on real data.

4. **Dining Experience**
   - After reviewing the data, the **Food Enthusiast** visits the restaurant to enjoy a delightful meal, confident in the quality and freshness of the food.

5. **Leaving a Review**
   - Following their enjoyable experience, the **Food Enthusiast** leaves a glowing review on **TrustyBite**. This review is vital for future diners and contributes to the restaurant's reputation.

6. **Review Insights**
   - Other **Food Enthusiasts** can check the reviews and freshness data for the restaurant, helping them decide where to dine based on the experiences of others and the real-time sensor data.

Through this workflow, **TrustyBite** ensures a transparent, trustworthy, and enjoyable dining experience for everyone involved!

<img width="729" alt="image" src="https://github.com/user-attachments/assets/059e7e2f-a135-429d-bd6c-938801d4e072">

## Classes

### 1. SensorData
Represents the data collected from various sensors related to a specific restaurant.

- **Attributes:**
  - `timestamp: number` - The time at which the data was collected.
  - `humidity: number` - The humidity level recorded.
  - `temperature: number` - The temperature recorded.
  - `mq3: number` - Sensor reading from MQ-3.
  - `mq4: number` - Sensor reading from MQ-4.
  - `mq8: number` - Sensor reading from MQ-8.
  - `mq135: number` - Sensor reading from MQ-135.
  - `mq137: number` - Sensor reading from MQ-137.

- **Constructor:**
  - `constructor(timestamp: number, humidity: number, temperature: number, mq3: number, mq4: number, mq8: number, mq135: number, mq137: number)`

### 2. Review
Represents a user review for a restaurant.

- **Attributes:**
  - `reviewer: string` - The name of the reviewer.
  - `content: string` - The content of the review.
  - `timestamp: number` - The time at which the review was created.

- **Constructor:**
  - `constructor(reviewer: string, content: string, timestamp: number)`

### 3. TrustyBite
The main class that manages restaurants, sensor data, and reviews.

- **Attributes:**
  - `restaurants: Record<string, {owner: string, categories: {fruits: Array<SensorData>, vegetables: Array<SensorData>, meat: Array<SensorData>, fish: Array<SensorData>}, reviews: Array<Review>}>` - A record of registered restaurants and their associated data.
