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
> - All symlinks created in `/opt/homebrew/var/www`
> - Optional: Local project clones and media workspace



**NOTE**: This DOES NOT remove mysql since it is used by multiple projects



## 0. Stop All Services

```
brew services stop httpd
brew services stop php
```

Verify:

```
brew services list
lsof -i :8081
```

Expected:

```
httpd     stopped
php       stopped
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

### Uninstall PHP

```
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



## 3. [Optional] Remove JoveNotes Application Code

```
rm -rf ~/projects/jovenotes/JoveNotesWebApp
rm -rf ~/projects/jovenotes/PHPAppFramework
```



## 4. [Optional] Remove Media Workspace

```
rm -rf ~/softwares/workspace/jove_notes_media
```



## 5. [Optional] Remove MathJax (if copied manually)

If inside:

```
PHPAppFramework/lib-ext/MathJax
```

Then:

```
rm -rf ~/projects/jovenotes/PHPAppFramework/lib-ext/MathJax
```

------



## 6. Remove Brew Residual Dependencies (Optional Deep Clean)

To remove unused dependencies:

```
brew autoremove
brew cleanup
```



## 7. Final Validation Checklist

| Component | Validation Command    | Expected           |
| --------- | --------------------- | ------------------ |
| Apache    | `curl localhost:8081` | Connection refused |
| PHP       | `php -v`              | command not found  |
| Services  | `brew services list`  | none running       |

