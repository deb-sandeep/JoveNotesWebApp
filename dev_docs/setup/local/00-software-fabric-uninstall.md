# JoveNotes - Sofware Fabric clean uninstall

This is written specifically for **Mac (Apple Silicon, Homebrew under `/opt/homebrew`)** and assumes following variables:

```
BREW_HOME   = /opt/homebrew
BREW_CELLAR = $BREW_HOME/Cellar
BREW_BIN    = $BREW_HOME/bin
JN_HOME     = ~/projects/jovenotes/JoveNotesWebApp
PHPAF_HOME  = ~/projects/jovenotes/PHPAppFramework
```



> ⚠️ This removes:
>
> - Apache (brew httpd)
> - PHP + PECL extensions
> - Memcached
> - All symlinks created in `/opt/homebrew/var/www`
> - Optional: Local project clones and media workspace



**NOTE**: This DOES NOT remove mysql since it is used by multiple projects



## 0. Stop All Services

```
brew services stop httpd
brew services stop php
brew services stop memcached
```

Verify:

```
brew services list
lsof -i :8081
lsof -i :11211
```

Expected:

```
httpd     stopped
php       stopped
memcached stopped
```

------



## 1. Remove Apache (httpd)

### Uninstall

```
brew uninstall httpd
```

### Remove config & logs

```
rm -rf /opt/homebrew/etc/httpd
rm -rf /opt/homebrew/var/log/httpd
rm -rf /opt/homebrew/var/www
```

### Remove LaunchAgent (if exists)

```
rm ~/Library/LaunchAgents/homebrew.mxcl.httpd.plist
```

### Verify

```
which httpd
lsof -iTCP -sTCP:LISTEN | grep httpd
```

Should return nothing.



## 2. Remove PHP + Extensions

### Uninstall PECL libraries and PHP

```
pecl uninstall igbinary
pecl uninstall memcached
brew uninstall php
```

### Remove PECL directory

```
rm -rf /opt/homebrew/lib/php/pecl
```

### Remove PHP config

```
rm -rf /opt/homebrew/etc/php
rm -rf /opt/homebrew/var/log/php*
```

### Remove LaunchAgent

```
rm ~/Library/LaunchAgents/homebrew.mxcl.php.plist
```

### Verify

```
php -v
```

Should return: command not found.



## 3. Remove Memcached

### Uninstall

```
brew uninstall memcached
brew uninstall libmemcached
```

### Remove LaunchAgent

```
rm ~/Library/LaunchAgents/homebrew.mxcl.memcached.plist
```

### Verify

```
lsof -iTCP:11211 -sTCP:LISTEN
```

Should return nothing.



## 4. [Optional] Remove JoveNotes Application Code

```
rm -rf ~/projects/jovenotes/JoveNotesWebApp
rm -rf ~/projects/jovenotes/PHPAppFramework
```



## 5. [Optional] Remove Media Workspace

```
rm -rf ~/softwares/workspace/jove_notes_media
```



## 6. [Optional] Remove MathJax (if copied manually)

If inside:

```
PHPAppFramework/lib-ext/MathJax
```

Then:

```
rm -rf ~/projects/jovenotes/PHPAppFramework/lib-ext/MathJax
```

------



## 7. Remove Brew Residual Dependencies (Optional Deep Clean)

To remove unused dependencies:

```
brew autoremove
brew cleanup
```



## 8. Final Validation Checklist

| Component | Validation Command    | Expected           |
| --------- | --------------------- | ------------------ |
| Apache    | `curl localhost:8081` | Connection refused |
| PHP       | `php -v`              | command not found  |
| Memcached | `lsof -i :11211`      | empty              |
| Services  | `brew services list`  | none running       |

