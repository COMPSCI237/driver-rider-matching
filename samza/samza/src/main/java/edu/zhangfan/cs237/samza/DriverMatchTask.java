package edu.zhangfan.cs237.samza;

import com.google.gson.Gson;
import edu.zhangfan.cs237.common.*;
import org.apache.samza.config.Config;
import org.apache.samza.storage.kv.Entry;
import org.apache.samza.storage.kv.KeyValueIterator;
import org.apache.samza.storage.kv.KeyValueStore;
import org.apache.samza.system.IncomingMessageEnvelope;
import org.apache.samza.system.OutgoingMessageEnvelope;
import org.apache.samza.task.*;

class Location {
  private int longitude;
  private int latitude;

  Location(int longitude, int latitude) {
    this.longitude = longitude;
    this.latitude = latitude;
  }

  public int getLongitude() {
    return longitude;
  }

  public void setLongitude(int longitude) {
    this.longitude = longitude;
  }

  public int getLatitude() {
    return latitude;
  }

  public void setLatitude(int latitude) {
    this.latitude = latitude;
  }

  public double distanceTo(Location loc) {
    return Math.sqrt(Math.pow((this.latitude - loc.latitude), 2) + Math.pow((this.longitude - loc.latitude), 2));
  }

  @Override
  public String toString() {
    Gson gson = new Gson();
    return gson.toJson(this);
  }
}

public class DriverMatchTask implements StreamTask, InitableTask {
  private KeyValueStore<String, String> freeDriverLocationStore;
  //  private KeyValueStore<Integer, String> driverListStore;
  private Gson gson;

  @Override
  public void init(Config config, TaskContext context) throws Exception {
    this.freeDriverLocationStore = (KeyValueStore<String, String>) context.getStore("location");
    this.gson = new Gson();
  }

  @Override
  public void process(IncomingMessageEnvelope envelope, MessageCollector messageCollector, TaskCoordinator taskCoordinator) throws Exception {
    // partition key: blockId

    String topic = envelope.getSystemStreamPartition().getStream();
    String message = (String) envelope.getMessage();
    System.out.println(topic);
    switch (topic) {
      case StreamName.DRIVER_LOCATIONS:
        DriverLocationEvent driverLocationEvent = gson.fromJson(message, DriverLocationEvent.class);
        freeDriverLocationStore.put(driverLocationEvent.getDriverId(),
            new Location(driverLocationEvent.getLongitude(), driverLocationEvent.getLatitude()).toString());
        break;
      case StreamName.EVENTS:
        Event event = gson.fromJson(message, Event.class);
        switch (event.getType()) {
          case RIDE_REQUEST:
            double minDistance = Double.MAX_VALUE;
            String closetDriverId = null;
            Location riderLocation = new Location(event.getLongitude(), event.getLatitude());
            for (KeyValueIterator<String, String> it = freeDriverLocationStore.all(); it.hasNext();  ) {
              Entry<String, String> entry = it.next();
              Location loc = gson.fromJson(entry.getValue(), Location.class);
              String driverId = entry.getKey();
              if (loc.distanceTo(riderLocation) < minDistance) {
                closetDriverId = driverId;
              }
            }
            if (closetDriverId != null) {
              System.out.println("Match succeed");
              MatchEvent matchEvent = new MatchEvent(event.getIdentifier(), closetDriverId);
              // TODO output stream ID.
              messageCollector.send(
                  new OutgoingMessageEnvelope(DriverMatchConfig.MATCH_STREAM, gson.toJson(matchEvent)));
            } else {
              throw new Exception("No match found");
            }
            break;
          case LEAVING_BLOCK:
            // delete driver from this block
            switch (event.getStatus()) {
              case AVAILABLE:
                freeDriverLocationStore.delete(event.getIdentifier());
                break;
              case UNAVAILABLE:
                // TODO handle busy driver location
            }
            break;
          case RIDE_COMPLETE:
            freeDriverLocationStore.put(event.getIdentifier(),
                new Location(event.getLongitude(), event.getLatitude()).toString());
            break;
          case ENTERING_BLOCK:
            switch (event.getStatus()) {
              case AVAILABLE:
                freeDriverLocationStore.put(event.getIdentifier(),
                    new Location(event.getLongitude(), event.getLatitude()).toString());
                break;
              case UNAVAILABLE:
                // TODO handle busy driver location
            }
            break;
          default:
        }
        break;
    }
  }

}
