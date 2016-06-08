package edu.zhangfan.cs237.producer;

import edu.zhangfan.cs237.common.StreamName;
import org.apache.kafka.clients.consumer.*;
import org.apache.kafka.clients.consumer.KafkaConsumer;

import java.util.Collections;
import java.util.Properties;

public class PerformanceTestDriver {

  public static void main(String[] args) {
    Consumer<String, String> consumer = createConsumer();
    int consumedCounter = 0;
    int consumedExpect = 10000;
    IProducer producer = new TestMatchEventProducer(consumedExpect);
    System.out.printf("Before producer activated: %d\n", System.currentTimeMillis());
    producer.activate();
    System.out.printf("After producer activated: %d\n", System.currentTimeMillis());

    while (consumedCounter < consumedExpect) {
      ConsumerRecords<String, String> records = consumer.poll(100);
      consumedCounter += records.count();
    }
    System.out.printf("After consumer consumed all messages: %d\n", System.currentTimeMillis());
  }

  public static Consumer<String, String> createConsumer() {
    Properties props = new Properties();
    props.put("bootstrap.servers", "localhost:9092");
    props.put("group.id", "performance-test");
    props.put("enable.auto.commit", "true");
    props.put("auto.commit.interval.ms", "1000");
    props.put("session.timeout.ms", "30000");
    props.put("key.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
    props.put("value.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
    KafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);
    consumer.subscribe(Collections.singletonList(StreamName.MATCH));

    return consumer;
  }
}

