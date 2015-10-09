pg-migrator
===========

The complete and easy to use command-line migration tool for [PostgreSQL](http://www.postgresql.org/).

Also can be called directly via function call if you runing gulp or grunt.

````javascript
    var migrate = require('pg-migrator/migrate');

    migrate({
            connectionString: connectionString,
            targetVersion: 5, // optional
            path: './migrations' // migration scripts directory
        })
        .then(function () {
            // migration completed
        })
        .catch(function (err) {
            // migration failed
        });

````

[![Build Status](https://travis-ci.org/Aphel-Cloud-Solutions/pg-migrator.png?branch=master)](https://travis-ci.org/Aphel-Cloud-Solutions/pg-migrator) [![Code Climate](https://codeclimate.com/github/Aphel-Cloud-Solutions/pg-migrator.png)](https://codeclimate.com/github/Aphel-Cloud-Solutions/pg-migrator)

## Features

<img align="right" width="256" height="256" src="http://3.bp.blogspot.com/-Tf2kfzVXgNA/UxuDUUo65qI/AAAAAAAAUhY/-3c6u9xTWGI/s1600/pg-migrator.png">

  * Auto migration from scratch to up to date
  * Step by step forward migration
  * Step by step backward migration
  * Migrate to a specific version forward or backward
  * Subfolder deep search for migration scripts
  * All or nothing (Transactional migration)
  * Can use on any system that can connect to target PostgreSQL database (No remote session required)


## Installation

Install this globally and you'll have access to the pg-migrator command anywhere on your system.

    $ npm install -g pg-migrator

## Quick Start

The quickest way to migrate the target database with pg-migrator is type "pg-migrator" and a valid connection string as shown below.

    $ pg-migrator postgres://username:password@localhost/testdb

This command will migrate the "testdb" database to the latest version according to migration scripts.

You can also chose the target version with a second parameter as shown below.

    $ pg-migrator postgres://username:password@localhost/testdb 15

This command will migrate the "testdb" database to version 15 (forward or backward according to current database version). Other avaliable version options are shown below.

  * +1 : One step forward migration
  * -1 : One step backward migration

Samples for one step migration;

    $ pg-migrator postgres://username:password@localhost/testdb +1
    $ pg-migrator postgres://username:password@localhost/testdb -1

## Migration Scripts

pg-migrator uses migration scripts in current execution folder or subfolders. All migration script files must have an extension with ".sql" (case insensitive) and "x-y.sql" format that x and y must be valid numbers. Both numbers also must be sequential. All other files will be ignored.

Migration scripts can contain any valid sql statements like create/alter table and also insert/update data etc.

You can categorize your scripts with folders as you wish. pg-migrator search all subfolders and put them in order according to x-y numbers in file names, independent of folder structure.

Sample migration script file names;
```
25-26.sql : Migration script from version 25 to version 26 for forward migration
26-25.sql : Migration script from version 26 to version 25 for backward migration
```
Let's say, our database is in version 25 at the moment. If you request one step forward migration, pg-migrator searches folders for a file with "25-26.sql" name and if can't found, displays an error message.

Likewise, if you request one step backward migration, at this time, pg-migrator searches folders for a file with "25-24.sql" name and if can't found, displays an error message.

So, your migration scripts must be started from "1-2.sql" and go on like "2-3.sql", "3-4.sql" etc.

For backward migration, you must also have files like "2-1.sql" and go on like "3-2.sql", "4-3.sql" etc.

## Step by Step Example

Let's go step by step from the scratch. You can find all migration scripts we will use during this example in the ["examples"](https://github.com/Aphel-Cloud-Solutions/pg-migrator/tree/master/examples/) folder on Github.

As a first step, we need a database. Let's create a new one with "testdb" name. At the moment, there is no table in it.

<img src="http://4.bp.blogspot.com/-Z8FWbyIugPc/UxuDiKP1XsI/AAAAAAAAUhg/gTEX0l8QGSg/s1600/Selection_001.png">

As a beginning to development, we need two tables, "user" and "user_login_history". Let's write some script to create them but don't execute it yet. We'll use pg-migrator for execution.

```
/*** Add user and user_login_history tables and insert some data ***/

CREATE TABLE "user"
(
   id serial,
   username character(20)  NOT NULL,
   name_surname character(50) NOT NULL,
   CONSTRAINT pk_user PRIMARY KEY (id),
   CONSTRAINT uk_user UNIQUE (username)
)
WITH (
  OIDS = FALSE
);

CREATE TABLE "user_login_history"
(
   id serial,
   user_id integer NOT NULL,
   login_date date NOT NULL,
   CONSTRAINT pk_user_login_history PRIMARY KEY (id),
   CONSTRAINT fk_user_login_history FOREIGN KEY (user_id) REFERENCES "user" (id) ON UPDATE NO ACTION ON DELETE NO ACTION
)
WITH (
  OIDS = FALSE
);

INSERT INTO "user"(username, name_surname)
    VALUES ('user1', 'User 1');

INSERT INTO "user"(username, name_surname)
    VALUES ('user2', 'User 2');

INSERT INTO user_login_history(user_id, login_date)
    VALUES (1, '2014-01-01');

INSERT INTO user_login_history(user_id, login_date)
    VALUES (1, '2014-01-02');

INSERT INTO user_login_history(user_id, login_date)
    VALUES (2, '2014-02-01');

INSERT INTO user_login_history(user_id, login_date)
    VALUES (2, '2014-02-02');

```

With this script, we are creating two tables and insert some data to them. Let's save this script as "**1-2.sql**". When this script executed, our database will be migrated from version 1 to version 2 (Forward migration).

Ok, that was the first one and we need an opposite script in case of roll back this operation. This script can be written like below.

```
/*** Remove user and user_login_history tables ***/

DROP TABLE "user_login_history";

DROP TABLE "user";

```

That was quite easy, just deleted all the tables. We'll save this script as "**2-1.sql**". When this script executed, our database will be migrated from version 2 to version 1 (Backward migration).

Ok, let's continue to development. At this time, we need to add a new column to user table with "is_admin" name so write the script below and save it as "**2-3.sql**".

```
/*** Add is_admin column to user table ***/

ALTER TABLE "user"
  ADD COLUMN is_admin bit;

UPDATE "user" SET is_admin = '0';

ALTER TABLE "user"
   ALTER COLUMN is_admin SET NOT NULL;
```

Why don't we just add a new column with NOT NULL keyword directly? Because between two versions, some data may be inserted into the table so we can't create a new column with NOT NULL property. So, we've created a new column with NULL property, update all posible data to a default value then alter the column with NOT NULL property (Of course, you can define a default value for the new column but this property will stay on the column. This way is much more reasonable for production).

We need a roll back script again. Let's save the script below as "**3-2.sql**". This will just drop the newly inserted column.

```
/*** Remove is_admin column from user table ***/

ALTER TABLE "user" DROP COLUMN is_admin;

```

Continue to development. We need a new table with "company" name and connect it with existing "user" table. So write the script below and save it as "**3-4.sql**".

```
/*** Add company table, insert some data and connect with user table ***/

CREATE TABLE "company"
(
   id serial,
   company_name character(20) NOT NULL,
   CONSTRAINT pk_company PRIMARY KEY (id),
   CONSTRAINT uk_company UNIQUE (company_name)
)
WITH (
  OIDS = FALSE
);

INSERT INTO "company"(company_name)
    VALUES ('Company 1');

ALTER TABLE "user"
  ADD COLUMN company_id integer;

UPDATE "user" SET company_id = 1;

ALTER TABLE "user"
   ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE "user"
  ADD CONSTRAINT fk_user FOREIGN KEY (company_id) REFERENCES company (id) ON UPDATE NO ACTION ON DELETE NO ACTION;

```
Not confused yet? Ok, I'll do my best :)

We have just created a new table, inserted some data in it. Added a new column to the "user" table and connected it to the new table with a foreign key.

Let's write a roll back script and save as "**4-3.sql**". We have just deleted foreign key, newly added column and the table.

```
/*** Remove company table and disconnect user table ***/

ALTER TABLE "user" DROP CONSTRAINT fk_user;

ALTER TABLE "user" DROP COLUMN company_id;

DROP TABLE "company";

```
Before start the show, we will create a couple of script. This time for performance tuning. Let's create a few index with the following script (**4-5.sql**).

```
/*** Create indexes for user and company tables ***/

CREATE INDEX ix_user
   ON "user" (username ASC NULLS LAST);

CREATE INDEX ix_company
   ON "company" (company_name ASC NULLS LAST);

```

And the roll back script (**5-4.sql**).

```
/*** Remove indexes from user and company tables ***/

DROP INDEX ix_user;

DROP INDEX ix_company;

```

That all. We can start to use pg-migrator now. Because pg-migrator can seek and execute migration script in any subfolders, we are free to organize script files as we wish, so I will categorize scripts with folders like below.

<img src="http://2.bp.blogspot.com/-IKNe2qrQLGI/UxuDktqwTZI/AAAAAAAAUho/rZ4PbbsTagk/s1600/Selection_002.png">

I have created some script files in "ignored-files" folder. All files in this folder will be ignored by pg-migrator because of "x-y.sql" naming standard.

Let's open a terminal, go into the scripts' root folder and type the following command (I have a db user with "test" username and "test" password).

    $ pg-migrator postgres://test:test@localhost/testdb

<img src="http://2.bp.blogspot.com/-pRNtmsL6IjA/UxuDoYm3lrI/AAAAAAAAUhw/wJgssYZlD7g/s1600/Selection_003.png">

What's happend? All scripts are executed by pg-migrator with "1-2.sql" -> "2-3.sql" -> "3-4.sql" -> "4-5.sql" order. At the moment, db should seem like below.

<img src="http://1.bp.blogspot.com/-h3HujYMJ__w/UxuDrOnkc0I/AAAAAAAAUh4/-1Wf85MCl64/s1600/Selection_004.png">

All tables and indexes have been created and data inserted. Did you realized a new table with "**version**" name?

This table belongs to pg-migrator and used to track current db version. There are some other migration tools that track the current db version in some files but this is not reasonable actually. Because these files can easy be deleted or go out of sync with DB. What about if you have multiple servers? I'm strongly recommend track the current version in db because it is the **only secure place** against out of sync.

Ok, db on version 5 at the moment. But we decided to remove indexes so roll one version back. We can use following command for this task.

    $ pg-migrator postgres://test:test@localhost/testdb -1

<img src="http://2.bp.blogspot.com/-Q6jMQDdXt6Q/UxuDtzQBqsI/AAAAAAAAUiA/fbwOfTT5SDM/s1600/Selection_005.png">

pg-migrator finds and executes "5-4.sql" script and roll back db to version 4.

<img src="http://1.bp.blogspot.com/-iM5Ie74yH2E/UxuD8CZPmrI/AAAAAAAAUiI/yqhwDlAeIRg/s1600/Selection_006.png">

At this time, we decided to move db to version 2.  We can use following command for this task.

    $ pg-migrator postgres://test:test@localhost/testdb 2

<img src="http://4.bp.blogspot.com/-fsTHTBPldp8/UxuD_cr9mpI/AAAAAAAAUiQ/xLzJdLsGUsM/s1600/Selection_007.png">

pg-migrator finds and executes "4-3.sql" and then "3-2.sql" scripts and roll back db to version 2.

<img src="http://3.bp.blogspot.com/-fVAQAe44dis/UxuECcqdRoI/AAAAAAAAUiY/wZX6D5ioP4k/s1600/Selection_008.png">

Not bad ha, what's next? Let's go to one step forward with the following command.

    $ pg-migrator postgres://test:test@localhost/testdb +1

<img src="http://2.bp.blogspot.com/-TE5arKQF_SM/UxuEGNSDGmI/AAAAAAAAUig/VtdSP4m1gUQ/s1600/Selection_009.png">

pg-migrator finds and executes "2-3.sql" and migrate db to version 3.

<img src="http://4.bp.blogspot.com/-ul_B3WaCGXc/UxuEJKm0aLI/AAAAAAAAUio/yL8ojBtThUc/s1600/Selection_010.png">

Ok, that's enough. let's return to the latest version with the following command.

    $ pg-migrator postgres://test:test@localhost/testdb

<img src="http://4.bp.blogspot.com/-tqD_3x5hH18/UxuEPzfNlaI/AAAAAAAAUiw/0MsT9u_JH4g/s1600/Selection_011.png">

pg-migrator finds and executes "3-4.sql" and then "4-5.sql" scripts and migrates db to version 5.

<img src="http://3.bp.blogspot.com/-Xxl41LWmAPo/UxuETU8A4OI/AAAAAAAAUi4/cf6151-lf2w/s1600/Selection_012.png">


Fire at will! You can take a stroll between db versions with pg-migrator.

## Common Pitfalls
* pg-migrator must be executed in the root of migration scripts folder. It will search all directory content and all subfolders content recursively.
* Migration script files must be in "x-y.sql" format that x and y must be valid numbers. Both numbers also must be sequential. All other files will be ignored.
* All script files also must be sequential like "1-2.sql" and "2-3.sql" .There must not be hole between files (Like "1-2.sql" and "3-4.sql").
* All migration scripts are executed in the same transaction scope and totally roll back in case of fail so you shouldn't put any transaction statements in your scripts.
* You should use a db user with sufficient permissions according to your script content.

## Running Tests

To run the test suite, first invoke the following command within the repo, installing the development dependencies:

    $ npm install

Then run the tests:

    $ make test


## License

The MIT License (MIT)

Copyright (c) 2014 Aphel Cloud Solutions

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.