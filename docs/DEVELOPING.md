# Developing the Data Platform

This document provides guidance for developers and engineers that want to contribute to Data Platform's repositories.

All of our repositories include a [development container](https://code.visualstudio.com/docs/devcontainers/containers) configuration, usage is mandatory for Data Platform's engineering teams as it allows us to provide an isolated environment for each project with the required tooling and configuration to develop consistently.

Additionally all of our repositories include a baseline set of GitHub Actions:

- [CodeQL Analysis](https://github.com/ministryofjustice/data-platform-github-actions/blob/main/docs/usage/workflows/codeql-analysis.md)

- [Dependency Review](https://github.com/ministryofjustice/data-platform-github-actions/blob/main/docs/usage/workflows/dependency-review.md)

- [OpenSSF Scorecard](https://github.com/ministryofjustice/data-platform-github-actions/blob/main/docs/usage/workflows/openssf-scorecard.md) (only if it's a public repository)

- [pre-commit Updater](https://github.com/ministryofjustice/data-platform-github-actions/blob/main/docs/usage/workflows/pre-commit-updater.md)

- [Spell Check](https://github.com/ministryofjustice/data-platform-github-actions/blob/main/docs/usage/workflows/spell-check.md)

- [Super Linter](https://github.com/ministryofjustice/data-platform-github-actions/blob/main/docs/usage/workflows/super-linter.md)

- [Zizmor](https://github.com/ministryofjustice/data-platform-github-actions/blob/main/docs/usage/workflows/zizmor.md)

As well as supporting configuration:

> [!NOTE]
> The contents of each of these files might differ per repository as each will potentially contain different programming languages or frameworks

- [`.editorconfig`](../.editorconfig)

- [`.pre-commit-config.yaml`](../.pre-commit-config.yaml)

- [`.prettierignore`](../.prettierignore)

- [`cspell.json`](../cspell.json)

Git commit signing is required on all of our repositories.

> [!IMPORTANT]
> Your GitHub account is not provisioned or managed by the Ministry of Justice.
>
> The Ministry of Justice cannot assist in recovering your account, so you must take measures to ensure you can do this without the support from the Data Platform
> or Internal IT. These include:
>
> - Saving your 2FA recovery codes
> - Have a valid personal recovery email address associated with your account

## Environment Setup

> [!WARNING]
> This documentation is only applicable to macOS

### Requirements

> [!TIP]
> Most of the the required software is available via [Homebrew](https://brew.sh/), but that is outside the scope of this document.

- 1Password
  - Available in the Self Service app

- Visual Studio Code
  - Available in the Self Service app

- Dev Containers extension (`ms-vscode-remote.remote-containers`)
  - Available in the Visual Studio Code Marketplace ([link](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers))

- Docker Desktop
  - Available from Docker ([link](https://docs.docker.com/desktop/setup/install/mac-install/))

- GitHub CLI
  - Available from GitHub ([link](https://cli.github.com/))

### SSH Setup

> [!TIP]
> 1Password is the recommended way to manage SSH keys for Data Platform's engineering teams.

There's a few options for managing SSH credentials; locally on macOS, or using 1Password.

- macOS
  - [Generating a new SSH key and adding it to the ssh-agent](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent?platform=mac)

  - [Adding a new SSH key to your GitHub account](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account?platform=mac&tool=webui)

  - [SSH commit signature verification](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification#ssh-commit-signature-verification)

- [1Password](https://developer.1password.com/docs/ssh)
