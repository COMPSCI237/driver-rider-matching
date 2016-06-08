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
import java.util.Properties;

public class SampleProducer implements IProducer {
  private static Gson gson = new Gson();

  private Producer<String, String> producer;
  private final double ratio;
  private final int messageCount;

  public SampleProducer(int messageCount, double ratio) {
    this.messageCount = messageCount;
    this.ratio = ratio;

    Properties properties = new Properties();
    try (InputStream in = Resources.getResource("producer.properties").openStream()) {
      properties.load(in);
      this.producer = new KafkaProducer<>(properties);
    } catch (IOException e) {
      System.out.println("Error");
    }
  }

  public void activate() {
    for (int i = 0; i < messageCount; i++) {
      // sadly that Java does not natively support keyword arguments.
      DriverLocationEvent location = new DriverLocationEvent(76, "6177", 3075, 3828, Type.DRIVER_LOCATION);
      Event event = new Event(76, "6211", 3075, 3823, null, Type.RIDE_REQUEST);
      producer.send(new ProducerRecord<>(StreamName.DRIVER_LOCATIONS, Integer.toString(location.getBlockId()), gson.toJson(location)));
      producer.send(new ProducerRecord<>("events", Integer.toString(event.getBlockId()), gson.toJson(event)));
    }
    producer.close();
  }

  public static void main(String[] args) throws IOException {
    SampleProducer producer = new SampleProducer(100, 1.0);
    producer.activate();
  }

}
