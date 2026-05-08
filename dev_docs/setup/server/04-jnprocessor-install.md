# JNProcessor first time install

JNProcessor is the java application which processes the JoveNotes source files.
This is triggered by calling the jnprocessor script on the server via SSH.

## Install code on local machine.
```
git clone https://github.com/deb-sandeep/JoveNotesProcessor.git
```

In the local mac, this is already setup in the 
`/Users/sandeep/projects/jovenotes/JoveNotesProcessor` directory.

## Compile and package
```
cd /Users/sandeep/projects/jovenotes/JoveNotesProcessor
mvn -q clean package
```

## Move the binary to remote server
```
cd target
scp jnprocessor-3.0-bin.zip sandeep@192.168.0.123:~/
```

## Install the binary on the remote server
SSH to remote server
```
cd ~
mkdir -p projects/bin
mkdir -p projects/workspace/jove_notes_workspace
mkdir -p projects/workspace/jove_notes_media
cd projects/bin
mv ~/jnprocessor-3.0-bin.zip .
unzip -qq jnprocessor-3.0-bin.zip
ln -s jnprocessor-3.0 jnprocessor
```

## Configure the application on the remote server
Configure the `source.dir` property from where the JNProcessor application will 
pick up the compilable source files. For example:

```
# The fully qualified path of the directory where the JoveNotes sources are
# stored.
# Mandatory - If not specified, program will exit
source.dir=\
/home/sandeep/projects/workspace/JoveNotes-JEE:\
/home/sandeep/projects/workspace/<some-other-directory>
```

Configure the `db.password` config. Note that DB_PASSWORD environment variable
will not be picked up by this application.

Set the `wordnik.api.key` config to the right value.

## Set up the invocation script 
Create and edit `/usr/local/bin/jnp` file. Set the executable flag for the file.

```
#!/bin/bash

echo "Starting JoveNotes processor"

echo "Pulling JoveNotes-JEE source"
cd /home/sandeep/projects/workspace/JoveNotes-JEE
git pull


echo "Launching JNProcessor"
cd /home/sandeep/projects/bin/jnprocessor
./jnprocessor --runMode=production "$@"
```

## Validate
`jnp` should run without any exception.

## Delete the binary on the remote server
```
rm ~/projects/bin/jnprocessor-3.0-bin.zip
```