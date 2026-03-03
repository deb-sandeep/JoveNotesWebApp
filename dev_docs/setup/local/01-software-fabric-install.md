# JoveNotes – Local Software Fabric Setup

```
Apache (8081)
   ↳ PHP 8.5
       ↳ Memcached (igbinary serializer)
       ↳ MySQL 8.4
```



Before starting the install

```
brew doctor
brew update
```



## 1. Apache (httpd via Homebrew)

### Installation

```
brew install httpd
brew services start httpd
```



### Configuration

```
/opt/homebrew/etc/httpd/httpd.conf
```

Key changes:

```
Listen 8081
ServerName localhost:8081
LoadModule rewrite_module lib/httpd/modules/mod_rewrite.so
```

Directory block:

```
DocumentRoot "/opt/homebrew/var/www"

<Directory "/opt/homebrew/var/www">
    Options FollowSymLinks Multiviews Indexes
    MultiviewsMatch Any
    AllowOverride All
    Require all granted
    Order allow,deny
    allow from all
</Directory>
```



### Restart service

```
brew services restart httpd
```



### Validation

```
grep -E "^Listen|^ServerName|^DocumentRoot" /opt/homebrew/etc/httpd/httpd.conf
brew services list | grep httpd
lsof -iTCP -sTCP:LISTEN | grep httpd
curl -I http://localhost:8081
```

Expected:

- Service started
- Listening on 8081
- HTTP 200 OK



## 2. PHP (Homebrew)

### Installation

```
brew install php
brew services start php
```

Verify:

```
php -v
php --ini
```



### Configure error logging

Edit `php.ini`

```
display_errors = Off
log_errors = On
error_reporting = E_ALL & ~E_DEPRECATED
```



## 3. Memcached + igbinary

### Install daemon + libraries

```
brew install memcached libmemcached zlib
brew services start memcached
```

Verify daemon:

```
lsof -iTCP:11211 -sTCP:LISTEN
```



### Install igbinary

```
pecl install igbinary
```

Verify:

```
php -m | grep igbinary
```



### Install memcached extension

Important configure decisions:

| Prompt           | Choice                                 |
| ---------------- | -------------------------------------- |
| libmemcached dir | Enter                                  |
| zlib dir         | `/opt/homebrew/opt/zlib` (if required) |
| fastlz           | no                                     |
| igbinary         | yes                                    |
| msgpack          | no                                     |
| json             | no                                     |
| server protocol  | no                                     |
| sasl             | no                                     |
| sessions         | yes                                    |

If zlib error appears:

```
export CPPFLAGS="-I/opt/homebrew/opt/zlib/include"
export LDFLAGS="-L/opt/homebrew/opt/zlib/lib"
export PKG_CONFIG_PATH="/opt/homebrew/opt/zlib/lib/pkgconfig"

pecl install memcached
```

Verify:

```
php -m | egrep 'memcached|igbinary'
php --ri memcached | grep serializer
```

Expected:

```
memcached.serializer => igbinary => igbinary
```



#### Runtime Validation

```
php -r '$m=new Memcached(); $m->addServer("127.0.0.1",11211); $m->set("k","v",60); echo $m->get("k"), PHP_EOL;'
```

Expected:

```
v
```



## 4. Apache ↔ PHP Integration

Add to the end of httpd.conf: `/opt/homebrew/etc/httpd/httpd.conf`

```
LoadModule php_module /opt/homebrew/opt/php/lib/httpd/modules/libphp.so

<FilesMatch \.php$>
    SetHandler application/x-httpd-php
</FilesMatch>

<IfModule php_module>
    AddType application/x-httpd-php .php
    AddType application/x-httpd-php-source .phps

    <IfModule dir_module>
        DirectoryIndex index.html index.php
    </IfModule>
</IfModule>

DirectoryIndex index.php index.html
```

Restart:

```
brew services restart httpd
```

Validation:

```
echo '<?php echo "PHP_OK\n"; ?>' | sudo tee /opt/homebrew/var/www/_php_test.php
curl http://localhost:8081/_php_test.php
```

Expected:

```
PHP_OK
```

Cleanup:

```
rm /opt/homebrew/var/www/_php_test.php
```



## 5. MySQL 8.4

#### Status

Already installed:

```
mysql@8.4
```

Verify:

```
brew services list | grep mysql
lsof -iTCP:3306 -sTCP:LISTEN
mysql -u root -p -e "SELECT VERSION();"
```

Expected:

```
8.4.x
```



### PHP → MySQL Validation

Test page: `vi /opt/homebrew/var/www/test.php`

Make sure to replace <pw> with root database password.

```
<?php
$mysqli = new mysqli("127.0.0.1","root","<pw>",null,3306);
$res = $mysqli->query("SELECT VERSION() AS v");
$row = $res->fetch_assoc();
echo "MYSQL_OK ".$row["v"]."\n";
```

`curl http://localhost:8081/test.php`

Result:

```
MYSQL_OK 8.4.5
```

Remove the test file:

`rm /opt/homebrew/var/www/test.php`



# Final Infrastructure State

| Component         | Status          |
| ----------------- | --------------- |
| Apache            | Running on 8081 |
| PHP               | 8.5.x           |
| Memcached daemon  | Running (11211) |
| PHP memcached ext | Installed       |
| igbinary          | Enabled         |
| MySQL             | 8.4.x           |
| PHP mysqli        | Working         |

