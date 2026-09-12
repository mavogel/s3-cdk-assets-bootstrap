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
    // 'mvc-bot' (the PROJEN_GITHUB_TOKEN identity) is deliberately excluded:
    // if it ever authors a PR itself (e.g. a future upgrade-projen workflow),
    // GitHub rejects a review from the same account that authored the PR
    // ("Can not approve your own pull request"). Such PRs are auto-approved
    // via Mergify instead, which posts the review as the Mergify app, a
    // different actor. See https://github.com/mavogel/mvc-projen/pull/74.
    allowedUsernames: [
      'dependabot',
      'dependabot[bot]',
      'github-bot',
      'github-actions[bot]',
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

// projen's AutoMerge component hardcodes the deprecated `commit_message_template`
// queue rule field with no option to configure it. Mergify requires migrating to
// the declarative `commit_message_format` by 2026-09-30, so replace it here.
// see https://docs.mergify.com/workflow/actions/merge#migrating-from-commit_message_template
project.tryFindObjectFile('.mergify.yml')?.addDeletionOverride(
  'queue_rules.0.commit_message_template',
);
project.tryFindObjectFile('.mergify.yml')?.addOverride(
  'queue_rules.0.commit_message_format',
  {
    title: 'pr-title',
    body: 'pr-body',
  },
);

// Should 'mvc-bot' (PROJEN_GITHUB_TOKEN) ever author a PR itself (e.g. a
// future upgrade-projen workflow), auto-approve.yml can't approve it - same
// identity opening and approving is a self-approval, which GitHub rejects
// (see autoApproveOptions above). Have Mergify approve these instead: it
// posts the review as the Mergify app, satisfying the queue's
// `#approved-reviews-by>=1` condition without a self-approval.
// see https://github.com/mavogel/mvc-projen/pull/74
project.tryFindObjectFile('.mergify.yml')?.addOverride(
  'pull_request_rules.1',
  {
    name: 'Auto-approve self-authored upgrade-projen PRs',
    conditions: [
      'author=mvc-bot',
      'label=auto-approve',
    ],
    actions: {
      review: {
        type: 'APPROVE',
        message: 'Automatically approved: self-authored projen upgrade PR.',
      },
    },
  },
);

project.synth();