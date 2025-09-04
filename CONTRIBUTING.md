---
sidebar_position: 7
---

# 🙏 Contributing to Scaffold-Stark

We welcome contributions to Scaffold-Stark!

This section aims to provide an overview of the contribution workflow to help us make the contribution process effective for everyone involved.

:::caution
The project is under active development. You can view the open Issues, follow the development process, and contribute to the project.
:::caution

## Getting Started

You can contribute to this repo in many ways:

- Solve open issues
- Report bugs or feature requests
- Improve the documentation

Contributions are made via Issues and Pull Requests (PRs). A few general guidelines for contributions:

- Search for existing Issues and PRs before creating your own.
- Contributions should only fix/add the functionality in the issue OR address style issues, _not both_.
- If you're running into an error, please give context. Explain what you're trying to do and how to reproduce the error.
- Please use the same formatting in the code repository. You can configure your IDE to do this by using the prettier / linting config files included in each package.
- If applicable, please edit the README.md file to reflect changes.

## Issues

Issues should be used to report problems, request a new feature, or discuss potential changes before a PR is created.

### Solve an Issue

Scan through our [existing issues](https://github.com/Scaffold-Stark/scaffold-stark-2/issues) to find one that interests you.

If a contributor is working on the issue, they will be assigned to that individual. If you find an issue to work on, you are welcome to assign it to yourself and open a PR with a fix for it.

### Create a New Issue

If a related issue doesn't exist, you can open a new issue.

Please refer to the following when you are creating an issue:

- Provide as much context as possible. Over-communicate to give the most detail to the reader.
- Include the steps to reproduce the issue or the reason for adding the feature.
- Screenshots, videos, etc., are highly appreciated.
- Assign appropriate tags.

## Pull Requests

### Pull Request Process

We follow the ["fork-and-pull" Git workflow](https://github.com/Scaffold-Stark/scaffold-stark-2)

1. Fork the repo
2. Clone the project
3. Create a new branch with a descriptive name
4. Commit your changes to the new branch
5. Push changes to your fork
6. Open a PR in our repository and tag one of the maintainers to review your PR

### Tips for Pull Requests

- Create a title for the PR that accurately defines the work done with conventional commits with proper prefix. Make sure we can tell what you have done in the title.

```
fix: useScaffoldReadContract unable to read error
feat: switch buttons within debug page
chore: bump version of starknetjs
docs: update README.md for new dependencies
build: update CI for branch sync
```

- Structure the description neatly to make it easy to consume by the readers. For example, you can include bullet points and screenshots instead of having one large paragraph.
- If the PR is an attempt that solves an issue, include `Fixes #XXX` or `Closes #XXX`in your description so that GitHub can link the issue and close it.
- Have a good commit message that summarises the work done, use conventional commits like the above example as well.
- Make sure to tag maintainers for review, reach out in the Telegram group if not sure!

Once you submit your PR:

- We may ask questions, request additional information, or ask for changes to be made before a PR can be merged. Please note that these are to make the PR clear for everyone involved and aims to create a frictionless interaction process.
- As you update your PR and apply changes, mark each conversation resolved.

Once the PR is approved, we'll "squash-and-merge" to keep the git commit history clean.
