# Contributing

Only use this guide if you are a developer, and want to contribute. Otherwise,
please install the extension from the
[Chrome Extension Store](https://chrome.google.com/webstore/detail/csv-for-trello/nlclhmcmfjpmmngpopdgapiccfddfagi).

## Cloning the repository

Clone the repository from GitHub:

```bash
git clone https://github.com/zachch/csv-trello.git
cd csv-trello
```

## Installing the extension from local files

1. Open Chrome.
2. Go to [chrome://extensions](chrome://extensions).
3. Make sure to **Remove** any existing "CSV Export for Trello" extension you
   may have.
4. Enable **Developer mode**.
5. Click the **Load unpacked** button.
6. Select the `csv-trello` folder where you cloned the repo.
7. Click the **Errors** button, and check that the only error is _"Manifest
   version 2 is deprecated, and support will be removed in 2023."_ Go ahead and
   **Clear** that error, unless it's already 2023 when you read this :)

## Developing

Chrome should pick up any changes you make to the files in the `csv-trello`
folder. You may need to reload the Trello page you are on, to make sure.

Please use the linting and formatting tool, to make sure your code is clean and
consistently formatted. This will also run any future tests we may have:

```bash
# install dependencies
npm install

# check for errors, lint and format files
npm test
```

## Pull Request

If you wish to contribute any changes to the extension, please submit a pull
request on Github.

We encourage you to make each commit as small and clear as possible. For
example, first a commit that makes the necessary refactorings, followed by a
commit that implements the feature as concisely as possible.
