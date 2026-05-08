# JoveNotes – Server Software Fabric Setup

```
git (over SSH)
JDK 15.0.1
Apache (80)
   ↳ PHP 8.x
       ↳ MariaDB
```

**Platform:** Raspberry Pi 5 · Debian GNU/Linux 13 (trixie)

All package installs use `apt`.

## 0. Utility software
```
sudo apt install graphviz
sudo apt install sshpass
sudo apt-get install vim
sudo apt-get install htop
sudo apt-get install sysstat
sudo apt-get install smartmontools
sudo apt-get install iotop
sudo apt-get install dstat
```

## 1. MariaDB

### Installation

```
sudo apt update
sudo apt install mariadb-server
sudo systemctl enable mariadb
sudo systemctl start mariadb
```

### Secure installation

```
sudo mariadb-secure-installation
```

Prompts and recommended answers:

| Prompt                                  | Answer               |
| --------------------------------------- | -------------------- |
| Switch to unix_socket authentication?   | No                   |
| Change the root password?               | Yes (set a password) |
| Remove anonymous users?                 | Yes                  |
| Disallow root login remotely?           | No                   |
| Remove test database?                   | Yes                  |
| Reload privilege tables?                | Yes                  |

### Allow remote access from all hosts

#### 1. Bind MariaDB to all interfaces

Edit `/etc/mysql/mariadb.conf.d/50-server.cnf` and change:

```
bind-address = 127.0.0.1
```

to:

```
bind-address = 0.0.0.0
```

#### 2. Grant root access from any host

```
sudo mariadb
```

```sql
ALTER USER 'root'@'%' IDENTIFIED BY '<password>';
CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY '<password>';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;
EXIT;
```

#### 3. Restart MariaDB

```
sudo systemctl restart mariadb
```

### Verify

```
sudo systemctl status mariadb
mysql -u root -p -e "SELECT VERSION();"
```

Expected:

```
x.x.x-MariaDB
```

Verify remote access from another machine on the network:

```
mysql -h <pi-ip> -u root -p -e "SELECT VERSION();"
```

#### 4. Update /etc/environment
This is required so that the database root password is picked up by applications
needing to connect to the database.

```
DB_PASSWORD=<database-password-for-root>
```


## 2. Git Server (git over SSH)

A lightweight git server using a dedicated `git` system user over SSH. No Gitea or other daemon needed.

### Install git

```
sudo apt install git
git config --global init.defaultBranch main
git config --global credential.helper store
```

### Create the git user

```
sudo adduser --system --shell /bin/bash --group --home /home/git git
sudo passwd git
```

### Test if git is working properly
#### Create a bare repository

```
su git
cd ~
mkdir -p ~/repos
cd repos
git init --bare test.git
```

#### Clone from a client machine

```
git clone git@<pi-ip>:/home/git/repos/test.git
```


## 3. JDK 15.0.1

### Transfer tarball to Pi

From the Mac:

```
scp jdk-15.0.1_linux-aarch64_bin.tar.gz sandeep@<pi-ip>:~/
```

### Install

```
sudo mkdir -p /usr/lib/jvm
sudo tar -xzf ~/jdk-15.0.1_linux-aarch64_bin.tar.gz -C /usr/lib/jvm
sudo ln -s /usr/lib/jvm/jdk-15.0.1 /usr/lib/jvm/jdk
```

### Configure environment

Edit `/etc/environment` and set:

```
PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/usr/lib/jvm/jdk/bin"
JAVA_HOME=/usr/lib/jvm/jdk
```

Apply and verify:

```
source /etc/environment
java -version
```

Expected:

```
java version "15.0.1" 2020-10-20
```



## 4. Apache

### Installation

```
sudo apt install apache2
sudo systemctl enable apache2
sudo systemctl start apache2
```

### Configuration

Main config:

```
/etc/apache2/apache2.conf
```

Virtual host / port config:

```
/etc/apache2/ports.conf        # Listen 80
/etc/apache2/sites-enabled/    # default site
```

Key changes to default site (`/etc/apache2/sites-enabled/000-default.conf`):

```
DocumentRoot /var/www
```

Remove the default `html` directory:

```
sudo rm -rf /var/www/html
```

Suppress FQDN warning:

```
echo "ServerName localhost" | sudo tee /etc/apache2/conf-available/servername.conf
sudo a2enconf servername
```

Enable required modules:

```
sudo a2enmod rewrite
sudo systemctl restart apache2
```

### Validation

```
sudo systemctl status apache2
curl -I http://localhost
```

Expected: `HTTP/1.1 200 OK`



## 5. PHP

### Installation

```
sudo apt install php libapache2-mod-php php-mysqli php-xml
```

`libapache2-mod-php` wires PHP into Apache as a module (equivalent of `mod_php` on local).

Verify:

```
php -v
php --ini
```

### Configure error logging

Edit the cli php.ini (path shown by `php --ini`):

```
display_errors = Off
log_errors = On
error_reporting = E_ALL & ~E_DEPRECATED
```



## 6. Apache ↔ PHP Integration

`libapache2-mod-php` activates automatically. Confirm the module is enabled:

```
apache2ctl -M | grep php
```

Expected output contains `php_module`.

Validation:

```
echo '<?php echo "PHP_OK\n"; ?>' | sudo tee /var/www/html/_php_test.php
curl http://localhost/_php_test.php
sudo rm /var/www/html/_php_test.php
```

Expected:

```
PHP_OK
```

### PHP → MariaDB Validation

```
sudo tee /var/www/html/_db_test.php >/dev/null <<'PHP'
<?php
$mysqli = new mysqli("localhost","root","<pw>",null,3306);
if($mysqli->connect_errno){ die("Connect failed: ".$mysqli->connect_error); }
$res = $mysqli->query("SELECT VERSION() AS v");
$row = $res->fetch_assoc();
echo "MARIADB_OK ".$row["v"]."\n";
PHP
curl http://localhost/_db_test.php
sudo rm /var/www/html/_db_test.php
```

Expected:

```
MARIADB_OK 10.x.x-MariaDB
```



# Final Infrastructure State

| Component    | Status              |
| ------------ | ------------------- |
| MariaDB      | Running on 3306     |
| Apache       | Running on port 80  |
| PHP          | libapache2-mod-php  |
| PHP mysqli   | Working             |
| JDK          | 15.0.1              |
| Git server   | git over SSH        |
