# Developing the Data Platform

This document provides guidance for developers in our engineering teams on setting up their development environment, including GitHub and local machine setup.

## Repository Standards

All our repositories include a [development container](https://code.visualstudio.com/docs/devcontainers/containers) configuration. Usage is mandatory for our engineering teams as it allows us to provide an isolated environment for each project with the required tooling and configuration to develop consistently.

Additionally, all our repositories include a baseline set of GitHub Actions:

- [CodeQL Analysis](https://github.com/ministryofjustice/data-platform-github-actions/blob/main/docs/usage/workflows/codeql-analysis.md)
- [Dependency Review](https://github.com/ministryofjustice/data-platform-github-actions/blob/main/docs/usage/workflows/dependency-review.md)
- [OpenSSF Scorecard](https://github.com/ministryofjustice/data-platform-github-actions/blob/main/docs/usage/workflows/openssf-scorecard.md) (only if it's a public repository)
- [pre-commit Updater](https://github.com/ministryofjustice/data-platform-github-actions/blob/main/docs/usage/workflows/pre-commit-updater.md)
- [Spell Check](https://github.com/ministryofjustice/data-platform-github-actions/blob/main/docs/usage/workflows/spell-check.md)
- [Super Linter](https://github.com/ministryofjustice/data-platform-github-actions/blob/main/docs/usage/workflows/super-linter.md)
- [Zizmor](https://github.com/ministryofjustice/data-platform-github-actions/blob/main/docs/usage/workflows/zizmor.md)

They also include the following supporting configuration:

> [!NOTE]
> The contents of these files may differ by repository, depending on the programming languages or frameworks used.

- [`.editorconfig`](../.editorconfig)
- [`.pre-commit-config.yaml`](../.pre-commit-config.yaml)
- [`.prettierignore`](../.prettierignore)
- [`cspell.json`](../cspell.json)

Git commit signing is required for all repositories.

## GitHub Setup

Each developer is responsible for creating their own GitHub account. To create an account, follow [GitHub's documentation](https://docs.github.com/en/get-started/start-your-journey/creating-an-account-on-github).

> [!WARNING]
> In accordance with GitHub's [Terms of Service](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service#3-account-requirements), do not create multiple accounts.

> [!IMPORTANT]
> The Ministry of Justice does not provision or manage your GitHub account.
>
> We cannot assist in recovering your account, so you must take measures to ensure you can recover it without our support. These include:
>
> - Saving your 2FA recovery codes
> - Having a valid personal recovery email address associated with your account

After creating a GitHub account, join the [Ministry of Justice's GitHub organisation](https://github.com/orgs/ministryofjustice/sso).

## Machine Setup

> [!WARNING]
> This documentation applies only to macOS.

### Requirements

> [!TIP]
> Most required software is available via [Homebrew](https://brew.sh/), but that is outside the scope of this document.

- 1Password
  - Available in the Self Service app
- Visual Studio Code
  - Available in the Self Service app
- Dev Containers extension (`ms-vscode-remote.remote-containers`)
  - Available in the Visual Studio Code Marketplace ([Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers))
- Docker Desktop
  - Available from Docker ([Docker Desktop for Mac](https://docs.docker.com/desktop/setup/install/mac-install/))
- GitHub CLI
  - Available from GitHub ([GitHub CLI](https://cli.github.com/))

### SSH Setup

> [!TIP]
> We recommend using 1Password to manage SSH keys.

You can manage SSH credentials locally on macOS or via 1Password:

- macOS
  - [Generating a new SSH key and adding it to the ssh-agent](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent?platform=mac)
  - [Adding a new SSH key to your GitHub account](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account?platform=mac&tool=webui)
  - [SSH commit signature verification](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification#ssh-commit-signature-verification)

- [1Password](https://developer.1password.com/docs/ssh)

Once configured, you can authenticate with GitHub and sign your commits.

### GitHub CLI Setup

To authenticate the GitHub CLI with your GitHub account, run the following command:

```bash
gh auth login --git-protocol ssh --hostname github.com --skip-ssh-key --web
```

Follow the prompts to complete authentication.

## Interacting with Repositories

### Cloning Repositories

You can clone repositories using the GitHub CLI or Git directly. For example, using the GitHub CLI:

```bash
gh repo clone ministryofjustice/data-platform
```

or using Git:

```bash
git clone git@github.com:ministryofjustice/data-platform.git
```

Once you have cloned a repository, open it in Visual Studio Code. You will be prompted to reopen the folder in a development container.

For example:

![Reopen in Container Prompt](./img/developing/reopen-in-container.gif)

### Open in Dev Container

Alternatively, you can open a repository directly in a development container using the "Open in Dev Container" button found in each repository's README.

For example:

![Open in Dev Container Button](./img/developing/open-in-dev-container.gif)

To reopen a closed development container, you can either:

- Use the Command Palette (`Cmd+Shift+P`), run "Remote Explorer: Focus on Dev Containers View", then alt-click the container and select the arrow icon to open it.
- Use the "Open in Dev Container" button in the README again.
