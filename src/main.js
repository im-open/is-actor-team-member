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

  let isActorInTeam = false;
  for (const team in authorizedTeams) {
    await octokit
      .paginate(octokit.rest.teams.listMembersInOrg, {
        org: githubOrg,
        team_slug: team
      })
      .then(members => {
        for (const member of members) {
          if (member.login === githubActor) {
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
    console.log(`ERROR: User ${githubActor} is not an authorized member of any of the teams`);
  } else {
    core.info(`User ${githubActor} is an authorized member of one of the teams`);
    console.log(`SUCCESS: User ${githubActor} is an authorized member of one of the teams`)
  }
}

run();
