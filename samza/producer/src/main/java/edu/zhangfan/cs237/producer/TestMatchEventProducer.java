package edu.zhangfan.cs237.producer;

import com.google.common.io.Resources;
import com.google.gson.Gson;
import edu.zhangfan.cs237.common.MatchEvent;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.Producer;
import org.apache.kafka.clients.producer.ProducerRecord;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

public class TestMatchEventProducer implements IProducer {

  private static final Gson gson = new Gson();

  private Producer<String, String> producer;
  private int messageCount;

  public TestMatchEventProducer(int messageCount) {
    try (InputStream in = Resources.getResource("producer.properties").openStream()) {
      Properties properties = new Properties();
      properties.load(in);
      this.producer = new KafkaProducer<>(properties);
    } catch (IOException e) {
      System.out.print("error");
    }
    this.messageCount = messageCount;
  }

  public void activate() {
    for (int i = 0; i < messageCount; i++) {
      // produce one match for every block.
      MatchEvent match = new MatchEvent(Integer.toString(i), Integer.toString(i));
      producer.send(new ProducerRecord<>("match-stream", Integer.toString(i), gson.toJson(match)));
    }
    producer.close();
  }

  public static void main(String[] args) throws IOException {
    TestMatchEventProducer producer = new TestMatchEventProducer(10000);
    producer.activate();
  }

}
