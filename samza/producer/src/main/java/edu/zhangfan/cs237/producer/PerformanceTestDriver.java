package edu.zhangfan.cs237.producer;

import com.google.gson.Gson;
import edu.zhangfan.cs237.common.MatchEvent;
import edu.zhangfan.cs237.common.StreamName;
import org.apache.kafka.clients.consumer.*;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.common.TopicPartition;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.Collections;
import java.util.Map;
import java.util.Properties;

public class PerformanceTestDriver {
  private static final Gson gson = new Gson();

  public static void main(String[] args) throws IOException {
    Consumer<String, String> consumer = createConsumer();
    for (TopicPartition topicPartition : consumer.assignment()) {
      System.out.printf("Partition %d\n", topicPartition.partition());
    }
    int consumedCounter = 0;
    long messageNum = 10000;
//    ITestProducer producer = new TestMatchEventTestProducer(consumedExpect);
    SampleTestProducer producer = new SampleTestProducer(messageNum, .8);
    Long testTimestamp = System.currentTimeMillis();
    PrintWriter latencyWriter = new PrintWriter(String.format("latency-%d.csv", testTimestamp));
    latencyWriter.println("riderID, request, matched");
    PrintWriter throughputWriter = new PrintWriter(String.format("throughput-%d.csv", testTimestamp));
    throughputWriter.println("timestamp, matched");

    producer.initiate();
    System.out.printf("Before producer activated: %d\n", System.currentTimeMillis());
    long expect = producer.activate();
    long activatedTimeStamp = System.currentTimeMillis();
    System.out.printf("After producer activated: %d\n", activatedTimeStamp);

    Map<String, Long> timestamp = producer.getRideRequestTimestamp();
    System.out.printf("Expect %d matches\n", expect);
    while (consumedCounter < expect) {
      ConsumerRecords<String, String> records = consumer.poll(500);
      for (ConsumerRecord<String, String> record : records) {
        MatchEvent event = gson.fromJson(record.value(), MatchEvent.class);
        String riderID = event.getRiderId();
        latencyWriter.printf("%s, %s, %d \n", riderID, timestamp.get(riderID), System.currentTimeMillis());
      }
      consumedCounter += records.count();
      System.out.printf("Matched %d\n", consumedCounter);
      throughputWriter.printf("%d, %d\n", System.currentTimeMillis(), consumedCounter);
    }
    long consumedTimeStamp = System.currentTimeMillis();
    System.out.printf("After consumer consumed all messages: %d\n", consumedTimeStamp);
    System.out.printf("Total time %d (ms)\n", consumedTimeStamp - activatedTimeStamp);
    consumer.close();
    latencyWriter.close();
    throughputWriter.close();
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
    consumer.seekToEnd();
    consumer.poll(1);
    return consumer;
  }
}

