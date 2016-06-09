#!/usr/bin/env bash

./deploy/kafka/bin/kafka-topics.sh --zookeeper localhost:2181 --delete --topic events
./deploy/kafka/bin/kafka-topics.sh --zookeeper localhost:2181 --delete --topic match-stream
./deploy/kafka/bin/kafka-topics.sh --zookeeper localhost:2181 --delete --topic driver-locations