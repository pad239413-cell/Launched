# Contributing Guidelines

Thank you for considering contributing to our project! These guidelines will help ensure a smooth and efficient collaboration.

## Setup
1. **Clone the Repository**: 
   ```bash
   git clone https://github.com/pad239413-cell/Launched.git
   cd Launched
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Run the Project**: 
   ```bash
   npm start
   ```

## Code Style
- Follow our project's existing code style (use `eslint` and `prettier` for JavaScript).
- Aim for clarity and maintainability in your code.

## Component Development
1. **Create a New Component**:
   - Components should be placed in the `src/components` directory.
   - Use meaningful names for both files and directories.
2. **Documentation**:
   - Include comments and documentation for your components.

## Adding Features
- Discuss with the team before starting a new feature.
- Branch off `main` for new features:
  ```bash
  git checkout -b feature/my-new-feature
  ```
- Ensure to write tests for the new feature.

## Testing
- Run tests regularly to ensure your changes do not break existing functionality:
  ```bash
  npm test
  ```
- Follow test naming conventions.

## Pull Request Process
1. **Open a Pull Request**:
   - Ensure your branch is up to date with `main`.
   ```bash
   git checkout main
   git pull origin main
   git checkout feature/my-new-feature
   git rebase main
   ```
2. **Description**:
   - Include a detailed description of your changes and reference any related issues.
3. **Review**:
   - Be open to feedback and ready to make changes.
   - Once approved, merge your pull request.

Thank you for contributing! Every little bit helps to improve this project!