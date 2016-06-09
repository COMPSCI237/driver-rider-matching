package edu.zhangfan.cs237.producer;

import edu.zhangfan.cs237.common.Event;
import edu.zhangfan.cs237.common.Status;
import edu.zhangfan.cs237.common.Type;

public class TimestampedEvent extends Event {
  private long createdTimeStamp;

  public long getCreatedTimeStamp() {
    return createdTimeStamp;
  }

  public void setCreatedTimeStamp(long createdTimeStamp) {
    this.createdTimeStamp = createdTimeStamp;
  }

  public TimestampedEvent(Integer blockId, String identifier, double longitude, double latitude, Status status, Type type, long createdTimeStamp) {
    super(blockId, identifier, longitude, latitude, status, type);
    this.createdTimeStamp = createdTimeStamp;
  }
}
