# delete slack messages

https://gist.github.com/firatkucuk/ee898bc919021da621689f5e47e7abac

## RUN

```
$ SLACK_CHANNEL_ID=$CHANNEL_ID SLACK_TOKEN=$TOKEN node ./delete-slack-messages.js $CHANNEL_ID
```

## TIMER

有効化

```
$ sudo systemctl daemon-reload
$ sudo systemctl enable delete-slack-maessages.timer
$ sudo systemctl start delete-slack-messages.timer
```

無効化

```
$ sudo systemctl disable delete-slack-messages.timer
$ sudo systemctl daemon-reload
```

テスト

```
$ sudo systemctl start delete-slack-messages.service
```

確認

```
$ sudo systemctl list-timers
```
