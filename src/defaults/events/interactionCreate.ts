import { Interaction } from "discord.js";
import { DreeperClient, DreeperCommandInteraction } from "../../structures";

export const name = "interactionCreate"
export async function execute(client: DreeperClient, interaction: Interaction) {
  if (!interaction.isCommand()) return

  const command = client.commands.get(interaction.commandName)
  if (!command) return

  let cinteraction = new DreeperCommandInteraction(interaction, command)

  if (command.isDeveloperOnly) {
    if (!client.config.owners.includes(interaction.user.id)) return cinteraction.reply({ content: `**:x: | This command is for developers only.**`, ephemeral: true })
  }

  if (command.userPermissions) {
    if (!cinteraction.member?.permissions.has(command.userPermissions)) return cinteraction.reply({ content: `**:x: | You don't have enough permission to use this command. You must have \`${command.userPermissions.join("`, `")}\`.**`, ephemeral: true });
  }

  if (command.botPermissions) {
    if (!cinteraction.guild?.me?.permissions.has(command.botPermissions)) return cinteraction.reply({ content: `**:x: | I don't have enough permission to run this command. I must have \`${command.userPermissions.join("`, `")}\`.**`, ephemeral: true });
  }

  try {
    await command.execute(client, cinteraction)
  } catch (error) {
    return console.error(error)
  }
}