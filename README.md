# Hearthook

A simple heartbeat service to notify if your endpoint stops sending its required curl request.

Notifications are sent to a pushover user/device. Requires a [Pushover Account](https://pushover.net)

## Configuration

| Secrets           | Description                                       |
|-------------------|---------------------------------------------------|
| HEARTHOOK_SECRET  | The secret that should be sent with each request. |
| PUSHOVER_TOKEN    | Your Pushover Token                               |
| PUSHOVER_USER_KEY | Your Pushover User                                |

| Vars                  | Default | Description                                             |
|-----------------------|---------|---------------------------------------------------------|
| HEARTHOOK_GRACEPERIOD | 1 min   | How long to wait just in case (in minutes)              |
| HEARTHOOK_INTERVAL    | 10 min   | The interval your service uses to check in (in minutes) |
| PUSHOVER_DEVICE       | ""      | Send notifications to a specific device or all (empty)  |
| PUSHOVER_PRIORITY     | ""      | -2 ~ 2 allowed.                                         |
| PUSHOVER_TTL          | ""      | How long this notification should survive (in seconds)  |
