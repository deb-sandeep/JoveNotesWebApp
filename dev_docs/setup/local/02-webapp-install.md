# Installation of JoveNotes web app

## 1. Architecture Overview

| Layer      | Component                         |
| ---------- | --------------------------------- |
| Web Server | Apache (brew httpd)               |
| Runtime    | PHP                               |
| Database   | MySQL                             |
| Frontend   | PHPAppFramework + JoveNotesWebApp |
| Rendering  | MathJax 4 (locally hosted)        |

Runs entirely from:

```
/opt/homebrew
```



## 2. Directory Conventions

| Variable        | Value                                |
| --------------- | ------------------------------------ |
| BREW_HOME       | /opt/homebrew                        |
| BREW_CELLAR     | /opt/homebrew/Cellar                 |
| BREW_BIN        | /opt/homebrew/bin                    |
| JN_HOME         | ~/projects/jovenotes/JoveNotesWebApp |
| PHPAF_HOME      | ~/projects/jovenotes/PHPAppFramework |
| APACHE_DOC_ROOT | /opt/homebrew/var/www                |



## 3. Clone Application Code

```
cd ~/projects/jovenotes

git clone https://github.com/deb-sandeep/JoveNotesWebApp.git
git clone https://github.com/deb-sandeep/PHPAppFramework.git
```



## 4. Install MathJax

MathJax is not committed to Git (large footprint, gitignored via `lib-ext/.gitignore`).
Install via npm into a temp directory and copy the output into `lib-ext`:

```
mkdir -p /tmp/mathjax_install && cd /tmp/mathjax_install
npm install mathjax
cp -r node_modules/mathjax/ ~/projects/jovenotes/PHPAppFramework/lib-ext/MathJax4/
```

The key file served to browsers is `lib-ext/MathJax4/tex-svg.js`. The subdirectories
(`input/`, `output/`, `sre/`, etc.) are loaded dynamically by MathJax at runtime and
must also be present.

On the Pi server, MathJax4 is deployed automatically by `jn-deploy-webapp` (rsync),
so no separate install step is needed there.



## 4. Link Application to Document Root

```
cd /opt/homebrew/var/www

sudo ln -s $JN_HOME apps
sudo ln -s $PHPAF_HOME/.htaccess .htaccess
sudo ln -s $PHPAF_HOME/index.php index.php
sudo ln -s $PHPAF_HOME/lib-app lib-app
sudo ln -s $PHPAF_HOME/lib-ext lib-ext
sudo ln -s $PHPAF_HOME/phpinfo.php phpinfo.php
```



## 5. Softlink workspace

```
cd ~/softwares/workspace
mkdir -p jove_notes_media/_spellbee

cd /opt/homebrew/var/www/apps/jove_notes
ln -s ~/softwares/workspace/jove_notes_media workspace
```



## 6. Configure log4php

Append to `include_path` of php.ini.

The path of loaded php.ini can be found by `php --ini`

```
include_path=".:/opt/homebrew/var/www/lib-ext/php"
```



Setup `/var/log/php.log`

```
touch /var/log/php.log
```



## 7. Environment Variables

### 1) Create a dedicated env include file

```
sudo mkdir -p /opt/homebrew/etc/httpd/conf.d
sudo tee /opt/homebrew/etc/httpd/conf.d/jovenotes-env.conf >/dev/null <<'CONF'
# JoveNotes / PHPAppFramework environment
SetEnv DB_PASSWORD <password>

# DB_HOST controls which database server the app connects to.
# If not set, defaults to "localhost" (JEE database on local machine).
# Set to the Optiplex IP to point the app at the K10 historical archive.
# SetEnv DB_HOST <optiplex-ip>

# SConsole integration — base URL of the SConsole server.
# If not set, the SConsole bridge is automatically disabled (no-op).
SetEnv SCONSOLE_BASE_URL http://192.168.0.165:8080
CONF
```

### 2) Include it from `httpd.conf`

Edit:

```
code /opt/homebrew/etc/httpd/httpd.conf
```

Add near the end:

```
Include /opt/homebrew/etc/httpd/conf.d/jovenotes-env.conf
```

### 3) Restart httpd

```
brew services restart httpd
```

### 4) Validate (Apache → PHP)

```
cat <<'PHP' | sudo tee /opt/homebrew/var/www/_env_test.php >/dev/null
<?php header('Content-Type: text/plain');
echo "DB_PASSWORD=", (getenv("DB_PASSWORD") ? "***set***" : "(missing)"), "\n";
PHP
curl http://localhost:8081/_env_test.php
sudo rm /opt/homebrew/var/www/_env_test.php
```

Expected:
 `DB_PASSWORD=***set***`



## 8. Remove index.html from docroot

`rm /opt/homebrew/var/www/index.html`



## 12. Start Services

```
brew services start php
brew services start httpd
```

Verify:

```
brew services list
```



## 17. Final Verification Checklist

| Check             | Expected            |
| ----------------- | ------------------- |
| Apache running    | Port 8081           |
| PHP module loaded | phpinfo() works     |
| MySQL accessible  | root login works    |
| Media symlinked   | workspace visible   |
| DB imported       | App loads dashboard |



## 18. Access Application

```
http://localhost:8081/
```

------

