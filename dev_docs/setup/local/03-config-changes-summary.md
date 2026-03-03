# Summary of configuration changes









## New configuration files created

### 1) `/opt/homebrew/etc/httpd/conf.d/jovenotes-env.conf`

Created specifically to inject environment variables into Apache/PHP runtime

- `SetEnv DB_PASSWORD <value>` 



## Configuration file changes

### A) `/opt/homebrew/etc/httpd/httpd.conf`

* Listen / ServerName

  - `Listen 8081`

  - `ServerName localhost:8081` 

    

* Load modules

```
LoadModule rewrite_module lib/httpd/modules/mod_rewrite.so
LoadModule php_module /opt/homebrew/opt/php/lib/httpd/modules/libphp.so
```



* DocumentRoot + Directory block**

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



* PHP ↔ Apache integration block

```
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



* Include custom env file

```
Include /opt/homebrew/etc/httpd/conf.d/jovenotes-env.conf
```



### B) PHP ini file

* include_path extended
  - Append/include `/opt/homebrew/var/www/lib-ext/php` (for log4php shipped inside PHPAppFramework).

```
include_path=".:/opt/homebrew/var/www/lib-ext/php"
```



* Error logging

```
display_errors = Off
log_errors = On
error_reporting = E_ALL & ~E_DEPRECATED
```

