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

  const authorizedUsersInput = core.getInput('github-usernames');

  // check if authorizedUsersInput is empty
  let authorizedUsers = [];
  if (authorizedUsersInput) {
    authorizedUsers = JSON.parse(authorizedUsersInput.toLowerCase());
  }

  const githubActor = core.getInput('github-actor', requiredArgOptions);
  const githubOrg = core.getInput('github-organization', requiredArgOptions);
  const octokit = github.getOctokit(token);

  core.info('Inputs:');
  core.info(`- github-team-slugs: ${authorizedTeams}`);
  core.info(`- github-actor: ${githubActor}`);
  core.info(`- github-organization: ${githubOrg}`);
  core.info(`- github-usernames: ${authorizedUsers}`);
  core.info('');

  let isActorInTeam = false;
  if (authorizedTeams.length === 0) {
    core.setFailed('No authorized teams provided, cannot perform check!.');
    return;
  }

  for (const team of authorizedTeams) {
    if (isActorInTeam) {
      break;
    }
    core.info(`Checking if user ${githubActor} is a member of team ${githubOrg}/${team}`);
    await octokit
      .paginate(octokit.rest.teams.listMembersInOrg, {
        org: githubOrg,
        team_slug: team
      })
      .then(members => {
        core.info(`- Team ${githubOrg}/${team} has ${members.length} members`);
        for (const member of members) {
          if (member.login === githubActor) {
            core.info(`- User ${githubActor} is a member of team ${githubOrg}/${team}`);
            isActorInTeam = true;
            break;
          }
        }
        if (!isActorInTeam) {
          core.info(`- User ${githubActor} is not a member of team ${githubOrg}/${team}`);
        }
      })
      .catch(error => {
        core.info(`- Failed to list team members. Error code: ${error.message}.`);
      });
  }

  if (!isActorInTeam) {
    core.info(`Checking if user ${githubActor} is an authorized user`);
    for (const authorizedUser of authorizedUsers) {
      if (authorizedUser === githubActor) {
        core.info(`- User ${githubActor} is an authorized user`);
        isActorInTeam = true;
        break;
      }
    }

    if (!isActorInTeam) {
      core.setFailed(`User ${githubActor} is not authorized!`);
    }
  }
  core.info('');
}

run();
