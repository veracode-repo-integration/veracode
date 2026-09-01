const core = require('@actions/core');
const fs = require('fs');
const path = require('path');
const runFixSast = require('./run-fix-sast');
const createPr = require('./create-pr');
const uploadPrComment = require('./upload-pr-comment');

async function main() {
  try {
    const githubToken = core.getInput('github-token');
    const repository = core.getInput('repository');
    const branch = core.getInput('branch');
    const githubApiUrl = core.getInput('github-api-url');
    const prNumber = core.getInput('pr-number');
    const fixSastParams = core.getInput('fix-sast-params');

    const workspaceDir = process.env.GITHUB_WORKSPACE;
    const statusFilePath = path.join(workspaceDir, 'source-code', 'sast-fix-status');
    const actionPath = `${__dirname}/..`;

    core.info('Starting Veracode Fix for SAST action...');

    // Run Fix for SAST
    core.info('Running Fix for SAST...');
    const fixSastOutput = await runFixSast(workspaceDir, actionPath, fixSastParams);

    if (!fixSastOutput.hasChanges) {
      core.info('No changes detected. Skipping PR creation.');
      fs.writeFileSync(statusFilePath, 'NO_CHANGES_DETECTED', null, 2);
      return;
    }

    // Create Pull Request
    core.info('Creating pull request...');
    const prCreateOutput = await createPr(
      workspaceDir,
      repository,
      branch,
      githubToken,
      githubApiUrl
    );

    // Post PR comment on original PR
    core.info('Posting comment on original PR...');
    await uploadPrComment(
      workspaceDir,
      repository,
      prNumber,
      githubToken,
      githubApiUrl
    );

    core.info('Veracode Fix for SAST action completed successfully.');
  } catch (error) {
    core.setFailed(error.message);
    process.exit(1);
  }
}

main();
