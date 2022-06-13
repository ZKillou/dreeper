import { ApplicationCommandOptionType, Channel, CommandInteraction, CommandInteractionOption, Guild, GuildMember, Message, Role, User, MessageMentions, TextChannel, VoiceChannel, CategoryChannel, TextBasedChannel, ApplicationCommandOptionData, ApplicationCommandSubCommandData } from "discord.js";
import { ApplicationCommandSubGroupData } from 'discord.js/typings'
import { AnyOption, CommandReplyOption } from "../types";
import { DreeperClient } from "./Client";
import { Command } from "./Command";

export class DreeperCommandInteraction {
  client: DreeperClient
  id: string
  command: Command
  user: User
  member?: GuildMember
  channel: TextBasedChannel | null
  guild: Guild | null
  replyMessage: Message | null
  deferred: boolean
  class: CommandInteraction | Message
  options?: DreeperCommandInteractionOptionResolver

  constructor(interaction: CommandInteraction | Message, command: Command) {
    this.client = interaction.client as DreeperClient
    this.id = interaction.id
    this.command = command

    if (interaction instanceof CommandInteraction) this.user = interaction.user
    else this.user = interaction.author
    if (interaction.member instanceof GuildMember)
      this.member = interaction.member
    this.channel = interaction.channel
    this.guild = interaction.guild

    this.replyMessage = null
    this.deferred = false

    this.class = interaction

    this.buildOptions()
  }

  async buildOptions() {
    this.options = await DreeperCommandInteractionOptionResolver.create(this.client, this)
  }

  async reply(options: CommandReplyOption | string): Promise<Message | undefined | null> {
    if (typeof options == "string") options = { content: options }
    if (!(this.class instanceof Message) && (this.class.replied || this.class.deferred)) {
      // @ts-ignore
      if (this.channel) return this.channel.send(options)
      else console.warn(new TypeError("Cannot reply to this message"))
    }

    this.replyMessage = await this.class.reply(options) || null

    return this.replyMessage
  }

  async deferReply(options: CommandReplyOption): Promise<Message | undefined | null> {
    this.deferred = true
    if (this.class instanceof Message) {
      const message = await this.reply({ content: `Loading ...` })
      this.replyMessage = message ?? null
      return this.replyMessage
    } else {
      return await this.class.deferReply(options) as unknown as Message
    }
  }

  async editReply(options: CommandReplyOption): Promise<Message | undefined | null> {
    if (!this.replyMessage) throw new SyntaxError("The reply must be sent before editing it.")
    if (this.class instanceof Message) {
      if (!options.content && this.deferred) options.content = null
      return await this.replyMessage.edit(options)
    } else {
      const message = await this.class.editReply(options)
      return message instanceof Message ? message : null
    }
  }

  inGuild(): boolean {
    if (this.guild) return true
    else return false
  }
}

export class DreeperCommandInteractionOptionResolver {
  client: DreeperClient
  private _group: string | null
  private _subcommand: string | null
  private _hoistedOptions: ResolvedOption[] | ReadonlyArray<ResolvedOption | CommandInteractionOption>
  readonly data: ReadonlyArray<ResolvedOption | CommandInteractionOption>

  private constructor(client: DreeperClient, options: ResolvedOption[] | ReadonlyArray<ResolvedOption> | readonly CommandInteractionOption[]) {
    this.client = client

    this._group = null
    this._subcommand = null
    this._hoistedOptions = options

    if (this._hoistedOptions[0]?.type === 'SUB_COMMAND_GROUP') {
      this._group = this._hoistedOptions[0].name;
      this._hoistedOptions = this._hoistedOptions[0].options ?? [];
    }

    if (this._hoistedOptions[0]?.type === 'SUB_COMMAND') {
      this._subcommand = this._hoistedOptions[0].name;
      this._hoistedOptions = this._hoistedOptions[0].options ?? [];
    }

    this.data = Object.freeze([...options])
  }

  static async create(client: DreeperClient, interaction: DreeperCommandInteraction) {
    let options = await DreeperCommandInteractionOptionResolver.generateOptions(interaction)
    if (options.error) throw TypeError(options.text)
    else var optionsdata = options.result
    if (!optionsdata) throw TypeError("Invalid data provided to build DreeperCommandInteractionOptionResolver")
    return new this(client, optionsdata)
  }

  static async generateOptions(interaction: DreeperCommandInteraction): Promise<generateOptionsResult> {
    if (interaction.class instanceof Message && interaction.client.config.prefix) {
      const { content } = interaction.class
      let args = content.slice(interaction.client.config?.prefix.length).split(/ +/);
      args.shift()

      let hoisted: ApplicationCommandOptionData[] = interaction.command.options
      let i: number = 0

      if (hoisted[0]?.type == "SUB_COMMAND_GROUP") {
        let subcommandgrouplist = hoisted.map(s => s.name)
        if (!args[i]) return { error: true, text: "INVALID_SUBCOMMANDGROUP", intended: subcommandgrouplist, given: "none" }

        let subcommandgroup: ApplicationCommandSubGroupData | undefined = hoisted.find(o => o.name == args[i].toLowerCase()) as any
        if (!subcommandgroup || !subcommandgroup.options) return { error: true, text: "INVALID_SUBCOMMANDGROUP", intended: subcommandgrouplist, given: args[i] }

        hoisted = subcommandgroup.options
        i++

        let subcommand = await DreeperCommandInteractionOptionResolver._extractSubCommand({ hoisted, args, interaction }, i)
        if (subcommand.error) return subcommand
        else var subcommanddata = subcommand.result
        return { result: [{ type: "SUB_COMMAND_GROUP", name: subcommandgroup.name, options: subcommanddata }] }
      }

      if (hoisted[0]?.type == "SUB_COMMAND") {
        let subcommand = await DreeperCommandInteractionOptionResolver._extractSubCommand({ hoisted, args, interaction }, i)

        if (subcommand.error) return subcommand
        else var subcommanddata = subcommand.result

        return { result: subcommanddata }
      }

      let options = await DreeperCommandInteractionOptionResolver._extract({ hoisted, args, interaction })
      if (options.error) return options
      else var optionsdata = options.result

      return { result: optionsdata }

    } else if (interaction.class instanceof CommandInteraction) {
      return { result: interaction.class.options.data }
    } else {
      throw new TypeError("Unknown class used to build a DreeperCommandInteractionOptionResolver")
    }
  }

  static async _extractSubCommand(data: extractOptions, i = 0): Promise<extractResult> {
    let subcommandlist = data.hoisted.map(s => s.name)
    if (!data.args[i]) return { error: true, text: "INVALID_SUBCOMMAND", intended: subcommandlist, given: "none" }

    let subcommand: ApplicationCommandSubCommandData | undefined = data.hoisted.find(o => o.name == data.args[i].toLowerCase()) as any
    if (!subcommand || !subcommand.options) return { error: true, text: "INVALID_SUBCOMMAND", intended: subcommandlist, given: data.args[i] }

    data.hoisted = subcommand.options
    i++

    let options = await DreeperCommandInteractionOptionResolver._extract(data, i)
    if (options.error) return options
    else var optionsdata = options.result
    return { result: [{ type: "SUB_COMMAND", name: subcommand.name, options: optionsdata }] }
  }

  static async _extract(data: extractOptions, i = 0): Promise<extractResult> {
    let options: ResolvedOption[] = []
    for (let j = 0; j < data.hoisted.length; j++) {
      let arg = data.args[i]
      let commandoption: AnyOption = data.hoisted[j] as any

      if (!arg && commandoption.required) {
        return { error: true, text: "MISSING_ARG", intended: commandoption.name }
      } else if (!arg) continue

      let value
      let member
      if (commandoption.type == "NUMBER" || commandoption.type == "INTEGER") {
        value = parseInt(arg)
        if (isNaN(value)) return { error: true, text: "INVALID_NUMBER", given: arg }
        if (commandoption.minValue) if (value < commandoption.minValue) return { error: true, text: "INVALID_NUMBER_SMALL", given: arg, intended: commandoption.minValue }
        if (commandoption.maxValue) if (value < commandoption.maxValue) return { error: true, text: "INVALID_NUMBER_BIG", given: arg, intended: commandoption.maxValue }
      } else if (commandoption.type == "BOOLEAN") {
        if (arg.toLowerCase() != "true" && arg.toLowerCase() != "false") return { error: true, text: "INVALID_BOOLEAN", given: arg }
        value = (arg.toLowerCase() === 'true')
      } else if (commandoption.type == "STRING") {
        if (commandoption._isLong) {
          value = data.args.splice(i).join(" ")
          options.push({ name: commandoption.name, type: commandoption.type, value })
          break
        } else value = arg
      } else if (commandoption.type == "USER") {
        const matches = arg.matchAll(MessageMentions.USERS_PATTERN).next().value
        if (!matches) return { error: true, text: "UNKNOWN_USER" }
        const user = await data.interaction.client.users.fetch(matches[1]).catch()
        const guildmember = await data.interaction.guild?.members.fetch(matches[1]).catch()
        if (!user) return { error: true, text: "UNKNOWN_USER" }
        value = user
        if (guildmember) member = guildmember
      } else if (commandoption.type == "ROLE") {
        const matches = arg.matchAll(MessageMentions.ROLES_PATTERN).next().value
        if (!matches) return { error: true, text: "UNKNOWN_ROLE" }
        const role = await data.interaction.guild?.roles.fetch(matches[1]).catch()
        if (!role) return { error: true, text: "UNKNOWN_ROLE" }
        value = role
      } else if (commandoption.type == "CHANNEL") {
        const matches = arg.matchAll(MessageMentions.CHANNELS_PATTERN).next().value
        if (!matches) return { error: true, text: "UNKNOWN_CHANNEL" }
        const channel = await data.interaction.guild?.channels.fetch(matches[1]).catch()
        if (!channel) return { error: true, text: "UNKNOWN_CHANNEL" }
        value = channel
      } else if (commandoption.type == "MENTIONABLE") {
        let matches = arg.matchAll(MessageMentions.USERS_PATTERN).next().value
        if (matches) {
          const user = await data.interaction.client.users.fetch(matches[1]).catch()
          const guildmember = await data.interaction.guild?.members.fetch(matches[1]).catch()
          if (!user) return { error: true, text: "UNKNOWN_USER" }
          value = user
          if (guildmember) member = guildmember
        } else {
          const matches = arg.matchAll(MessageMentions.ROLES_PATTERN).next().value
          if (!matches) return { error: true, text: "UNKNOWN_MENTIONABLE" }
          const role = await data.interaction.guild?.roles.fetch(matches[1]).catch()
          if (!role) return { error: true, text: "UNKNOWN_ROLE" }
          value = role
        }
      } else {
        value = arg
      }

      if (commandoption.choices) {
        let selected = null
        for (let choice of commandoption.choices) {
          if (selected) break
          if (choice.name.toLowerCase() == (typeof value == "string" ? value.toLowerCase() : value) || (typeof choice.value == "string" ? choice.value.toLowerCase() : choice.value) == (typeof value == "string" ? value.toLowerCase() : value)) {
            selected = choice.value
          }
        }
        if (!selected) return { error: true, text: "ARG_CHOICE_INVALID", given: arg, intended: commandoption.choices.map(c => c.name).join(", ") }
        else value = selected
      }

      options.push({ name: commandoption.name, type: commandoption.type, value, member })
    }

    return { result: options }
  }

  get(name: string, required = false): ResolvedOption | CommandInteractionOption | null {
    const option = this._hoistedOptions.find(opt => opt.name === name);
    if (!option) {
      if (required) {
        throw new TypeError(`COMMAND_INTERACTION_OPTION_NOT_FOUND ${name}`);
      }
      return null;
    }
    return option;
  }

  _getTypedOption(name: string, type: ApplicationCommandOptionType, required: boolean): ResolvedOption | CommandInteractionOption | null {
    const option = this.get(name, required);
    if (!option) {
      return null;
    } else if (option.type !== type) {
      throw new TypeError(`COMMAND_INTERACTION_OPTION_TYPE ${name} ${option.type} ${type}`);
    }
    return option;
  }

  getSubcommand(required = true): string | null {
    if (required && !this._subcommand) {
      throw new TypeError('COMMAND_INTERACTION_OPTION_NO_SUB_COMMAND');
    }
    return this._subcommand;
  }

  getSubcommandGroup(required = true): string | null {
    if (required && !this._group) {
      throw new TypeError('COMMAND_INTERACTION_OPTION_NO_SUB_COMMAND_GROUP');
    }
    return this._group;
  }

  getBoolean(name: string, required = false): boolean | null {
    const option = this._getTypedOption(name, 'BOOLEAN', required);
    return option?.value as boolean ?? null;
  }

  getChannel(name: string, required = false): Channel | TextChannel | VoiceChannel | CategoryChannel | null {
    const option = this._getTypedOption(name, 'CHANNEL', required);
    return option?.value as Channel | TextChannel | VoiceChannel | CategoryChannel ?? null;
  }

  getString(name: string, required = false): string | null {
    const option = this._getTypedOption(name, 'STRING', required);
    return option?.value as string ?? null;
  }

  getInteger(name: string, required = false): number | null {
    const option = this._getTypedOption(name, 'INTEGER', required);
    return option?.value as number ?? null;
  }

  getNumber(name: string, required = false): number | null {
    const option = this._getTypedOption(name, 'NUMBER', required);
    return option?.value as number ?? null;
  }

  getUser(name: string, required = false): User | null {
    const option = this._getTypedOption(name, 'USER', required);
    return option?.value as User ?? null;
  }

  getMember(name: string, required = false): GuildMember | null {
    const option = this._getTypedOption(name, 'USER', required);
    return option?.member as GuildMember ?? null;
  }

  getRole(name: string, required = false): Role | null {
    const option = this._getTypedOption(name, 'ROLE', required);
    return option?.value as Role ?? null;
  }

  getMentionable(name: string, required = false) {
    const option = this._getTypedOption(name, 'MENTIONABLE', required);
    return option?.member ?? option?.value ?? null;
  }
}

interface generateOptionsResult {
  error?: boolean,
  text?: "INVALID_SUBCOMMANDGROUP" | "INVALID_SUBCOMMAND" | "MISSING_ARG" | "INVALID_NUMBER" | "INVALID_NUMBER_SMALL" | "INVALID_NUMBER_BIG" | "INVALID_BOOLEAN" | "UNKNOWN_USER" | "UNKNOWN_ROLE" | "UNKNOWN_CHANNEL" | "UNKNOWN_MENTIONABLE" | "ARG_CHOICE_INVALID",
  intended?: unknown,
  given?: unknown,
  result?: ResolvedOption[] | readonly ResolvedOption[] | readonly CommandInteractionOption[]
}

interface extractResult extends generateOptionsResult {
  result?: ResolvedOption[]
}

interface extractOptions {
  interaction: DreeperCommandInteraction,
  hoisted: ApplicationCommandOptionData[],
  args: string[]
}

interface ResolvedOption {
  type: ApplicationCommandOptionType,
  name: string,
  value?: string | number | boolean | User | Channel | Role,
  member?: GuildMember,
  options?: ResolvedOption[]
}

