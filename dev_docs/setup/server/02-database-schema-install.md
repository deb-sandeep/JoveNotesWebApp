# Database Schema Import

Two databases are needed:

| Database     | Import type          | Reason                              |
| ------------ | -------------------- | ----------------------------------- |
| `user`       | With data            | User accounts and roles must exist  |
| `jove_notes` | Schema only, no data | Fresh JEE start                     |

Import order matters — `jove_notes` has foreign keys referencing `user.user`, so `user` must be imported first.

### On local Mac — export

```
mysqldump -u root -p --databases user > /tmp/user_with_data.sql
mysqldump -u root -p --no-data --databases jove_notes > /tmp/jove_notes_schema.sql
```

### Transfer to Pi

```
scp /tmp/user_with_data.sql sandeep@<pi-ip>:~/
scp /tmp/jove_notes_schema.sql sandeep@<pi-ip>:~/
```

### On Pi — import

```
mariadb -u root -p < ~/user_with_data.sql
mariadb -u root -p < ~/jove_notes_schema.sql
```

### Verify

```
mariadb -u root -p -e "SHOW DATABASES;"
mariadb -u root -p -e "USE user; SELECT COUNT(*) FROM user;"
mariadb -u root -p -e "USE jove_notes; SHOW TABLES;"
```

Expected: `user` has rows, `jove_notes` has all tables but zero data rows.



