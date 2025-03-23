---
title: "Deploying a Hugo Site to GitHub Pages"
date: 2023-06-20
---

## Introduction

GitHub Pages provides a convenient and free way to host Hugo sites directly from a GitHub repository. This post will walk through the process of deploying a Hugo site to GitHub Pages.

## Prerequisites

Before starting, make sure you have:

1. A GitHub account
2. Git installed on your local machine
3. A Hugo site ready for deployment

## Setting Up Your Repository

Create a new GitHub repository for your Hugo site. For a project site like this one, any repository name works fine.

## Creating a GitHub Actions Workflow

The easiest way to deploy a Hugo site is with GitHub Actions. Create a workflow file at `.github/workflows/hugo.yml`:

```yaml
name: Deploy Hugo site to GitHub Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
        with:
          submodules: true
          fetch-depth: 0

      - name: Setup Hugo
        uses: peaceiris/actions-hugo@v2
        with:
          hugo-version: 'latest'
          extended: true
          
      - name: Build
        run: hugo --minify
        
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./public
```

## Configuring baseURL

Make sure your `config.toml` has the correct baseURL:

```toml
baseURL = "https://rulercosta.github.io/neuralwired/" # GitHub Pages project site URL
```

## Pushing Your Changes

After setting up the workflow, push your changes to GitHub:

```bash
git add .
git commit -m "Set up GitHub Pages deployment"
git push origin main
```

## Configuring GitHub Pages

In your repository settings, navigate to the "Pages" section and configure the source to deploy from the `gh-pages` branch that the GitHub Action creates.

## Conclusion

With GitHub Actions handling the build and deployment process, publishing updates to your Hugo site is as simple as committing changes to your repository. This workflow allows you to focus on creating content rather than managing deployment processes.
