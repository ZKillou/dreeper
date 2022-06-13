import { DreeperClient } from '../../structures';
import { compareArrays, deployCommands } from '../../utils/deploy';

export const name = 'ready';
export async function execute(client: DreeperClient) {
  console.log(
    `Logged in as : ${client.user?.tag || 'Unknown User'} on ${
      client.guilds.cache.size
    } guilds.`
  );

  if (client.doptions.defaults.events.interactionCreate) {
    const app = await client.application?.fetch();
    const appCommands = app?.commands.cache.map(c => c.toJSON());
    const clientCommands = client.commands.map(c => c.toJSON());
    if (appCommands && clientCommands)
      if (!compareArrays(appCommands, clientCommands)) deployCommands(client);
  }
}
