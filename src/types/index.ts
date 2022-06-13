import { ApplicationCommandOptionChoiceData, ApplicationCommandOptionData, ApplicationCommandType, AutocompleteInteraction, InteractionDeferReplyOptions, InteractionReplyOptions, MessageEditOptions, MessageOptions, PermissionString, WebhookEditMessageOptions } from "discord.js"
import { ChannelTypes } from "discord.js/typings/enums"
import { Config, DreeperClient, DreeperCommandInteraction } from "../structures"

export interface ConfigOptions {
  prefix?: string,
  state?: "release" | "dev",
  tokens: {
    release: string,
    dev?: string
  },
  dbPaths?: {
    release: string,
    dev?: string
  },
  owners: string[],
}

export interface MongoDB {
  init: () => void,
}

export interface DreeperOptions {
  config: Config | ConfigOptions,
  mongoose?: any,
  dirs: {
    commands?: string,
    events?: string,
    functions?: string
  },
  defaults: {
    events: {
      ready: true,
      messageCreate: true,
      interactionCreate: false
    }
  }
}

export interface CommandOptions {
  type?: ApplicationCommandType,
  name: string,
  description: string,
  category?: string,
  options: ApplicationCommandOptionData[],
  isDeveloperOnly?: boolean,
  execute: (client: DreeperClient, interaction: DreeperCommandInteraction) => Promise<void>,
  autocomplete?: (client: DreeperClient, interaction: AutocompleteInteraction) => Promise<void>,
  userPermissions?: PermissionString[],
  botPermissions?: PermissionString[]
}

export interface Event {
  name: string,
  once?: boolean,
  execute: (client: DreeperClient) => Promise<void>
}

export interface AnyOption {
  type: "STRING" | "INTEGER" | "BOOLEAN" | "USER" | "CHANNEL" | "ROLE" | "MENTIONABLE" | "NUMBER",
  name: string,
  nameLocalizations: string[],
  nameLocalized: string,
  description: string,
  descriptionLocalizations?: string[],
  descriptionLocalized?: string,
  required?: boolean
  autocomplete?: boolean,
  choices?: ApplicationCommandOptionChoiceData[],
  channelTypes?: ChannelTypes[],
  minValue?: number,
  maxValue?: number,
  _isLong?: boolean
}

export type CommandReplyOption = InteractionReplyOptions
  & MessageOptions & InteractionDeferReplyOptions & WebhookEditMessageOptions & MessageEditOptions