import { awscdk, ReleasableCommits } from 'projen';
import { DependabotScheduleInterval } from 'projen/lib/github';
const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '2.1.0',
  defaultReleaseBranch: 'main',
  name: 's3-cdk-assets-bootstrap',
  projenrcTs: true,
  description: 'A CDK app that creates your public S3 buckets in all regions.',

  deps: [
    'aws-cdk-github-oidc@v2.4.1',
  ],
  autoApproveOptions: {
    allowedUsernames: [
      'dependabot',
      'dependabot[bot]',
      'github-bot',
      'github-actions[bot]',
      'mvc-bot',
    ],
    // The name of the secret that has the GitHub PAT for auto-approving PRs with permissions repo, workflow, write:packages
    // Generate a new PAT (https://github.com/settings/tokens/new) and add it to your repo's secrets
    // NOTE: comes from the mavogel Org
    secret: 'PROJEN_GITHUB_TOKEN',
  },
  dependabot: true,
  dependabotOptions: {
    scheduleInterval: DependabotScheduleInterval.WEEKLY,
    labels: ['dependencies', 'auto-approve'],
    groups: {
      default: {
        patterns: ['*'],
        excludePatterns: ['aws-cdk*', 'projen'],
      },
    },
    ignore: [{ dependencyName: 'aws-cdk-lib' }],
  },
  // // See https://github.com/projen/projen/discussions/4040#discussioncomment-11905628
  releasableCommits: ReleasableCommits.ofType([
    'feat',
    'fix',
    'chore',
    'refactor',
    'perf',
  ]),
  githubOptions: {
    pullRequestLintOptions: {
      semanticTitleOptions: {
        // see commit types here: https://www.conventionalcommits.org/en/v1.0.0/#summary
        types: [
          'feat',
          'fix',
          'chore',
          'refactor',
          'perf',
          'docs',
          'style',
          'test',
          'build',
          'ci',
        ],
      },
    },
  },
  versionrcOptions: {
    types: [
      { type: 'feat', section: 'Features' },
      { type: 'fix', section: 'Bug Fixes' },
      { type: 'chore', section: 'Chores' },
      { type: 'docs', section: 'Docs' },
      { type: 'style', hidden: true },
      { type: 'refactor', hidden: true },
      { type: 'perf', section: 'Performance' },
      { type: 'test', hidden: true },
    ],
  },
});

// projen's AutoMerge component hardcodes `delete_head_branch: {}` in the
// mergify rule with no option to disable it. Strip it from the generated
// .mergify.yml so Mergify does not delete head branches on merge.
// see https://github.com/mavogel/s3-cdk-assets-bootstrap/pull/265
project.tryFindObjectFile('.mergify.yml')?.addDeletionOverride(
  'pull_request_rules.0.actions.delete_head_branch',
);

project.synth();