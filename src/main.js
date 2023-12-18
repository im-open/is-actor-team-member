const core = require('@actions/core');
const github = require('@actions/github');

// When used, this requiredArgOptions will cause the action to error if a value has not been provided.
const requiredArgOptions = {
  required: true,
  trimWhitespace: true
};

async function run() {
  const token = core.getInput('github-token', requiredArgOptions);
  const authorizedTeamsInput = core.getInput('github-team-slugs', requiredArgOptions).toLowerCase();
  const authorizedTeams = JSON.parse(authorizedTeamsInput);
  const githubActor = core.getInput('github-actor', requiredArgOptions);
  const githubOrg = core.getInput('github-organization', requiredArgOptions);
  const octokit = github.getOctokit(token);

  core.info('Inputs:');
  core.info(`- github-team-slugs: ${authorizedTeams}`);
  core.info(`- github-actor: ${githubActor}`);
  core.info(`- github-organization: ${githubOrg}`);
  core.info('');

  let isActorInTeam = false;
  for (const team of authorizedTeams) {
    core.info(`Checking if user ${githubActor} is a member of team ${githubOrg}/${team}`);
    await octokit
      .paginate(octokit.rest.teams.listMembersInOrg, {
        org: githubOrg,
        team_slug: team
      })
      .then(members => {
        core.info(`Team ${githubOrg}/${team} has ${members.length} members`);
        for (const member of members) {
          if (member.login === githubActor) {
            core.info(`User ${githubActor} is a member of team ${githubOrg}/${team}`);
            isActorInTeam = true;
            break;
          }
        }
      })
      .catch(error => {
        core.info(`Failed to list team members. Error code: ${error.message}.`);
      });
  }

  if (!isActorInTeam) {
    core.setFailed(`User ${githubActor} is not an authorized member of any of the teams`);
  }
  core.info('');
}

run();
