# Installing web application

## 1. Install the source folders

```
mkdir -p ~/projects/source
cd ~/projects/source
git clone https://github.com/deb-sandeep/JoveNotesWebApp.git
git clone https://github.com/deb-sandeep/PHPAppFramework.git
```



## 2. Deploy MathJax

MathJax is not committed to Git (large footprint, gitignored via `lib-ext/.gitignore`).
On the server it is deployed by running `jn-deploy-webapp` from the local Mac, which
rsyncs the entire `PHPAppFramework/lib-ext/MathJax4/` directory to the Pi.

If setting up a fresh server before the first deploy, run `jn-deploy-webapp` from the
local Mac after completing section 1 above — MathJax4 will be included automatically.

There is no manual install step required on the server itself.



## 3. Create symbolic links in `/var/www`

```
mkdir -p /home/sandeep/projects/workspace/downloads
cd /var/www
sudo ln -s -T /home/sandeep/projects/workspace/downloads downloads
sudo ln -s -T /home/sandeep/projects/source/JoveNotesWebApp/ apps
sudo ln -s -T /home/sandeep/projects/source/PHPAppFramework/.htaccess .htaccess
sudo ln -s -T /home/sandeep/projects/source/PHPAppFramework/index.php index.php
sudo ln -s -T /home/sandeep/projects/source/PHPAppFramework/lib-app/ lib-app
sudo ln -s -T /home/sandeep/projects/source/PHPAppFramework/lib-ext/ lib-ext
sudo ln -s -T /home/sandeep/projects/source/PHPAppFramework/phpinfo.php phpinfo.php
sudo ln -s -T /home/sandeep/projects/workspace/jove_notes_media/ /var/www/apps/jove_notes/workspace
```



## 4. Configure Apache

### Replace the default virtual host

Replace the contents of `/etc/apache2/sites-enabled/000-default.conf` with:

```
<VirtualHost *:80>
    ServerAdmin deb.sandeep@gmail.com

    DocumentRoot /var/www
    <Directory />
        Options FollowSymLinks
        AllowOverride None
    </Directory>
    <Directory /var/www/>
        Options Indexes FollowSymLinks MultiViews
        AllowOverride all
        Order allow,deny
        allow from all
    </Directory>

    ScriptAlias /cgi-bin/ /usr/lib/cgi-bin/
    <Directory "/usr/lib/cgi-bin">
        AllowOverride None
        Options +ExecCGI -MultiViews +SymLinksIfOwnerMatch
        Order allow,deny
        Allow from all
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/error.log
    LogLevel info
    CustomLog ${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
```

### Fix AllowOverride in global Apache config

`/etc/apache2/apache2.conf` has a global `<Directory /var/www/>` block with
`AllowOverride None` which prevents `.htaccess` from being read. Change it to `All`:

```
sudo vi /etc/apache2/apache2.conf
```

Find:

```
<Directory /var/www/>
    Options Indexes FollowSymLinks
    AllowOverride None
    Require all granted
</Directory>
```

Change `AllowOverride None` to `AllowOverride All`.

### Grant www-data access to home directory

Apache runs as `www-data`. Since the symlinks in `/var/www` point into
`/home/sandeep/`, `www-data` must be able to traverse the home directory.

```
sudo usermod -aG sandeep www-data
chmod g+x /home/sandeep
```

### Export environment variables for Apache

Append to `/etc/apache2/envvars`:

```
export DB_PASSWORD=<password>

# SConsole integration — base URL of the SConsole server.
# If not set, the SConsole bridge is automatically disabled (no-op).
export SCONSOLE_BASE_URL=http://192.168.0.161:8080
```

### Restart Apache

```
sudo systemctl restart apache2
```



## 5. Configure PHP

### log4php include path

Find the apache2 php.ini path:

```
sudo vi /etc/php/<version>/apache2/php.ini
```

Find the `include_path` directive and append `:/var/www/lib-ext/php`:

```
include_path = ".:/usr/share/php:/var/www/lib-ext/php"
```

### Create PHP log file

Apache runs as `www-data` and needs write access to the log file:

```
sudo touch /var/log/php.log
sudo chown www-data:www-data /var/log/php.log
```

### Restart Apache

```
sudo systemctl restart apache2
```
