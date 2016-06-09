package edu.zhangfan.cs237.producer;

import com.google.common.io.Resources;
import com.google.gson.Gson;
import edu.zhangfan.cs237.common.DriverLocationEvent;
import edu.zhangfan.cs237.common.Event;
import edu.zhangfan.cs237.common.StreamName;
import edu.zhangfan.cs237.common.Type;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.Producer;
import org.apache.kafka.clients.producer.ProducerRecord;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;
import java.util.Random;

public class SampleTestProducer implements ITestProducer {
  private static Gson gson = new Gson();
  private static final int INIT_DRIVER_NUM = 1000;
  private static final int BLOCK_ID = 1;
  private static Random random = new Random();

  private Producer<String, String> producer;
  private final double ratio;
  private final long messageCount;

  private Map<String, Long> timestamp;

  public SampleTestProducer(long messageCount, double ratio) {
    this.messageCount = messageCount;
    this.ratio = ratio;
    this.timestamp = new HashMap<String, Long>();

    Properties properties = new Properties();
    try (InputStream in = Resources.getResource("producer.properties").openStream()) {
      properties.load(in);
      this.producer = new KafkaProducer<>(properties);
    } catch (IOException e) {
      System.out.println("Error");
    }
  }

  public void initiate() {
    // Initialize: $INIT_DRIVER_NUM driver to the block
    for (int i = 0; i < INIT_DRIVER_NUM; ++i) {
      DriverLocationEvent location = new DriverLocationEvent(1, Integer.toString(i), 1., 2., Type.DRIVER_LOCATION);
      producer.send(new ProducerRecord<>(StreamName.DRIVER_LOCATIONS, Integer.toString(location.getBlockId()), gson.toJson(location)));
    }
  }

  public long activate() {
    long rideRequestCounter = 0;
    for (int i = 0; i < messageCount; i++) {
      double wheel = random.nextDouble();
      if (wheel < ratio) {
        String driverID = Integer.toString(random.nextInt() % INIT_DRIVER_NUM);
        DriverLocationEvent location = new DriverLocationEvent(BLOCK_ID, driverID, 1., 2., Type.DRIVER_LOCATION);
        producer.send(new ProducerRecord<>(StreamName.DRIVER_LOCATIONS, Integer.toString(location.getBlockId()), gson.toJson(location)));
      } else {
        String riderID = Long.toString(rideRequestCounter);
        Event event = new Event(BLOCK_ID, riderID, 1., 2., null, Type.RIDE_REQUEST);
        producer.send(new ProducerRecord<>(StreamName.EVENTS, Integer.toString(event.getBlockId()), gson.toJson(event)));
        rideRequestCounter += 1;
        this.timestamp.put(riderID, System.currentTimeMillis());
      }
    }
    producer.close();
    return rideRequestCounter;
  }

  public Map<String, Long> getTimestamp() {
    return this.timestamp;
  }

  public static void main(String[] args) throws IOException {
    SampleTestProducer producer = new SampleTestProducer(100, 1.0);
    producer.activate();
  }

}
