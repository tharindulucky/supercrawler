# supercrawler

A Simple crawler for tracking down travel related websites

## Note:

1. Install the dependancies
2. Rename .env.example file as .env and update the following VARS.

```
DB_NAME=db_name_here
DB_USER=db_username_here
DB_PASSWORD=db_user_password_here
DB_HOST=db_host
```

4. Run the migration
5. Run the seed
6. Sample URLs are added on the app.js file. Change them as needed.

## Running the app

```
node app.js
```

I have included a keywords file with around 800 keywords. And also I added a seeder file to insert some locations.

## What's happening under the hood ?

1.  First it loads the stored keywords from the disk to a variable and also locations are loaded from DB.

2.  Then it iterates through each URL and grabs all the
    `keywords` and `sublinks`.

3.  Then it starts a smart keyword analysis based on the keywords we have already stored.

4.  If the keywords score is matching with a reasonable score, it consider it's a **Travel related** website. And write it to the file.

5.  After it found a Travel related website, it stores the `sublinks` of the web page, in a separare array for later reference.

6.  The app follows this process for all the original URLs given by the user unless it finds 5 Travel Related websites.

7.  If it finds 5 travel related websites, then it completes the process and exits.

8.  If it can't find any travel related websites from the given URLs by the user, it consider iterating through sublinks collected in the first round. **That's where the Recursion starts.**

9.  The app then follows the same procedure on sublinks and sublinks of sublinks as well.

10. Meanwhile if it finds 5 websites it completes the process and exits.
