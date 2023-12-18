const core = require('@actions/core'); // TODO:  Run `npm install @actions/core` to get latest version
const github = require('@actions/github');  // TODO:  run an npm install for this if using

// When used, this requiredArgOptions will cause the action to error if a value has not been provided.
const requiredArgOptions = {
  required: true,
  trimWhitespace: true
};

async function run() {
  const token = core.getInput("github-token", requiredArgOptions);
  const authorizedTeamsInput = core.getInput("github-team-slugs", requiredArgOptions).toLowerCase();
  const authorizedTeams = JSON.parse(authorizedTeamsInput);
  const githubActor = core.getInput("github-actor", requiredArgOptions);
  const githubOrg = core.getInput("github-organization", requiredArgOptions);
  const octokit = github.getOctokit(token);  

  let isActorInTeam = false;
  for (const team in authorizedTeams) {
    await octokit.paginate(
      octokit.rest.teams.listMembersInOrg, {
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
  } else {
    core.info(`User ${githubActor} is an authorized member of one of the teams`);
  } 
}

run();
