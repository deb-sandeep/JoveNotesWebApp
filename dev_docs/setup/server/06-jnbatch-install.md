# Installing JNBatch

JoveNotesBatch is a backend batch processing service for the JoveNotes 
spaced-repetition learning platform.

Purpose: Runs scheduled and on-demand jobs that compute how well a student is 
likely to retain study material, and updates card mastery states accordingly in
the JoveNotes database.

Core Features:

- Preparedness Computation — The primary job, scheduled via Quartz cron, 
  processes study chapters in parallel and computes a retention probability for
  each flashcard using a configurable retention model. Results are written back
  to the main application via HTTP API.

- Card Mastery Lifecycle — Cards progress through six levels (NS → L0 → L1 → L2 
  → L3 → MAS). A resurrection mechanism demotes mastered cards back to an
  earlier level when predicted retention drops below a threshold, ensuring
  long-term review.

- Retention Algorithm — A pluggable RetentionModel calculates the probability a 
  student will recall a card on a future date, factoring in difficulty, attempt 
  history, and time elapsed since last review.

- Manual Trigger Support — A watchdog thread polls for manual trigger requests
  in the database, allowing ad-hoc job runs outside the cron schedule.

- Dev / Production Modes — In production, chapters are processed concurrently
  via a thread pool; in dev mode, processing is sequential for easier debugging.

Tech Stack: Java 8, Quartz Scheduler, MySQL (Apache Commons Pool), Apache 
HttpClient, Gson, Log4j.

## Install code on local machine.
```
cd ~/projects/jovenotes
git clone https://github.com/deb-sandeep/JoveNotesBatch.git
```

In the local mac, this is already setup in the
`/Users/sandeep/projects/jovenotes/JoveNotesBatch` directory.

## Compile and package
```
cd /Users/sandeep/projects/jovenotes/JoveNotesBatch
mvn -q clean package
```

## Move the binary to remote server
```
cd target
scp jnbatch-1.0-bin.zip sandeep@192.168.0.123:~/projects/bin
```

## Install the binary on the remote server
SSH to remote server
```
mkdir -p projects/bin
cd projects/bin
unzip -qq jnbatch-1.0-bin.zip
ln -s jnbatch-1.0 jnbatch
```

## Configure the application on the remote server

* `db.password`
* `batch.robot.auth.key`

The `batch.robot.auth.key` can be found in the user database (auth_token)
table against the BatchRobot user.

## Install the jnbatch service

JNBatch runs as a systemd service, started at boot after `mysql.service`.
`@reboot` cron is not used — systemd provides reliable startup ordering and
the `systemctl` management interface.

### Link the service file

```
cd /etc/systemd/system
sudo ln -s /home/sandeep/projects/bin/jnbatch/jnbatch.service jnbatch.service
```

### Verify the link exists

```
ls -la /etc/systemd/system/jnbatch.service
```

### Reload, enable and start

```
sudo systemctl daemon-reload
sudo systemctl enable jnbatch.service
sudo systemctl start jnbatch.service
```

### Verify the service is running

```
sudo systemctl --all | grep jnbatch.service
sudo systemctl status jnbatch.service
```

Expected: service is `active (running)`.

