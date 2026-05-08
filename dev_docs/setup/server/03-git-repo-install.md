# Steps to create a new syllabus repository

## Create a bare repository on the server
Create a bare repository with the name of the syllabus.

```
su git
cd ~/repos
mkdir JoveNotes-JEE.git
cd JoveNotes-JEE.git/
git init --bare
git config --global --add safe.directory /home/git/repos/JoveNotes-JEE.git
```

## Check in the local repository
On the local machine, navigate to the directory which holds the syllabus folder.
The structure is as follows:

```
JoveNotes-JEE/
    JEE/
        Physics/
            102 - Units and Measurements/
                doc/
                img/
                102.1 - Units and Measurements.jn
            ...
        Chemistry/
            ...
        Maths/
            ... 
```

Use the following commands:
```
cd JoveNotes-JEE
git init
git add .
git commit -m "Initial commit"
git remote add origin git@192.168.0.123:/home/git/repos/JoveNotes-JEE.git
git push -u origin main
```

## Clone the syllabus directory on remote workspace
If `/home/sandeep/projects/workspace` directory does not exist, create it

```
su sandeep
cd ~/projects/workspace
git clone /home/git/repos/JoveNotes-JEE.git
```
