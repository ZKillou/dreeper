import { Message } from 'discord.js';
import { DreeperClient, DreeperCommandInteraction } from '../../structures';

export const name = 'messageCreate';
export async function execute(client: DreeperClient, message: Message) {
  const PREFIX = client.config.prefix;

  if (!PREFIX) return;
  if (message.author.bot) return;
  if (message.channel.type === 'DM') return;
  if (!message.content.toLowerCase().startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).split(/ +/);
  const commandName = args?.shift()?.toLowerCase();
  if (!commandName) return;

  const command = client.commands.get(commandName);

  if (!command || !command.category) return;

  let interaction = new DreeperCommandInteraction(message, command);

  if (command.isDeveloperOnly) {
    if (!client.config.owners.includes(interaction.user.id))
      return interaction.reply({
        content: `**:x: | This command is for developers only.**`,
        ephemeral: true,
      });
  }

  if (command.userPermissions) {
    if (!interaction.member?.permissions.has(command.userPermissions))
      return interaction.reply({
        content: `**:x: | You don't have enough permission to use this command. You must have \`${command.userPermissions.join(
          '`, `'
        )}\`.**`,
        ephemeral: true,
      });
  }

  if (command.botPermissions) {
    if (!interaction.guild?.me?.permissions.has(command.botPermissions))
      return interaction.reply({
        content: `**:x: | I don't have enough permission to run this command. I must have \`${command.userPermissions.join(
          '`, `'
        )}\`.**`,
        ephemeral: true,
      });
  }

  try {
    await command.execute(client, interaction);
  } catch (error) {
    return console.error(error);
  }
}
